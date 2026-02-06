import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState } from 'react';

interface Column<T> {
    key: string;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    isLoading?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    onRowClick,
    emptyMessage = 'No data available',
    isLoading = false,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    // Sorting logic
    const sortedData = [...data].sort((a, b) => {
        if (!sortKey) return 0;

        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal === bVal) return 0;

        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Search filtering
    const filteredData = sortedData.filter((row) =>
        Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleSort = (key: string) => {
        if (!columns.find(c => c.key === key)?.sortable) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-[40px] border border-gray-100 p-20 text-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
            {/* Search Bar */}
            <div className="p-6 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search across all columns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none transition-all placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Table */}
            {filteredData.length === 0 ? (
                <div className="p-20 text-center">
                    <p className="text-sm font-bold text-gray-400">{emptyMessage}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        onClick={() => handleSort(column.key)}
                                        className={`px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest ${column.sortable ? 'cursor-pointer hover:text-gray-600 transition-colors' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label}
                                            {column.sortable && sortKey === column.key && (
                                                sortDirection === 'asc' ? (
                                                    <ChevronUp size={14} />
                                                ) : (
                                                    <ChevronDown size={14} />
                                                )
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick?.(row)}
                                    className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/50' : ''
                                        } transition-colors`}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-8 py-6 text-sm font-bold text-gray-900">
                                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer with count */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Showing {filteredData.length} of {data.length} {data.length === 1 ? 'entry' : 'entries'}
                </p>
            </div>
        </div>
    );
}
