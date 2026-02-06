import { Layers, ChevronRight } from 'lucide-react';

interface Floor {
    id: string;
    floor_number: number;
    floor_name?: string;
    availableCount: number;
}

interface FloorSelectorProps {
    floors: Floor[];
    activeFloorId: string;
    onFloorChange: (id: string) => void;
}

export default function FloorSelector({ floors, activeFloorId, onFloorChange }: FloorSelectorProps) {
    if (!floors || floors.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Layers size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Floor Selection</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Navigate through levels</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 px-2">
                {floors.map((floor) => {
                    const isActive = activeFloorId === floor.id;
                    return (
                        <button
                            key={floor.id}
                            onClick={() => onFloorChange(floor.id)}
                            className={`
                                min-w-[120px] px-6 py-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start gap-1 group
                                ${isActive
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105'
                                    : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                                }
                            `}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
                                Level
                            </span>
                            <div className="flex items-center justify-between w-full">
                                <span className="text-xl font-black">
                                    {floor.floor_name || floor.floor_number}
                                </span>
                                <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                            </div>
                            <div className={`mt-2 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600'
                                }`}>
                                {floor.availableCount} Available
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
