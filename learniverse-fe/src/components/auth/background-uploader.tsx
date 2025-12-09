"use client"

import React, {useEffect, useState} from "react"
import Image from "next/image"
import { Camera } from "lucide-react"

interface BackgroundUploaderProps {
    imageUrl: string;
    onUpload: (url: string, file: File) => void;
}

export function BackgroundUploader({ imageUrl, onUpload }: BackgroundUploaderProps) {
    const [preview, setPreview] = useState<string>(imageUrl || "/login-banner.jpg");

    useEffect(() => {
        setPreview(imageUrl || "/login-banner.jpg");
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
        <div className="relative h-48 w-full bg-gray-100 rounded-t-3xl overflow-hidden group">
            <Image
                src={preview}
                alt="Cover"
                fill
                className="object-cover transition-opacity group-hover:opacity-90"
            />

            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <label className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-md cursor-pointer transition-transform hover:scale-105 backdrop-blur-sm">
                <Camera className="w-5 h-5" />
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