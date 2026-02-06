import { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[400px] bg-gray-100 rounded-[32px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Maximize2 className="text-gray-300" size={32} />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No visual assets available</p>
            </div>
        );
    }

    const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="space-y-6">
            {/* Main Stage */}
            <div className="relative group h-[450px] overflow-hidden rounded-[32px] bg-black shadow-2xl shadow-indigo-100/50 border-4 border-white">
                <img
                    src={images[activeIndex]}
                    alt={`Facility ${activeIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />

                {/* Overlays */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Actions */}
                <button
                    onClick={() => setIsFullScreen(true)}
                    className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-white border border-white/20 hover:text-indigo-600 transition-all shadow-xl group/btn"
                >
                    <Maximize2 size={24} className="group-hover/btn:scale-110 transition-transform" />
                </button>

                {/* Navigation */}
                <div className="absolute inset-y-0 left-6 flex items-center">
                    <button
                        onClick={prevImage}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 shadow-xl border border-white/10"
                    >
                        <ChevronLeft size={28} />
                    </button>
                </div>

                <div className="absolute inset-y-0 right-6 flex items-center">
                    <button
                        onClick={nextImage}
                        className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 shadow-xl border border-white/10"
                    >
                        <ChevronRight size={28} />
                    </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-6 left-8 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs font-black tracking-widest uppercase border border-white/10">
                    {activeIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnails Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
                {images.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`relative min-w-[140px] h-24 rounded-2xl overflow-hidden border-4 transition-all duration-300 ${activeIndex === index
                                ? 'border-indigo-600 scale-105 shadow-lg shadow-indigo-100'
                                : 'border-white opacity-60 hover:opacity-100 hover:scale-102 shadow-sm'
                            }`}
                    >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        {activeIndex !== index && <div className="absolute inset-0 bg-indigo-900/10" />}
                    </button>
                ))}
            </div>

            {/* Modern Full Screen Experience */}
            {isFullScreen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90"
                    >
                        <X size={32} />
                    </button>

                    <img
                        src={images[activeIndex]}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        alt="Full screen viewer"
                    />

                    <div className="absolute bottom-12 flex gap-4">
                        <button onClick={prevImage} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all font-black">PREV</button>
                        <button onClick={nextImage} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all font-black">NEXT</button>
                    </div>
                </div>
            )}
        </div>
    );
}
