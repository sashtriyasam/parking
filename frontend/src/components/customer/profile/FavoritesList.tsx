import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Navigation, Trash2 } from 'lucide-react';
import { customerService } from '../../../services/customer.service';

export default function FavoritesList() {
    const queryClient = useQueryClient();

    const { data: favorites, isLoading } = useQuery({
        queryKey: ['favorites'],
        queryFn: () => customerService.getFavorites(),
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: (facilityId: string) => customerService.removeFavorite(facilityId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            alert('Removed from favorites!');
        },
    });

    const handleQuickBook = (facility: any) => {
        window.location.href = `/customer/facility/${facility.id}`;
    };

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Favorite Locations</h2>
                <p className="text-sm text-gray-600">{favorites?.length || 0} favorites</p>
            </div>

            {favorites && favorites.length > 0 ? (
                <div className="space-y-3">
                    {favorites.map((favorite: any) => (
                        <div
                            key={favorite.id}
                            className="flex items-start justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-start gap-3 mb-3">
                                    <Heart size={20} className="text-red-500 fill-red-500 mt-1" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{favorite.name}</h3>
                                        <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                                            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                            {favorite.address}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleQuickBook(favorite)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        Quick Book
                                    </button>
                                    <button
                                        onClick={() => {
                                            window.open(
                                                `https://www.google.com/maps/dir/?api=1&destination=${favorite.latitude},${favorite.longitude}`,
                                                '_blank'
                                            );
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                                    >
                                        <Navigation size={14} />
                                        Directions
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (confirm('Remove from favorites?')) {
                                        removeFavoriteMutation.mutate(favorite.id);
                                    }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                        <Heart size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Favorites Yet</h3>
                    <p className="text-gray-600 mb-4">
                        Save your frequently visited parking locations for quick access
                    </p>
                    <button
                        onClick={() => (window.location.href = '/customer/search')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all"
                    >
                        Find Parking
                    </button>
                </div>
            )}
        </div>
    );
}
