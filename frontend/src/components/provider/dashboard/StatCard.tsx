import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    colorScheme?: 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';
    subtitle?: string;
}

export default function StatCard({ title, value, change, icon: Icon, colorScheme = 'indigo', subtitle }: StatCardProps) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        slate: 'bg-slate-50 text-slate-600',
    };

    const changeColor = change && change > 0 ? 'text-emerald-500' : change && change < 0 ? 'text-red-500' : 'text-gray-400';

    return (
        <div className="group relative bg-white rounded-[40px] p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-3">{title}</p>
                        <h3 className="text-4xl font-black text-gray-900 leading-none">{value}</h3>
                        {subtitle && (
                            <p className="text-sm font-bold text-gray-500 mt-2">{subtitle}</p>
                        )}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors[colorScheme]} group-hover:scale-110 transition-transform shadow-sm`}>
                        <Icon size={32} />
                    </div>
                </div>

                {change !== undefined && (
                    <div className="mt-auto pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${changeColor}`}>
                                {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change)}%
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">vs yesterday</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-10 -right-10 text-indigo-50/30 opacity-0 group-hover:opacity-100 transition-all">
                <Icon size={140} strokeWidth={1} />
            </div>
        </div>
    );
}
