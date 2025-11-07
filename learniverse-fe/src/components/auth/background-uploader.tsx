"use client"

import React, { useState } from "react"
import Image from "next/image"

interface BackgroundUploaderProps {
    imageUrl: string;
    onUpload: (url: string) => void;
}

export function BackgroundUploader({onUpload }: BackgroundUploaderProps) {
    const [background, setBackground] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setBackground(url)
        }
    }

    return (
        <div className="relative h-48 w-full">
            <Image
                src={background || "/favicon.ico"}
                alt="Cover"
                fill
                className="object-cover"
            />
            <label className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100">
                ✏️
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
