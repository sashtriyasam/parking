import { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
            </div>
        );
    }

    const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="space-y-4">
            <div className="relative group aspect-video overflow-hidden rounded-2xl bg-black">
                <img
                    src={images[activeIndex]}
                    alt={`Facility ${activeIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <button
                    onClick={() => setIsFullScreen(true)}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                >
                    <Maximize2 size={20} />
                </button>

                <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-all"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`relative min-w-[120px] aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeIndex === index ? 'border-indigo-600 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                    >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            {isFullScreen && (
                <div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4 md:p-12"
                    onClick={() => setIsFullScreen(false)}
                >
                    <img
                        src={images[activeIndex]}
                        className="max-w-full max-h-full object-contain"
                        alt="Full screen"
                    />
                    <button className="absolute top-8 right-8 text-white text-xl">Close</button>
                </div>
            )}
        </div>
    );
}
