import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Grid3x3, List } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacilityCard from '../../components/provider/facilities/FacilityCard';
import { providerService } from '../../services/provider.service';
import Navbar from '../../components/Navbar';

export default function FacilitiesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch facilities
    const { data: facilities = [], isLoading } = useQuery({
        queryKey: ['provider', 'facilities'],
        queryFn: () => providerService.getMyFacilities(),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => providerService.deleteFacility(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'facilities'] });
        },
    });

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
                                My Facilities
                            </h1>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                Manage your parking locations • {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-2xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 rounded-xl transition-all ${viewMode === 'grid'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <Grid3x3 size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 rounded-xl transition-all ${viewMode === 'list'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <List size={20} />
                                </button>
                            </div>

                            {/* Add Facility Button */}
                            <button
                                onClick={() => navigate('/provider/facilities/new')}
                                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                            >
                                <Plus size={20} /> Add Facility
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading facilities...</p>
                    </div>
                ) : facilities.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                            <Plus size={48} className="text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">
                            No Facilities Yet
                        </h3>
                        <p className="text-sm font-bold text-gray-400 mb-8 max-w-md mx-auto">
                            Start by adding your first parking facility to begin managing bookings and revenue.
                        </p>
                        <button
                            onClick={() => navigate('/provider/facilities/new')}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 transition-all"
                        >
                            <Plus size={20} /> Add Your First Facility
                        </button>
                    </div>
                ) : (
                    <div
                        className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                                : 'space-y-6'
                        }
                    >
                        {facilities.map((facility) => (
                            <FacilityCard
                                key={facility.id}
                                facility={facility}
                                onDelete={(id) => deleteMutation.mutate(id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
