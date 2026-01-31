import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import type { Review } from '../../../types';

interface ReviewsListProps {
    reviews: Review[];
    ratingAvg: number;
    ratingCount: number;
}

export default function ReviewsList({ reviews, ratingAvg, ratingCount }: ReviewsListProps) {
    // Generate dummy distribution for visual appeal
    const distribution = [70, 15, 8, 4, 3]; // 5, 4, 3, 2, 1 stars percentages

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-8">
            <h3 className="text-xl font-bold text-gray-900">Ratings & Reviews</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Overall Rating */}
                <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-2xl">
                    <span className="text-5xl font-black text-indigo-600 mb-2">{ratingAvg.toFixed(1)}</span>
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                size={20}
                                className={s <= Math.round(ratingAvg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                            />
                        ))}
                    </div>
                    <p className="text-gray-500 text-sm">{ratingCount} Verified Reviews</p>
                </div>

                {/* Distribution */}
                <div className="md:col-span-2 space-y-3">
                    {distribution.map((percent, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 w-4">{5 - i}</span>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-400 w-8">{percent}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {reviews.map((review) => (
                    <div key={review.id} className="py-6 space-y-3 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                    {review.customer_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{review.customer_name}</p>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                size={12}
                                                className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {review.comment}
                        </p>
                        <div className="flex items-center gap-4 text-gray-400">
                            <button className="flex items-center gap-1.5 hover:text-indigo-600 text-xs transition-colors">
                                <ThumbsUp size={14} />
                                Helpful
                            </button>
                            <button className="flex items-center gap-1.5 hover:text-indigo-600 text-xs transition-colors">
                                <MessageSquare size={14} />
                                Reply
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full py-3 text-indigo-600 font-bold border-2 border-indigo-50 rounded-xl hover:bg-indigo-50 transition-all">
                View All Reviews
            </button>
        </div>
    );
}
