import { MapPin, Heart, Star, Navigation, Zap, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FavoritesList() {
    const navigate = useNavigate();

    // Mock data
    const favorites = [
        {
            id: '1',
            name: 'Central Mall Basement',
            address: 'MG Road, City Center, Sector 12',
            rating: 4.8,
            distance: '1.2 km',
            type: 'Multi-level'
        },
        {
            id: '2',
            name: 'Grand Plaza Parking',
            address: 'Banjara Hills, Road No 12',
            rating: 4.5,
            distance: '3.5 km',
            type: 'Underground'
        },
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Favorite Hubs</h3>
                    <p className="text-sm font-bold text-gray-400">Places you visit most frequently.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    <Heart size={14} className="fill-pink-500" /> {favorites.length} Saved
                </div>
            </div>

            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {favorites.map((fav) => (
                        <div
                            key={fav.id}
                            className="group relative bg-white border border-gray-100 rounded-[40px] p-8 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all overflow-hidden"
                        >
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                        <MapPin size={32} />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-full">
                                        <Star size={14} className="fill-yellow-600" />
                                        <span className="text-[10px] font-black">{fav.rating}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-8">
                                    <h4 className="text-xl font-black text-gray-900">{fav.name}</h4>
                                    <p className="text-sm font-bold text-gray-400 flex items-start gap-1">
                                        <MapPin size={14} className="mt-0.5 shrink-0" />
                                        {fav.address}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="text-left">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Distance</p>
                                            <p className="text-xs font-black text-gray-900">{fav.distance}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                                            <p className="text-xs font-black text-gray-900">{fav.type}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                            <Trash2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/customer/facility/${fav.id}`)}
                                            className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-110 transition-all"
                                        >
                                            <Navigation size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute -bottom-10 -right-10 text-indigo-50/50 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-4 group-hover:-translate-y-4">
                                <Zap size={140} strokeWidth={1} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-pink-100 mx-auto mb-6 shadow-sm">
                        <Heart size={40} className="fill-pink-50" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No favorites saved yet</p>
                    <button className="mt-6 text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mx-auto hover:gap-3 transition-all">
                        Explore facilities <ArrowRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
