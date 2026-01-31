import type { Floor } from '../../../types';

interface FloorSelectorProps {
    floors: (Floor & { availableCount: number })[];
    activeFloorId: string;
    onFloorChange: (id: string) => void;
}

export default function FloorSelector({ floors, activeFloorId, onFloorChange }: FloorSelectorProps) {
    return (
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-6">
            {floors.map((floor) => (
                <button
                    key={floor.id}
                    onClick={() => onFloorChange(floor.id)}
                    className={`
                        px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                        ${activeFloorId === floor.id
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
                    `}
                >
                    {floor.floor_name || `Floor ${floor.floor_number}`}
                    <span className={`
                        px-1.5 py-0.5 rounded-full text-[10px] 
                        ${activeFloorId === floor.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}
                    `}>
                        {floor.availableCount}
                    </span>
                </button>
            ))}
        </div>
    );
}
