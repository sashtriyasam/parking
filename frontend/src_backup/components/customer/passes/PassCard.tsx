import { MapPin, ChevronRight, Car, Bike, Truck, Ruler as Scooter, ShieldCheck } from 'lucide-react';
import type { MonthlyPass } from '../../../types';

interface PassCardProps {
    pass: MonthlyPass;
    onUse: (pass: MonthlyPass) => void;
}

export default function PassCard({ pass, onUse }: PassCardProps) {
    const isExpired = pass.status === 'EXPIRED';
    const facility = pass.facility;

    const getVehicleIcon = () => {
        switch (pass.vehicle_type) {
            case 'CAR': return <Car size={24} />;
            case 'BIKE': return <Bike size={24} />;
            case 'SCOOTER': return <Scooter size={24} />;
            case 'TRUCK': return <Truck size={24} />;
            default: return <Car size={24} />;
        }
    };

    return (
        <div
            onClick={() => onUse(pass)}
            className={`
                relative rounded-[40px] overflow-hidden group transition-all duration-500 cursor-pointer
                ${isExpired ? 'bg-gray-50 border border-gray-200 opacity-60' : 'bg-[#111827] text-white shadow-2xl shadow-indigo-200 hover:-translate-y-2 ring-4 ring-transparent hover:ring-indigo-100'}
            `}
        >
            {/* Header / Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-32 transition-transform group-hover:translate-x-24 duration-700" />

            <div className="p-8 relative z-10 flex flex-col h-full">
                {/* Status & Icon */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white shadow-lg'}`}>
                            {isExpired ? 'EXPIRED' : 'ACTIVE PASS'}
                        </span>
                        {!isExpired && (
                            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldCheck size={12} /> VERIFIED
                            </span>
                        )}
                    </div>
                    <div className={`p-4 rounded-2xl ${isExpired ? 'bg-gray-100 text-gray-400' : 'bg-white/10 backdrop-blur-md text-indigo-400'}`}>
                        {getVehicleIcon()}
                    </div>
                </div>

                {/* Facility Info */}
                <div className="mb-10">
                    <h3 className={`text-2xl font-black tracking-tight leading-tight ${isExpired ? 'text-gray-900' : 'text-white'}`}>
                        {facility?.name || 'Main Facility'}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm font-bold">
                        <MapPin size={16} className="shrink-0" />
                        <span className="truncate">{facility?.address || 'City Center, MG Road'}</span>
                    </div>
                </div>

                {/* Validity Grid */}
                <div className="grid grid-cols-2 gap-8 mb-10 pt-8 border-t border-white/10">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 leading-none">Valid From</p>
                        <p className={`text-sm font-black ${isExpired ? 'text-gray-600' : 'text-white'}`}>
                            {new Date(pass.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 leading-none">Expires On</p>
                        <p className={`text-sm font-black ${isExpired ? 'text-gray-600' : 'text-white'}`}>
                            {new Date(pass.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-6 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pass ID</span>
                        <span className={`text-sm font-mono ${isExpired ? 'text-gray-500' : 'text-indigo-300'}`}>
                            {pass.id.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                    {!isExpired && (
                        <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-xl shadow-indigo-900/40">
                            <ChevronRight size={24} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
