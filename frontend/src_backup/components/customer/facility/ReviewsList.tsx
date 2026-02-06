import { Star, MessageSquare, ThumbsUp, MoreVertical, ChevronDown } from 'lucide-react';
import type { Review } from '../../../types';

interface ReviewsListProps {
    reviews: Review[];
    ratingAvg: number;
    ratingCount: number;
}

export default function ReviewsList({ reviews, ratingAvg, ratingCount }: ReviewsListProps) {
    const distributions = [
        { rating: 5, percentage: 70 },
        { rating: 4, percentage: 20 },
        { rating: 3, percentage: 5 },
        { rating: 2, percentage: 3 },
        { rating: 1, percentage: 2 },
    ];

    return (
        <div className="py-12 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-10">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <MessageSquare size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Community Reviews</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verified experiences from real users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
                {/* Highlight Card */}
                <div className="bg-gray-900 rounded-[32px] p-10 text-white flex flex-col items-center justify-center text-center shadow-2xl shadow-gray-200">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Overall Score</p>
                    <div className="text-7xl font-black mb-4">{ratingAvg.toFixed(1)}</div>
                    <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={24} className={s <= Math.round(ratingAvg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} />
                        ))}
                    </div>
                    <p className="text-sm font-bold text-white/60 italic">Based on {ratingCount} reservations</p>
                </div>

                {/* Distribution Chart */}
                <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
                    {distributions.map((dist) => (
                        <div key={dist.rating} className="flex items-center gap-4">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest w-6">{dist.rating}</span>
                            <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${dist.percentage}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-gray-900 w-10">{dist.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Review Cards */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold">No reviews yet. Be the first to share your experience!</p>
                    </div>
                ) : (
                    <>
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                                            {review.customer_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900">{review.customer_name}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} size={10} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                        <MoreVertical size={20} className="text-gray-300" />
                                    </button>
                                </div>
                                <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                    {review.comment}
                                </p>
                                <div className="flex items-center gap-6">
                                    <button className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:scale-105 transition-transform">
                                        <ThumbsUp size={16} /> Helpful (12)
                                    </button>
                                    <button className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                                        Report
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="pt-8 flex justify-center">
                            <button className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 font-black hover:bg-gray-50 transition-all shadow-sm">
                                View More Reviews <ChevronDown size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
