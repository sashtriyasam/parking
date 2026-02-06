import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
    images: File[];
    onImagesChange: (images: File[]) => void;
    maxImages?: number;
}

export default function ImageUploader({ images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        const newImages = [...images, ...files].slice(0, maxImages);
        onImagesChange(newImages);
    }, [images, maxImages, onImagesChange]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImages = [...images, ...files].slice(0, maxImages);
            onImagesChange(newImages);
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-[32px] p-12 text-center transition-all
                    ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300'}
                    ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    disabled={images.length >= maxImages}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 border border-gray-200'}`}>
                        <Upload size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">
                            {isDragging ? 'Drop images here' : 'Upload facility images'}
                        </p>
                        <p className="text-xs font-bold text-gray-400">
                            Drag & drop or click to browse • Max {maxImages} images • {images.length}/{maxImages} uploaded
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="group relative aspect-square rounded-[24px] overflow-hidden bg-gray-100 border-2 border-gray-100 hover:border-indigo-200 transition-all">
                            <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(index);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 shadow-xl"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            {index === 0 && (
                                <div className="absolute top-2 left-2 px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                    Primary
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No images uploaded yet</p>
                </div>
            )}
        </div>
    );
}
