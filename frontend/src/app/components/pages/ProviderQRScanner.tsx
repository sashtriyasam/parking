import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Zap, 
  Info, 
  ShieldCheck, 
  ScanLine, 
  Keyboard,
  CheckCircle2,
  Loader2,
  Car,
  Camera,
  Search
} from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export function ProviderQRScanner() {
    const navigate = useNavigate();
    const [ticketId, setTicketId] = useState('');
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

                    // Use 'environment' for the back camera specifically
                    await html5QrCode.start(
                        { facingMode: "environment" }, 
                        config,
                        (decodedText) => {
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
                    toast.error("Camera access failed. Check permissions.");
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

    const handleVerify = async (id: string) => {
        const tid = id || ticketId;
        if (!tid) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`/api/v1/provider/check-vehicle?ticketId=${tid}`);
            const data = response.data.data;
            
            if (!data) {
                toast.error('Invalid Ticket');
                setIsScanning(true);
                return;
            }

            setScanResult(data);
            toast.success('Ticket Verified');
            setIsScanning(false);
        } catch (error) {
            toast.error('Verification failed');
            setIsScanning(true);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessAction = async () => {
        if (!scanResult) return;
        setIsLoading(true);
        try {
            await axios.post('/api/v1/bookings/end', { ticket_id: scanResult.id });
            toast.success('Processed successfully');
            setScanResult(null);
            setIsScanning(true);
        } catch (error) {
            toast.error('Failed to process');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pt-20 pb-12 relative overflow-x-hidden">
            {/* Design accents */}
            <div className="absolute top-0 left-0 w-full h-64 bg-primary/5 dark:bg-primary/10 pointer-events-none" />
            
            <div className="max-w-xl mx-auto px-6 relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Cancel
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary font-black text-[10px] tracking-wider uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Secure Gateway
                    </div>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-foreground tracking-tighter mb-3">Gate Control</h1>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto">Instant check-in and check-out via back-camera scanning</p>
                </div>

                <AnimatePresence mode="wait">
                    {isScanning && !scanResult ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Scanner Section */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl opacity-50" />
                                <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-border shadow-2xl">
                                    <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Main Camera</span>
                                        </div>
                                        <Camera className="w-4 h-4 text-muted-foreground" />
                                    </div>

                                    <div className="relative aspect-square bg-black overflow-hidden">
                                        <div id="reader" className="w-full h-full" />
                                        
                                        {/* Viewfinder Overlays */}
                                        <div className="absolute inset-0 pointer-events-none z-10">
                                            {/* Corner brackets */}
                                            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                                            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                                            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                                            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                                            
                                            {/* Scanning Line */}
                                            <motion.div 
                                                className="absolute left-10 right-10 h-0.5 bg-primary/50 shadow-[0_0_15px_var(--primary)]"
                                                animate={{ top: ['20%', '80%', '20%'] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manual Entry */}
                            <Card className="rounded-[2rem] border-border bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        <Keyboard className="w-3.5 h-3.5" />
                                        Manual ID Verification
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="TICK-XXXX" 
                                            className="h-12 rounded-xl bg-background border-border font-bold uppercase"
                                            value={ticketId}
                                            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                                        />
                                        <Button 
                                            className="h-12 px-6 font-black rounded-xl shadow-lg shadow-primary/20"
                                            onClick={() => handleVerify(ticketId)}
                                            disabled={isLoading || !ticketId}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <Card className="rounded-[3rem] border-primary/20 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl shadow-primary/10">
                                <div className="p-10 text-center bg-primary/5 border-b border-border">
                                    <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30 rotate-3">
                                        <CheckCircle2 className="w-12 h-12 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tighter">Verified</h3>
                                    <p className="text-primary font-bold uppercase text-[10px] tracking-widest mt-2 px-3 py-1 bg-primary/10 rounded-full inline-block">
                                        {scanResult?.status === 'ACTIVE' ? 'Checkout Ready' : 'Entry Approved'}
                                    </p>
                                </div>
                                
                                <CardContent className="p-10 space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-border">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Plate</p>
                                            <p className="text-xl font-black tracking-tight">{scanResult?.vehicle_number}</p>
                                        </div>
                                        <div className="p-5 rounded-[2rem] bg-primary/5 border border-primary/10">
                                            <p className="text-[10px] font-black text-primary/60 uppercase mb-2">Slot</p>
                                            <p className="text-xl font-black text-primary tracking-tight">{scanResult?.slot?.slot_number || 'A-1'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-border">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Car className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">Facility</p>
                                                <p className="text-sm font-bold">{scanResult?.facility?.name || 'Main Gate'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 flex flex-col gap-3">
                                        <Button 
                                            size="lg"
                                            className="w-full h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/30 gap-3"
                                            onClick={handleProcessAction}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                                            Process {scanResult?.status === 'ACTIVE' ? 'Exit' : 'Entry'}
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="font-bold text-muted-foreground"
                                            onClick={() => { setScanResult(null); setIsScanning(true); }}
                                        >
                                            Scan Next Vehicle
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-900 rounded-full border border-border shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Official Secure Gateway Interface
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Scanner Styling Injection to fix orientation and camera feed UI */}
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
            `}} />
        </div>
    );
}
