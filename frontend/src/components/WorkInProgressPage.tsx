import { Construction, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkInProgressPageProps {
    title: string;
    description?: string;
    expectedFeatures?: string[];
    backUrl?: string;
    homeUrl?: string;
}

export default function WorkInProgressPage({
    title,
    description = "This feature is currently under development and will be available soon.",
    expectedFeatures = [],
    backUrl,
    homeUrl = '/',
}: WorkInProgressPageProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                                <Construction size={48} className="animate-pulse" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-center mb-2">{title}</h1>
                        <p className="text-indigo-100 text-center text-sm">Feature Under Development</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Description */}
                        <div className="text-center">
                            <p className="text-gray-600 text-lg">{description}</p>
                        </div>

                        {/* Expected Features */}
                        {expectedFeatures.length > 0 && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">Coming Soon</span>
                                    Expected Features
                                </h3>
                                <ul className="space-y-2">
                                    {expectedFeatures.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3 text-gray-700">
                                            <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                                {index + 1}
                                            </span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                            <div className="text-blue-600 flex-shrink-0">ℹ️</div>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Development Status</p>
                                <p>
                                    We're working hard to bring you this feature. Check back soon or contact support
                                    for more information about our release timeline.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            {backUrl && (
                                <button
                                    onClick={() => navigate(backUrl)}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-all"
                                >
                                    <ArrowLeft size={20} />
                                    Go Back
                                </button>
                            )}
                            <button
                                onClick={() => navigate(homeUrl)}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                            >
                                <Home size={20} />
                                Return Home
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Thank you for your patience while we build amazing features for you! 🚀</p>
                </div>
            </div>
        </div>
    );
}
