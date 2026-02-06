import { Check } from 'lucide-react';

interface BookingProgressBarProps {
    currentStep: 1 | 2 | 3 | 4;
}

const steps = [
    { number: 1, label: 'Vehicle Details' },
    { number: 2, label: 'Review Booking' },
    { number: 3, label: 'Payment' },
    { number: 4, label: 'Confirmation' },
];

export default function BookingProgressBar({ currentStep }: BookingProgressBarProps) {
    return (
        <div className="w-full bg-white border-b border-gray-200 py-6 px-4 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={step.number} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center relative">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step.number < currentStep
                                            ? 'bg-green-500 text-white'
                                            : step.number === currentStep
                                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {step.number < currentStep ? (
                                        <Check size={20} />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium whitespace-nowrap ${step.number <= currentStep
                                            ? 'text-gray-900'
                                            : 'text-gray-400'
                                        }`}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-4 relative top-[-16px]">
                                    <div
                                        className={`h-full transition-all ${step.number < currentStep
                                                ? 'bg-green-500'
                                                : 'bg-gray-200'
                                            }`}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
