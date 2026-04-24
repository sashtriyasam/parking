import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  ArrowLeft, 
  Zap, 
  Info, 
  ShieldCheck, 
  ScanLine, 
  Keyboard,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Car
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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

    // Real-time scanning logic
    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (isScanning && !scanResult) {
            // Give the DOM a moment to render the #reader element
            const timer = setTimeout(() => {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
                );

                scanner.render(
                    (decodedText) => {
                        // On success
                        if (scanner) {
                            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
                        }
                        handleVerify(decodedText);
                    },
                    (errorMessage) => {
                        // Silently handle scan errors (common during active scanning)
                    }
                );
            }, 300);

            return () => {
                clearTimeout(timer);
                if (scanner) {
                    scanner.clear().catch(error => console.error("Failed to clear scanner during cleanup", error));
                }
            };
        }
    }, [isScanning, scanResult]);

    const handleVerify = async (id: string) => {
        const tid = id || ticketId;
        if (!tid) return;

        setIsLoading(true);
        try {
            // First check if it's an entry or exit
            // We'll use the check-vehicle endpoint which returns active status
            const response = await axios.get(`/api/v1/provider/check-vehicle?ticketId=${tid}`);
            const data = response.data.data;
            
            if (!data) {
                toast.error('Invalid Ticket ID or QR Code');
                return;
            }

            setScanResult(data);
            toast.success('Ticket Verified Successfully');
            setIsScanning(false);
        } catch (error) {
            toast.error('Verification failed. Invalid ticket.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessAction = async () => {
        if (!scanResult) return;

        setIsLoading(true);
        try {
            // Process exit
            await axios.post('/api/v1/bookings/end', { ticket_id: scanResult.id });
            toast.success('Check-out processed successfully');
            setScanResult(null);
            setIsScanning(true);
        } catch (error) {
            toast.error('Failed to process action');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] pt-20 pb-12 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
            </div>

            <div className="max-w-xl mx-auto px-6 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-white font-bold"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <div className="flex items-center gap-2 text-indigo-400 font-black tracking-tighter">
                        <ShieldCheck className="w-5 h-5" />
                        SECURE GATEWAY
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Smart QR Scanner</h1>
                    <p className="text-slate-400 font-medium">Position the customer QR code within the frame</p>
                </div>

                <AnimatePresence mode="wait">
                    {isScanning && !scanResult ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="space-y-8"
                        >
                            {/* Scanner Frame */}
                            <div className="relative aspect-square max-w-[320px] mx-auto group overflow-hidden rounded-[2.5rem]">
                                {/* The actual camera feed element */}
                                <div id="reader" className="w-full h-full" />
                                
                                {/* Overlay styling to match design */}
                                <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/30 rounded-[2.5rem]" />
                                
                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-indigo-500 rounded-tl-[2.5rem] pointer-events-none" />
                                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-indigo-500 rounded-tr-[2.5rem] pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-indigo-500 rounded-bl-[2.5rem] pointer-events-none" />
                                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-indigo-500 rounded-br-[2.5rem] pointer-events-none" />

                                {/* Scanning Animation Line */}
                                <motion.div 
                                    className="absolute left-6 right-6 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20 pointer-events-none"
                                    animate={{ top: ['15%', '85%', '15%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                            </div>

                            {/* Manual Input Fallback */}
                            <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-700">
                                <div className="flex items-center gap-2 mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <Keyboard className="w-4 h-4" />
                                    Manual Entry
                                </div>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Enter Ticket ID (e.g. TICK-1234)" 
                                        className="bg-slate-900/50 border-slate-700 text-white font-bold h-12 rounded-xl focus:ring-indigo-500"
                                        value={ticketId}
                                        onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                                    />
                                    <Button 
                                        className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl"
                                        onClick={() => handleVerify(ticketId)}
                                        disabled={isLoading || !ticketId}
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <p className="text-slate-500 text-xs font-medium flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    Instant online/offline ticket validation
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                <div className="p-8 text-center border-b border-slate-700 bg-indigo-600/10">
                                    <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                                        <CheckCircle2 className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white">Ticket Validated</h3>
                                    <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mt-1">Ready for {scanResult?.status === 'ACTIVE' ? 'Checkout' : 'Entry'}</p>
                                </div>
                                
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Vehicle No.</p>
                                            <p className="text-lg font-black text-white">{scanResult?.vehicle_number}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Slot</p>
                                            <p className="text-lg font-black text-indigo-400">{scanResult?.slot?.slot_number || 'Auto'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-900 rounded-lg">
                                                <Car className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Facility</p>
                                                <p className="text-sm font-bold text-white">{scanResult?.facility?.name || 'Your Facility'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-900 rounded-lg">
                                                <ScanLine className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Ticket ID</p>
                                                <p className="text-sm font-mono text-slate-300">{scanResult?.id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-700 flex gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 border-slate-700 text-slate-400 hover:text-white font-bold h-12"
                                            onClick={() => { setScanResult(null); setIsScanning(true); }}
                                        >
                                            Scan Another
                                        </Button>
                                        <Button 
                                            className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-lg shadow-indigo-500/20"
                                            onClick={handleProcessAction}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                            Process {scanResult?.status === 'ACTIVE' ? 'Exit' : 'Entry'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/30 rounded-full border border-slate-700/50">
                        <Info className="w-4 h-4 text-slate-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            Ensure good lighting for faster scanning
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
