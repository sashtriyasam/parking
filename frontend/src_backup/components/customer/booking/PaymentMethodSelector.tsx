import { CreditCard, Smartphone, Wallet, DollarSign } from 'lucide-react';
import type { PaymentMethod } from '../../../store/bookingFlowStore';

interface PaymentMethodSelectorProps {
    selectedMethod: PaymentMethod | null;
    onSelectMethod: (method: PaymentMethod) => void;
}

const paymentMethods = [
    {
        id: 'CARD' as PaymentMethod,
        name: 'Credit/Debit Card',
        icon: CreditCard,
        description: 'Visa, Mastercard, Rupay',
    },
    {
        id: 'UPI' as PaymentMethod,
        name: 'UPI',
        icon: Smartphone,
        description: 'Google Pay, PhonePe, Paytm',
    },
    {
        id: 'WALLET' as PaymentMethod,
        name: 'Digital Wallet',
        icon: Wallet,
        description: 'Paytm, Amazon Pay',
    },
    {
        id: 'PAY_AT_EXIT' as PaymentMethod,
        name: 'Pay at Exit',
        icon: DollarSign,
        description: 'Cash or card at facility',
    },
];

export default function PaymentMethodSelector({
    selectedMethod,
    onSelectMethod,
}: PaymentMethodSelectorProps) {
    return (
        <div className="space-y-3">
            <h4 className="font-bold text-gray-900 mb-4">Select Payment Method</h4>
            {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                    <button
                        key={method.id}
                        type="button"
                        onClick={() => onSelectMethod(method.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${isSelected
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <div
                            className={`p-3 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                                }`}
                        >
                            <Icon size={24} />
                        </div>
                        <div className="flex-1">
                            <p className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                {method.name}
                            </p>
                            <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                        {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
