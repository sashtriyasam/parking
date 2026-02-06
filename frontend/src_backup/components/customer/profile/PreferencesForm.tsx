import { useState } from 'react';
import { Shield, Bell, Eye, EyeOff, Lock, Smartphone, Globe, Moon, Check } from 'lucide-react';

export default function PreferencesForm() {
    const [prefs, setPrefs] = useState({
        marketing_emails: true,
        push_notifications: true,
        darkMode: false,
        twoFactor: false,
        biometricLogin: true,
    });

    const toggle = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const sections = [
        {
            title: 'Notifications',
            desc: 'Configure how you want to be alerted.',
            items: [
                { id: 'marketing_emails', label: 'Marketing Emails', desc: 'Offers and promotion alerts', icon: Bell },
                { id: 'push_notifications', label: 'Booking Alerts', desc: 'Real-time updates on your parking', icon: Smartphone },
            ]
        },
        {
            title: 'Security & Access',
            desc: 'Protect your account and wallet.',
            items: [
                { id: 'twoFactor', label: 'Two-Factor Auth', desc: 'OTP verification on new logins', icon: Shield },
                { id: 'biometricLogin', label: 'Face / Touch ID', desc: 'Instant access via biometric', icon: Lock },
            ]
        },
        {
            title: 'App Experience',
            desc: 'Customize the visual look and feel.',
            items: [
                { id: 'darkMode', label: 'Dark Mode', desc: 'Easier on the eyes (experimental)', icon: Moon },
            ]
        }
    ];

    return (
        <div className="space-y-12">
            <div>
                <h3 className="text-2xl font-black text-gray-900">Security & Preferences</h3>
                <p className="text-sm font-bold text-gray-400">Configure your security and notification layers.</p>
            </div>

            <div className="space-y-10">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="px-1">
                            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{section.title}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{section.desc}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.items.map((item) => {
                                const isActive = prefs[item.id as keyof typeof prefs];
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => toggle(item.id as keyof typeof prefs)}
                                        className={`
                                            p-6 rounded-[32px] border-2 transition-all flex items-start gap-4 text-left group
                                            ${isActive ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-gray-50 border-gray-50 hover:border-gray-100'}
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-black ${isActive ? 'text-gray-900' : 'text-gray-400'} uppercase tracking-widest`}>{item.label}</p>
                                                {isActive && <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Check size={10} strokeWidth={4} /></div>}
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-10 border-t border-gray-100">
                <button className="w-full py-6 bg-[#111827] text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                    Update Security Vault <Shield size={20} />
                </button>
                <div className="mt-8 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Globe size={14} /> Region: IN (Asia-Pacific)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <EyeOff size={14} /> GDPR Compliant
                    </div>
                </div>
            </div>
        </div>
    );
}
