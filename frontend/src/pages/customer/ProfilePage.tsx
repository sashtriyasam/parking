import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Car, CreditCard, Settings, Heart, Save } from 'lucide-react';
import { customerService } from '../../services/customer.service';
import VehiclesList from '../../components/customer/profile/VehiclesList';
import PaymentMethodsList from '../../components/customer/profile/PaymentMethodsList';
import PreferencesForm from '../../components/customer/profile/PreferencesForm';
import FavoritesList from '../../components/customer/profile/FavoritesList';

export default function ProfilePage() {
    const [activeSection, setActiveSection] = useState<'personal' | 'vehicles' | 'payments' | 'preferences' | 'favorites'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
    });

    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => customerService.getProfile(),
        onSuccess: (data) => {
            setFormData({
                full_name: data.full_name || '',
                email: data.email || '',
                phone_number: data.phone_number || '',
            });
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => customerService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setIsEditing(false);
            alert('Profile updated successfully!');
        },
        onError: () => {
            alert('Failed to update profile');
        },
    });

    const handleSaveProfile = () => {
        updateProfileMutation.mutate({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
        });
    };

    const sections = [
        { id: 'personal' as const, label: 'Personal Info', icon: User },
        { id: 'vehicles' as const, label: 'Vehicles', icon: Car },
        { id: 'payments' as const, label: 'Payment Methods', icon: CreditCard },
        { id: 'preferences' as const, label: 'Preferences', icon: Settings },
        { id: 'favorites' as const, label: 'Favorites', icon: Heart },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <User size={32} />
                        Profile
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your account settings</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${activeSection === section.id
                                            ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-semibold">{section.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            {/* Personal Info */}
                            {activeSection === 'personal' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-colors"
                                            >
                                                Edit
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={updateProfileMutation.isPending}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                                                >
                                                    <Save size={16} />
                                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Vehicles */}
                            {activeSection === 'vehicles' && <VehiclesList />}

                            {/* Payment Methods */}
                            {activeSection === 'payments' && <PaymentMethodsList />}

                            {/* Preferences */}
                            {activeSection === 'preferences' && <PreferencesForm />}

                            {/* Favorites */}
                            {activeSection === 'favorites' && <FavoritesList />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
