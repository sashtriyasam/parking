import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
    data: any[];
    filename?: string;
    onExport?: (type: 'csv' | 'excel') => void;
}

export default function ExportButton({ data, filename = 'export', onExport }: ExportButtonProps) {
    const [showMenu, setShowMenu] = useState(false);

    const handleExportCSV = () => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowMenu(false);
        onExport?.('csv');
    };

    const handleExportExcel = () => {
        if (data.length === 0) return;

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `${filename}.xlsx`);

        setShowMenu(false);
        onExport?.('excel');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={data.length === 0}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[28px] text-sm font-black uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <Download size={20} /> Export
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-[20px] shadow-2xl border border-gray-100 overflow-hidden z-50">
                        <button
                            onClick={handleExportCSV}
                            className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-emerald-50 transition-colors border-b border-gray-50"
                        >
                            <FileText size={18} className="text-emerald-600" />
                            <div>
                                <p className="text-sm font-black text-gray-900">Export as CSV</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comma-separated</p>
                            </div>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-emerald-50 transition-colors"
                        >
                            <FileSpreadsheet size={18} className="text-emerald-600" />
                            <div>
                                <p className="text-sm font-black text-gray-900">Export as Excel</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spreadsheet format</p>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
