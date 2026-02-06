import { useState } from 'react';
import { Smartphone } from 'lucide-react';

interface UPIPaymentFormProps {
    onSubmit: (upiId: string) => void;
    isLoading?: boolean;
}

export default function UPIPaymentForm({ onSubmit, isLoading = false }: UPIPaymentFormProps) {
    const [upiId, setUpiId] = useState('');
    const [error, setError] = useState('');

    const validateUPI = (id: string): boolean => {
        // Basic UPI ID validation: username@bankname
        const regex = /^[\w.-]+@[\w.-]+$/;
        return regex.test(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateUPI(upiId)) {
            setError('Please enter a valid UPI ID (e.g., username@paytm)');
            return;
        }

        onSubmit(upiId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={upiId}
                        onChange={(e) => {
                            setUpiId(e.target.value.toLowerCase());
                            if (error) setError('');
                        }}
                        placeholder="username@paytm"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none lowercase ${error ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <p className="mt-2 text-xs text-gray-500">
                    Enter your UPI ID (e.g., yourname@paytm, yourname@gpay)
                </p>
            </div>

            {/* Popular UPI Apps */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Popular UPI Apps</p>
                <div className="grid grid-cols-3 gap-3">
                    {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                        <div
                            key={app}
                            className="bg-white border border-gray-200 rounded-lg p-3 text-center"
                        >
                            <p className="text-xs font-medium text-gray-700">{app}</p>
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || !upiId}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Smartphone size={20} />
                        Pay with UPI
                    </>
                )}
            </button>

            <p className="text-xs text-center text-gray-500">
                You'll be redirected to your UPI app to complete the payment
            </p>
        </form>
    );
}
