import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { FacilityForm } from '../../components/provider/facilities/FacilityForm';
import { providerService, type Facility } from '../../services/provider.service';
import { useNavigate } from 'react-router-dom';

export default function ManageFacilities() {
    const [showForm, setShowForm] = useState(false);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchFacilities = async () => {
        setLoading(true);
        try {
            const data = await providerService.getMyFacilities();
            setFacilities(data);
        } catch (error) {
            console.error('Failed to fetch facilities', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this facility?')) {
            try {
                await providerService.deleteFacility(id);
                fetchFacilities();
            } catch (error) {
                console.error(error);
                alert('Failed to delete facility');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Facilities</h1>
                        <p className="text-gray-500">Manage your parking locations and slots.</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Facility
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : facilities.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">You haven't added any facilities yet.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-indigo-600 font-medium hover:underline"
                        >
                            Create your first facility
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {facilities.map(facility => (
                            <div
                                key={facility.id}
                                onClick={() => navigate(`/provider/facilities/${facility.id}`)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={facility.image_url || 'https://images.unsplash.com/photo-1573348722427-f1d6d19baa03?auto=format&fit=crop&q=80&w=800'}
                                        alt={facility.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button className="p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white text-gray-700">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(facility.id, e)}
                                            className="p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{facility.name}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <MapPin className="w-4 h-4" />
                                        {facility.address}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">Floors</p>
                                            <p className="text-lg font-bold text-gray-900">{facility.total_floors}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">City</p>
                                            <p className="text-lg font-bold text-gray-900">{facility.city}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Click to manage slots & pricing</span>
                                        <button className="text-sm font-semibold text-gray-600 hover:text-indigo-600">
                                            Manage Details →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showForm && (
                <FacilityForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchFacilities();
                    }}
                />
            )}
        </div>
    );
}
