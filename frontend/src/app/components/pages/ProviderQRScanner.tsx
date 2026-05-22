import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Keyboard,
  CheckCircle2,
  Loader2,
  Car,
  Camera,
  Search,
  User,
  Phone,
  Clock,
  History,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  Mail
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/services/api';

export function ProviderQRScanner() {
    const navigate = useNavigate();
    const [manualId, setManualId] = useState('');
    const [isScanning, setIsScanning] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);

    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;

        if (isScanning && !scanResult) {
            const timer = setTimeout(async () => {
                const readerElement = document.getElementById('reader');
                if (!readerElement) return;

                try {
                    html5QrCode = new Html5Qrcode("reader");
                    
                    const config = { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" }, 
                        config,
                        (decodedText) => {
                            console.log("[Scanner] QR Decoded:", decodedText);
                            if (html5QrCode) {
                                html5QrCode.stop().catch(err => console.error("[Scanner] Stop Error:", err));
                            }
                            handleVerify(decodedText);
                        },
                        (errorMessage) => {
                            // Suppress frame-by-frame errors
                        }
                    );
                } catch (err) {
                    console.error("Camera start failed", err);
                }
            }, 500);

            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(err => console.error("Cleanup stop failed", err));
                }
            };
        }
    }, [isScanning, scanResult]);

    const handleVerify = async (scannedData: string) => {
        const rawData = (scannedData || manualId).trim();
        if (!rawData) return;

        setIsLoading(true);
        try {
            let params: any = {};
            
            if (rawData.startsWith('{') && rawData.endsWith('}')) {
                try {
                    const parsed = JSON.parse(rawData);
                    if (parsed.ticketId) params.ticket_id = parsed.ticketId;
                    else if (parsed.vehicleNumber) params.vehicle_number = parsed.vehicleNumber;
                } catch (e) {
                    params.vehicle_number = rawData;
                }
            } else {
                params.vehicle_number = rawData;
            }

            console.log(`[Scanner] Verifying with Params:`, params);
            const response = await apiClient.get('/provider/check-vehicle', { params });
            const data = response.data.data;
            const ticket = data.active_ticket;

            if (!ticket) {
                toast.error('No active booking found for this vehicle');
                setIsScanning(true);
                return;
            }

            setScanResult(ticket);
            toast.success('Ticket Identified');
            setIsScanning(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Verification failed');
            setIsScanning(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkEntry = async () => {
        if (!scanResult) return;
        setIsLoading(true);
        try {
            await apiClient.post(`/provider/bookings/${scanResult.id}/mark-entry`);
            toast.success('Entry marked - Gate Opened');
            setScanResult(null);
            setIsScanning(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to mark entry');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessExit = async () => {
        if (!scanResult) return;
        setIsLoading(true);
        try {
            const response = await apiClient.post('/bookings/checkout', { 
                ticket_id: scanResult.id 
            });
            const data = response.data.data;
            toast.success(`Exit Processed. Total Fee: ₹${data.total_fee || scanResult.current_fee}`);
            setScanResult(null);
            setIsScanning(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process checkout');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-background text-foreground pt-20 pb-24 relative overflow-x-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="max-w-xl mx-auto px-4 relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold gap-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit Scanner
                    </Button>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-sm text-primary font-bold text-[10px] tracking-wider uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Gate Monitor
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isScanning && !scanResult ? (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-6"
                        >
                            <div className="text-center">
                                <h1 className="text-3xl font-black text-foreground tracking-tight mb-1 font-display">Scanner Ready</h1>
                                <p className="text-muted-foreground text-sm font-medium">Scan parking pass QR code or input plate number</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-2 bg-primary/5 rounded-lg blur-xl opacity-40 pointer-events-none" />
                                <div className="relative bg-card rounded-lg overflow-hidden border border-border shadow-lg">
                                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/50">
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Camera Feed</span>
                                        </div>
                                    </div>

                                    <div className="relative aspect-square bg-black overflow-hidden">
                                        <div id="reader" className="w-full h-full" />
                                        <div className="absolute inset-0 pointer-events-none z-10">
                                            {/* Camera Viewport Bracket Corners */}
                                            <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-primary rounded-tl-sm" />
                                            <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-primary rounded-tr-sm" />
                                            <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-primary rounded-bl-sm" />
                                            <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-primary rounded-br-sm" />
                                            
                                            {/* Scanning Line Animation */}
                                            <motion.div 
                                                className="absolute left-8 right-8 h-[2px] bg-primary/80"
                                                animate={{ top: ['20%', '80%', '20%'] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Card className="rounded-lg border-border bg-card shadow-sm">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <Keyboard className="w-3.5 h-3.5" />
                                        Manual Registration Search
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="PLATE NUMBER (E.G. MH12AB1234)" 
                                            className="h-10 rounded-md bg-secondary border-border font-bold uppercase tracking-wider text-foreground"
                                            value={manualId}
                                            onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                        />
                                        <Button 
                                            className="h-10 px-5 font-bold rounded-md bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm transition-all"
                                            onClick={() => handleVerify(manualId)}
                                            disabled={isLoading || !manualId}
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-5"
                        >
                            <Card className="rounded-lg border-border bg-card overflow-hidden shadow-md">
                                <div className="p-6 text-center bg-secondary/30 border-b border-border flex flex-col items-center">
                                    <div className={`w-14 h-14 rounded-md flex items-center justify-center mb-3 shadow-sm ${
                                        scanResult.status === 'PENDING_PAYMENT' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight text-foreground font-display">{scanResult.customer_name}</h3>
                                    
                                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2">
                                        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                            <Phone className="w-3 h-3" /> {scanResult.customer_phone}
                                        </span>
                                        {scanResult.customer_email && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                                <Mail className="w-3 h-3" /> {scanResult.customer_email}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                                            scanResult.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        }`}>
                                            {scanResult.status === 'PENDING_PAYMENT' ? 'Pre-Booked' : 'On-Site'}
                                        </span>
                                    </div>
                                </div>
                                
                                <CardContent className="p-5 space-y-6">
                                    {/* Vehicle Info */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/50">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">License Plate</p>
                                            <p className="text-base font-black tracking-tight text-foreground flex items-center gap-1.5 font-display">
                                                <Car className="w-4 h-4 text-primary" /> {scanResult.vehicle_number}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/50">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Allocated Slot</p>
                                            <p className="text-base font-black tracking-tight text-foreground font-display">
                                                {scanResult.slot} <span className="text-xs text-muted-foreground font-normal">({scanResult.floor})</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Duration & Fee */}
                                    <div className="bg-secondary/70 border border-border p-4 rounded-lg relative overflow-hidden">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Time Parked</p>
                                                <p className="text-lg font-black tracking-tight text-foreground font-display">
                                                    {Math.floor(scanResult.duration_minutes / 60)}h {scanResult.duration_minutes % 60}m
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">In: {formatTime(scanResult.entry_time)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Active Total Fee</p>
                                                <p className="text-2xl font-black tracking-tight text-primary font-display">₹{scanResult.current_fee}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Rate: ₹10/30 mins</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        {(scanResult.status === 'PENDING_PAYMENT' || scanResult.status === 'RESERVED') ? (
                                            <Button 
                                                size="lg"
                                                className="w-full h-12 rounded-md font-bold text-sm bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm gap-2"
                                                onClick={handleMarkEntry}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Mark Vehicle Entry & Open Gate
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="lg"
                                                className="w-full h-12 rounded-md font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2"
                                                onClick={handleProcessExit}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                Process Settlement & Open Exit
                                            </Button>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="h-10 rounded-md font-medium border-border text-foreground hover:bg-secondary"
                                                onClick={() => { setScanResult(null); setIsScanning(true); }}
                                            >
                                                Back to Scanner
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="h-10 rounded-md font-medium text-muted-foreground hover:text-foreground gap-1.5"
                                                onClick={() => navigate('/provider/bookings')}
                                            >
                                                <History className="w-3.5 h-3.5" /> Bookings Log
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] font-medium text-amber-800 dark:text-amber-400 leading-normal">
                                    Operator Warning: Ensure any overstay fee has been paid or settled via UPI/cash before verifying checkout and raising the exit gate.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Global Styles for Scanner UI */}
            <style dangerouslySetInnerHTML={{ __html: `
                #reader { border: none !important; position: relative; }
                #reader video { 
                    object-fit: cover !important; 
                    width: 100% !important; 
                    height: 100% !important;
                    border-radius: 0 !important;
                }
                #reader__scan_region { display: flex; justify-content: center; height: 100% !important; }
                #reader__dashboard { display: none !important; }
                img[alt="Camera menu"] { display: none !important; }
                #reader img { display: none !important; }
            `}} />
        </div>
    );
}
