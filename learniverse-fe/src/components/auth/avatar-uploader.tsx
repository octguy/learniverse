"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { CameraIcon } from "lucide-react"

interface AvatarUploaderProps {
    imageUrl: string
    onUpload: (url: string) => void
    className?: string // cho phép set size từ ngoài
}

export function AvatarUploader({ imageUrl, onUpload, className }: AvatarUploaderProps) {
    const [image, setImage] = React.useState<string | null>(imageUrl)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => setImage(reader.result as string)
            reader.readAsDataURL(file)
            onUpload(URL.createObjectURL(file)) // gửi url ra ngoài
        }
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <AvatarPrimitive.Root
                className={cn(
                    "relative shrink-0 overflow-hidden rounded-full border border-border shadow-sm",
                    className
                )}
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
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                >
                    <CameraIcon className="text-white w-6 h-6" />
                </div>
            </AvatarPrimitive.Root>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            <p className="text-sm ml-4 text-muted-foreground">Nhấn vào ảnh để tải lên</p>
        </div>
    )
}
