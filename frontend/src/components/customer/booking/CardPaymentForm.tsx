import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface CardPaymentFormProps {
    onSubmit: (cardDetails: CardDetails) => void;
    isLoading?: boolean;
}

interface CardDetails {
    cardNumber: string;
    cardHolder: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    saveCard: boolean;
}

export default function CardPaymentForm({ onSubmit, isLoading = false }: CardPaymentFormProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiryMonth, setExpiryMonth] = useState('');
    const [expiryYear, setExpiryYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [errors, setErrors] = useState<Partial<CardDetails>>({});

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '');
        const chunks = cleaned.match(/.{1,4}/g) || [];
        return chunks.join(' ').slice(0, 19); // 16 digits + 3 spaces
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value.replace(/\D/g, ''));
        setCardNumber(formatted);
        if (errors.cardNumber) setErrors({ ...errors, cardNumber: undefined });
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CardDetails> = {};

        if (cardNumber.replace(/\s/g, '').length !== 16) {
            newErrors.cardNumber = 'Invalid card number';
        }

        if (!cardHolder.trim()) {
            newErrors.cardHolder = 'Card holder name is required';
        }

        if (!expiryMonth || !expiryYear) {
            newErrors.expiryMonth = 'Expiry date is required';
        }

        if (cvv.length !== 3) {
            newErrors.cvv = 'Invalid CVV';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                cardNumber,
                cardHolder,
                expiryMonth,
                expiryYear,
                cvv,
                saveCard,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Number */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
            </div>

            {/* Card Holder */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Holder Name
                </label>
                <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => {
                        setCardHolder(e.target.value.toUpperCase());
                        if (errors.cardHolder) setErrors({ ...errors, cardHolder: undefined });
                    }}
                    placeholder="JOHN DOE"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase ${errors.cardHolder ? 'border-red-500' : 'border-gray-300'
                        }`}
                />
                {errors.cardHolder && <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>}
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={expiryMonth}
                            onChange={(e) => {
                                setExpiryMonth(e.target.value);
                                if (errors.expiryMonth) setErrors({ ...errors, expiryMonth: undefined });
                            }}
                            className={`flex-1 px-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month.toString().padStart(2, '0')}>
                                    {month.toString().padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                        <select
                            value={expiryYear}
                            onChange={(e) => {
                                setExpiryYear(e.target.value);
                                if (errors.expiryMonth) setErrors({ ...errors, expiryMonth: undefined });
                            }}
                            className={`flex-1 px-3 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">YY</option>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                                <option key={year} value={year.toString().slice(-2)}>
                                    {year.toString().slice(-2)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.expiryMonth && <p className="mt-1 text-sm text-red-600">{errors.expiryMonth}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                    </label>
                    <input
                        type="password"
                        value={cvv}
                        onChange={(e) => {
                            setCvv(e.target.value.replace(/\D/g, '').slice(0, 3));
                            if (errors.cvv) setErrors({ ...errors, cvv: undefined });
                        }}
                        placeholder="123"
                        maxLength={3}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${errors.cvv ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                </div>
            </div>

            {/* Save Card */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="saveCard" className="text-sm text-gray-700 cursor-pointer">
                    Save this card for future bookings
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Lock size={20} />
                        Pay Securely
                    </>
                )}
            </button>

            <p className="text-xs text-center text-gray-500">
                Your payment information is encrypted and secure
            </p>
        </form>
    );
}
