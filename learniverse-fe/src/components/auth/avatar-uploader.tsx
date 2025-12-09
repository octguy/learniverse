"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { CameraIcon } from "lucide-react"

interface AvatarUploaderProps {
    imageUrl: string
    onUpload: (url: string, file: File) => void
    className?: string
}

export function AvatarUploader({ imageUrl, onUpload, className }: AvatarUploaderProps) {
    const [image, setImage] = React.useState<string | null>(imageUrl)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        setImage(imageUrl);
    }, [imageUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setImage(objectUrl)
            onUpload(objectUrl, file)
        }
    }

    return (
        <AvatarPrimitive.Root
            className={cn(
                "relative shrink-0 overflow-hidden rounded-full border border-border shadow-sm group cursor-pointer",
                className
            )}
            onClick={() => inputRef.current?.click()}
        >
            {image ? (
                <AvatarPrimitive.Image
                    src={image}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                />
            ) : (
                <AvatarPrimitive.Fallback className="bg-muted flex w-full h-full items-center justify-center rounded-full text-sm text-muted-foreground">
                    No Image
                </AvatarPrimitive.Fallback>
            )}

            {/* Overlay + icon upload */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <CameraIcon className="text-white w-8 h-8 mb-1" />
                <span className="text-white text-[10px] font-medium">Đổi ảnh</span>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </AvatarPrimitive.Root>
    )
}