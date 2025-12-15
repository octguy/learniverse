"use client"

import React, { useEffect, useState } from "react"
import { Camera, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackgroundUploaderProps {
    imageUrl: string;
    onUpload: (url: string, file: File) => void;
    className?: string;
}

export function BackgroundUploader({ imageUrl, onUpload, className }: BackgroundUploaderProps) {
    const [preview, setPreview] = useState<string>(imageUrl);

    useEffect(() => {
        setPreview(imageUrl);
    }, [imageUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)
            onUpload(objectUrl, file)
        }
    }

    return (
        <div className={cn("relative w-full overflow-hidden bg-gray-200 dark:bg-zinc-800 group", className)}>
            {preview ? (
                <img
                    src={preview}
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900">
                    <ImageIcon className="w-12 h-12 opacity-30" />
                    <span className="text-sm font-medium opacity-60">Chưa có ảnh bìa</span>
                </div>
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <label className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2.5 shadow-lg cursor-pointer transition-all hover:scale-110 backdrop-blur-md z-10">
                <Camera className="w-5 h-5 text-blue-600" />
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </label>
        </div>
    )
}