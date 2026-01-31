import { Calendar, Car, MapPin, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { MonthlyPass } from '../../../types';

interface PassCardProps {
    pass: MonthlyPass;
    onUse?: (pass: MonthlyPass) => void;
}

export default function PassCard({ pass, onUse }: PassCardProps) {
    const calculateDaysRemaining = () => {
        const now = new Date();
        const endDate = new Date(pass.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const daysRemaining = calculateDaysRemaining();
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
    const isExpired = daysRemaining === 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                            MONTHLY PASS
                        </span>
                        {isExpiringSoon && (
                            <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                EXPIRING SOON
                            </span>
                        )}
                        {isExpired && (
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                EXPIRED
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl font-black mb-1">
                        {pass.facility?.name || 'Parking Facility'}
                    </h3>
                    <p className="text-indigo-100 text-sm flex items-start gap-1">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                        {pass.facility?.address || 'Address not available'}
                    </p>
                </div>

                {/* QR Code */}
                <div className="ml-4">
                    <div className="bg-white p-3 rounded-xl">
                        <QRCodeSVG
                            value={JSON.stringify({
                                passId: pass.id,
                                facilityId: pass.facility_id,
                                vehicleType: pass.vehicle_type,
                            })}
                            size={80}
                            level="M"
                        />
                    </div>
                </div>
            </div>

            {/* Pass Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-indigo-200" />
                        <p className="text-xs text-indigo-200">Valid Period</p>
                    </div>
                    <p className="font-bold text-sm">{formatDate(pass.start_date)}</p>
                    <p className="text-xs text-indigo-200">to</p>
                    <p className="font-bold text-sm">{formatDate(pass.end_date)}</p>
                </div>

                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Car size={18} className="text-indigo-200" />
                        <p className="text-xs text-indigo-200">Vehicle Type</p>
                    </div>
                    <p className="font-bold text-lg capitalize">{pass.vehicle_type.toLowerCase()}</p>
                    <p className="text-xs text-indigo-200 mt-1">
                        {daysRemaining} days remaining
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-indigo-200">Usage</span>
                    <span className="font-semibold">
                        {Math.round(((30 - daysRemaining) / 30) * 100)}% complete
                    </span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div
                        className="bg-white rounded-full h-2 transition-all"
                        style={{ width: `${Math.min(((30 - daysRemaining) / 30) * 100, 100)}%` }}
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={() => onUse?.(pass)}
                disabled={isExpired}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isExpired
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg'
                    }`}
            >
                <QrCode size={20} />
                {isExpired ? 'Pass Expired' : 'Use Pass'}
            </button>

            {/* Pass ID */}
            <p className="text-center text-xs text-indigo-200 mt-3 font-mono">
                Pass ID: {pass.id.slice(0, 8).toUpperCase()}
            </p>
        </div>
    );
}
