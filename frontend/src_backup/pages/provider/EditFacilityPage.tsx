import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Clock, Layers, Camera, FileText, Zap, Shield, Cctv, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import ImageUploader from '../../components/provider/facilities/ImageUploader';
import { providerService } from '../../services/provider.service';

const facilitySchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    city: z.string().min(2, 'City is required'),
    operating_hours: z.string().optional(),
    is_24_7: z.boolean().default(false),
    total_floors: z.number().min(1, 'At least 1 floor required').max(50, 'Maximum 50 floors'),
    contact_number: z.string().optional(),
    description: z.string().optional(),
});

type FacilityFormData = z.infer<typeof facilitySchema>;

export default function EditFacilityPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [images, setImages] = useState<File[]>([]);
    const [amenities, setAmenities] = useState<string[]>([]);

    // Fetch facility details
    const { data: facility, isLoading } = useQuery({
        queryKey: ['provider', 'facilities', id],
        queryFn: () => providerService.getFacilityDetails(id!),
        enabled: !!id,
    });

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FacilityFormData>({
        resolver: zodResolver(facilitySchema) as any,
        defaultValues: {
            is_24_7: true,
            total_floors: 1,
        },
    });

    const is24_7 = watch('is_24_7');

    // Populate form when facility data loads
    useEffect(() => {
        if (facility) {
            reset({
                name: facility.name,
                address: facility.address,
                city: facility.city,
                operating_hours: facility.operating_hours,
                is_24_7: facility.operating_hours === '24/7',
                total_floors: facility.total_floors,
                contact_number: facility.contact_number || '',
                description: facility.description || '',
            });
        }
    }, [facility, reset]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => providerService.updateFacility(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider', 'facilities'] });
            queryClient.invalidateQueries({ queryKey: ['provider', 'facilities', id] });
            navigate('/provider/facilities');
        },
    });

    const availableAmenities = [
        { id: 'covered', label: 'Covered Parking', icon: Shield },
        { id: 'security', label: '24/7 Security', icon: Shield },
        { id: 'cctv', label: 'CCTV Surveillance', icon: Cctv },
        { id: 'ev_charging', label: 'EV Charging', icon: Zap },
        { id: 'valet', label: 'Valet Service', icon: Camera },
        { id: 'lighting', label: 'Well Lit', icon: Zap },
    ];

    const toggleAmenity = (amenityId: string) => {
        setAmenities(prev =>
            prev.includes(amenityId) ? prev.filter(a => a !== amenityId) : [...prev, amenityId]
        );
    };

    const onSubmit: any = (data: FacilityFormData) => {
        updateMutation.mutate({
            ...data,
            operating_hours: data.is_24_7 ? '24/7' : data.operating_hours,
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading facility...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">

            {/* Header */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button
                        onClick={() => navigate('/provider/facilities')}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to Facilities
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">
                            Edit Facility
                        </h1>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            Update facility information
                        </p>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-10">
                    {/* Basic Information */}
                    <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Basic Information</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facility identity and location</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Facility Name *
                                </label>
                                <input
                                    {...register('name')}
                                    placeholder="Grand Plaza Parking"
                                    className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300"
                                />
                                {errors.name && <p className="mt-2 text-xs font-bold text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Complete Address *
                                </label>
                                <input
                                    {...register('address')}
                                    placeholder="123, MG Road, Sector 12"
                                    className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300"
                                />
                                {errors.address && <p className="mt-2 text-xs font-bold text-red-500">{errors.address.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                    City *
                                </label>
                                <input
                                    {...register('city')}
                                    placeholder="Bangalore"
                                    className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300"
                                />
                                {errors.city && <p className="mt-2 text-xs font-bold text-red-500">{errors.city.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Contact Number
                                </label>
                                <input
                                    {...register('contact_number')}
                                    placeholder="+91 98765 43210"
                                    className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Operating Hours */}
                    <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Operating Hours</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Set facility availability</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    {...register('is_24_7')}
                                    id="is_24_7"
                                    className="w-6 h-6 text-indigo-600 rounded-lg"
                                />
                                <label htmlFor="is_24_7" className="text-sm font-bold text-gray-900">
                                    Open 24/7
                                </label>
                            </div>

                            {!is24_7 && (
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                        Custom Hours
                                    </label>
                                    <input
                                        {...register('operating_hours')}
                                        placeholder="e.g., 6:00 AM - 10:00 PM"
                                        className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Infrastructure */}
                    <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Infrastructure</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Physical layout details</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                Total Floors *
                            </label>
                            <input
                                type="number"
                                {...register('total_floors', { valueAsNumber: true })}
                                min={1}
                                max={50}
                                className="w-full h-16 px-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all"
                            />
                            {errors.total_floors && <p className="mt-2 text-xs font-bold text-red-500">{errors.total_floors.message}</p>}
                        </div>
                    </section>

                    {/* Amenities */}
                    <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Amenities</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available features and services</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {availableAmenities.map((amenity) => {
                                const Icon = amenity.icon;
                                const isSelected = amenities.includes(amenity.id);
                                return (
                                    <button
                                        key={amenity.id}
                                        type="button"
                                        onClick={() => toggleAmenity(amenity.id)}
                                        className={`p-6 rounded-[28px] border-2 transition-all flex items-center gap-3 ${isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-900' : 'bg-gray-50 border-gray-50 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="text-xs font-black uppercase tracking-widest">{amenity.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Images */}
                    <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                                <Camera size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Facility Images</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload photos of your facility</p>
                            </div>
                        </div>

                        <ImageUploader images={images} onImagesChange={setImages} maxImages={5} />
                    </section>

                    {/* Description */}
                    <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Description</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Additional facility information</p>
                            </div>
                        </div>

                        <textarea
                            {...register('description')}
                            rows={5}
                            placeholder="Describe your facility, special features, nearby landmarks, etc..."
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300 resize-none"
                        />
                    </section>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/provider/facilities')}
                            className="flex-1 py-6 bg-gray-50 text-gray-600 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex-[2] py-6 bg-indigo-600 text-white rounded-[28px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-102 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Update Facility'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
