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
  ArrowUpRight
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
                            console.log("QR Raw Data:", decodedText);
                            if (html5QrCode) {
                                html5QrCode.stop().catch(err => console.error("Stop failed", err));
                            }
                            handleVerify(decodedText);
                        },
                        (errorMessage) => {
                            // Suppress frame-by-frame errors
                        }
                    );
                } catch (err) {
                    console.error("Camera start failed", err);
                    // Don't toast error every time, maybe just log
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

            const response = await apiClient.get('/provider/check-vehicle', { params });
            const data = response.data.data;
            const ticket = data.active_ticket;

            if (!ticket) {
                // If not found, stay in scanning mode but show a specialized toast
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
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pt-20 pb-24 relative overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-64 bg-primary/5 dark:bg-primary/10 pointer-events-none" />
            
            <div className="max-w-xl mx-auto px-6 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit Scanner
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-black text-[10px] tracking-wider uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Gate Monitor
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isScanning && !scanResult ? (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center">
                                <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">Scanner Ready</h1>
                                <p className="text-muted-foreground font-medium">Point at QR code or enter plate manually</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl opacity-50" />
                                <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-border shadow-2xl">
                                    <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Feed</span>
                                        </div>
                                    </div>

                                    <div className="relative aspect-square bg-black overflow-hidden">
                                        <div id="reader" className="w-full h-full" />
                                        <div className="absolute inset-0 pointer-events-none z-10">
                                            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl shadow-[0_0_10px_var(--primary)]" />
                                            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl shadow-[0_0_10px_var(--primary)]" />
                                            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl shadow-[0_0_10px_var(--primary)]" />
                                            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl shadow-[0_0_10px_var(--primary)]" />
                                            <motion.div 
                                                className="absolute left-10 right-10 h-0.5 bg-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
                                                animate={{ top: ['20%', '80%', '20%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Card className="rounded-[2rem] border-border bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        <Keyboard className="w-3.5 h-3.5" />
                                        Manual Entry
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="PLATE NUMBER" 
                                            className="h-12 rounded-xl bg-background border-border font-bold uppercase tracking-wider"
                                            value={manualId}
                                            onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                        />
                                        <Button 
                                            className="h-12 px-6 font-black rounded-xl shadow-lg shadow-primary/20"
                                            onClick={() => handleVerify(manualId)}
                                            disabled={isLoading || !manualId}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <Card className="rounded-[3rem] border-primary/20 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl shadow-primary/10">
                                <div className="p-8 text-center bg-primary/5 border-b border-border">
                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 ${
                                        scanResult.status === 'PENDING_PAYMENT' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'
                                    }`}>
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tighter">{scanResult.customer_name}</h3>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                                            <Phone className="w-3 h-3" /> {scanResult.customer_phone}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            scanResult.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {scanResult.status === 'PENDING_PAYMENT' ? 'Pre-Booked' : 'On-Site'}
                                        </span>
                                    </div>
                                </div>
                                
                                <CardContent className="p-8 space-y-8">
                                    {/* Vehicle Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Plate</p>
                                            <p className="text-lg font-black tracking-tight flex items-center gap-2">
                                                <Car className="w-4 h-4 text-primary" /> {scanResult.vehicle_number}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Slot</p>
                                            <p className="text-lg font-black tracking-tight">{scanResult.slot} <span className="text-[10px] text-muted-foreground">({scanResult.floor})</span></p>
                                        </div>
                                    </div>

                                    {/* Duration & Fee */}
                                    <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Clock className="w-16 h-16" />
                                        </div>
                                        <div className="relative z-10 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Time Elapsed</p>
                                                <p className="text-2xl font-black tracking-tight">
                                                    {Math.floor(scanResult.duration_minutes / 60)}h {scanResult.duration_minutes % 60}m
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1">In: {formatTime(scanResult.entry_time)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-primary uppercase mb-1">Current Fee</p>
                                                <p className="text-3xl font-black tracking-tighter text-primary">₹{scanResult.current_fee}</p>
                                                <p className="text-[10px] text-slate-500 font-bold mt-1">₹10/30 mins</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        {(scanResult.status === 'PENDING_PAYMENT' || scanResult.status === 'RESERVED') ? (
                                            <Button 
                                                size="lg"
                                                className="w-full h-16 rounded-3xl font-black text-lg shadow-xl shadow-primary/30 gap-3"
                                                onClick={handleMarkEntry}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                                Mark Entry (Open Gate)
                                            </Button>
                                        ) : (
                                            <Button 
                                                size="lg"
                                                variant="default"
                                                className="w-full h-16 rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/30 gap-3 bg-emerald-600 hover:bg-emerald-700"
                                                onClick={handleProcessExit}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                                                Settle & Open Exit
                                            </Button>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                variant="outline" 
                                                className="h-14 rounded-2xl font-bold border-border"
                                                onClick={() => { setScanResult(null); setIsScanning(true); }}
                                            >
                                                Back to Scanner
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="h-14 rounded-2xl font-bold text-muted-foreground gap-2"
                                                onClick={() => navigate('/provider/bookings')}
                                            >
                                                <History className="w-4 h-4" /> View Logs
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-start gap-3 p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                                    Confirm payment has been collected via UPI or Cash before opening the gate if the user has overstayed.
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
