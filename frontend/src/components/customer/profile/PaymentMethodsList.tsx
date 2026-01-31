import { CreditCard, Plus, Trash2 } from 'lucide-react';

export default function PaymentMethodsList() {
    // Mock data - would be fetched from API
    const paymentMethods = [
        { id: '1', type: 'card', last4: '1234', brand: 'Visa', is_default: true },
        { id: '2', type: 'card', last4: '5678', brand: 'Mastercard', is_default: false },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <Plus size={16} />
                    Add Card
                </button>
            </div>

            <div className="space-y-3">
                {paymentMethods.map((method) => (
                    <div
                        key={method.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <CreditCard size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">
                                    {method.brand} •••• {method.last4}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {method.is_default && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                            Default
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    💳 Your payment information is securely stored and encrypted. We never store your full card details.
                </p>
            </div>
        </div>
    );
}
