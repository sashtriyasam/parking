import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight, Loader2, Car, User } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const loginMutation = useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            setAuth(data.data, data.accessToken, data.refreshToken);
            const redirectPath = data.data.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/search';
            navigate(redirectPath);
        },
        onError: (error: any) => {
            alert(error.message || 'Login failed');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({ email, password });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[400px]">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="bg-primary p-2 rounded-xl">
                            <Car className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-gray-900">
                            Park<span className="text-primary">Easy</span>
                        </span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Sign In</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                placeholder="e.g. name@domain.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <button type="button" className="text-xs font-bold text-primary hover:underline">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full py-4 bg-primary text-white rounded-lg font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loginMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <p className="text-xs text-gray-500 font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary font-bold hover:underline ml-1">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-400 font-medium leading-relaxed">
                    By continuing, you agree to ParkEasy's <br />
                    <button className="underline">Terms of Service</button> and <button className="underline">Privacy Policy</button>.
                </p>
            </div>
        </div>
    );
}
