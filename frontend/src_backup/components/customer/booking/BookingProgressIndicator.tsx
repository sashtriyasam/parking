import { Check } from 'lucide-react';

interface BookingProgressIndicatorProps {
    currentStep: number;
}

const steps = [
    { id: 1, name: 'Vehicle' },
    { id: 2, name: 'Review' },
    { id: 3, name: 'Payment' },
    { id: 4, name: 'Confirm' },
];

export function BookingProgressIndicator({ currentStep }: BookingProgressIndicatorProps) {
    return (
        <div className="py-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto relative px-4">
                {/* Connector Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 transition-all duration-500 z-0"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500
                                    ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' :
                                        isActive ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-white border-gray-100 text-gray-400'}
                                `}
                            >
                                {isCompleted ? <Check size={20} strokeWidth={4} /> : <span className="font-black text-sm">{step.id}</span>}
                            </div>
                            <span className={`absolute -bottom-7 text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                {step.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
