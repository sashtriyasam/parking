import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Grid3x3, List } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacilityCard from '../../components/provider/facilities/FacilityCard';
import { providerService } from '../../services/provider.service';

export default function FacilitiesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: facilities = [], isLoading } = useQuery({
        queryKey: ['provider', 'facilities'],
        queryFn: () => providerService.getMyFacilities(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => providerService.deleteFacility(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'facilities'] });
        },
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal Header */}
            <header className="pt-24 pb-12 border-b border-gray-50 bg-gray-50/30">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Facilities</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                            {facilities.length} active parking {facilities.length === 1 ? 'hub' : 'hubs'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white rounded-lg p-1 border border-gray-100">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
                            >
                                <Grid3x3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/provider/facilities/new')}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                        >
                            <Plus size={18} /> Add Facility
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto rotate-12"></div>
                    </div>
                ) : facilities.length === 0 ? (
                    <div className="text-center py-32 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Plus size={32} className="text-gray-200" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No facilities listed yet</h3>
                        <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                            List your first parking space to start earning from empty slots.
                        </p>
                        <button
                            onClick={() => navigate('/provider/facilities/new')}
                            className="px-8 py-3 bg-primary text-white rounded-lg text-sm font-bold shadow-xl shadow-primary/20"
                        >
                            Start Listing
                        </button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6 max-w-4xl mx-auto'}>
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
