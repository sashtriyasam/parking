import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function SlotManager({ }: { facilityId: string }) {
    // Mock Data
    const [floors] = useState([
        { id: 'f1', name: 'Floor 1', slots: Array(10).fill(null).map((_, i) => ({ id: `s1-${i}`, number: `A-${i + 1}`, type: 'CAR', status: 'FREE' })) },
        { id: 'f2', name: 'Floor 2', slots: Array(10).fill(null).map((_, i) => ({ id: `s2-${i}`, number: `B-${i + 1}`, type: 'BIKE', status: 'OCCUPIED' })) }
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Floors & Slots</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100">
                    <Plus className="w-4 h-4" />
                    Add Floor
                </button>
            </div>

            {floors.map(floor => (
                <div key={floor.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="font-bold text-gray-800">{floor.name}</h4>
                        <div className="flex gap-2">
                            <button className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                                Bulk Add Slots
                            </button>
                            <button className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-red-600">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {floor.slots.map(slot => (
                                <div key={slot.id} className={`p-3 rounded-lg border-2 ${slot.status === 'OCCUPIED' ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'
                                    } cursor-pointer hover:shadow-md transition-all group relative`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-700">{slot.number}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{slot.type}</span>
                                    </div>
                                    <div className={`text-xs font-semibold ${slot.status === 'OCCUPIED' ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {slot.status}
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-white/90 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button className="p-1.5 bg-gray-100 rounded-full hover:bg-indigo-50 hover:text-indigo-600">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Slot Button */}
                            <button className="p-3 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all h-[84px]">
                                <Plus className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">Add Slot</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
