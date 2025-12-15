"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { CameraIcon, User } from "lucide-react"

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
                "relative flex shrink-0 overflow-hidden rounded-full border-4 border-white dark:border-zinc-900 shadow-md group cursor-pointer bg-white dark:bg-zinc-800",
                className
            )}
            onClick={() => inputRef.current?.click()}
        >
            <AvatarPrimitive.Image
                src={image || ""}
                alt="Avatar"
                className="w-full h-full object-cover"
            />

            <AvatarPrimitive.Fallback className="flex w-full h-full items-center justify-center text-gray-300 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-800">
                <User className="w-3/5 h-3/5" />
            </AvatarPrimitive.Fallback>

            <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
                <CameraIcon className="text-white w-8 h-8 mb-1 opacity-90 drop-shadow-md" />
                <span className="text-white text-[10px] font-medium tracking-wide drop-shadow-md">Đổi ảnh</span>
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