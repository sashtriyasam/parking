import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px]" />
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100 p-8 md:p-12 w-full max-w-lg relative z-10 border border-white/50 backdrop-blur-sm">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-indigo-900 tracking-tighter mb-3">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Enter your credentials to access your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loginMutation.isPending ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Signing In...
                            </>
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-500 font-medium">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 font-black hover:text-indigo-700 hover:underline ml-1">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
