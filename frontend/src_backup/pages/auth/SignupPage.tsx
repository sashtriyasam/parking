import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, Lock, Briefcase, ArrowRight, Loader2, Car } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
        role: 'CUSTOMER' as 'CUSTOMER' | 'PROVIDER',
    });
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const signupMutation = useMutation({
        mutationFn: authService.register,
        onSuccess: (data) => {
            setAuth(data.data, data.accessToken, data.refreshToken);
            const redirectPath = data.data.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search';
            navigate(redirectPath);
        },
        onError: (error: any) => {
            alert(error.message || 'Signup failed');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        signupMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[450px]">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <Car className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900">
                            Park<span className="text-primary">Easy</span>
                        </span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Join ParkEasy to simplify your parking journey</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="e.g. name@domain.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="+91 98765 43210"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Account Type</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'CUSTOMER' | 'PROVIDER' })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="CUSTOMER">Customer (Book Parking)</option>
                                    <option value="PROVIDER">Provider (List Space)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={signupMutation.isPending}
                            className="w-full py-3.5 bg-primary text-white rounded-lg font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                        >
                            {signupMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary font-bold hover:underline ml-1">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-400 font-medium leading-relaxed">
                    By clicking "Complete Registration", you agree to our <br />
                    <button className="underline">Terms of Service</button> and <button className="underline">Privacy Policy</button>.
                </p>
            </div>
        </div>
    );
}
