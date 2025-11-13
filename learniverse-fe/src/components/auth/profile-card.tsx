"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card" //
import { Button } from "@/components/ui/button" //
import { Pencil } from "lucide-react"
// Đã xóa import Separator

interface ProfileCardProps {
    defaultCoverUrl?: string
    defaultAvatarUrl?: string
    displayName: string
    username?: string
    school?: string
    major?: string
    country?: string
    favoriteSubject?: string
    onEditClick?: () => void
}

export function ProfileCard({
                                defaultCoverUrl = "/favicon.ico",
                                defaultAvatarUrl = "/favicon.ico",
                                displayName,
                                username,
                                school,
                                major,
                                country,
                                favoriteSubject,
                                onEditClick,
                            }: ProfileCardProps) {
    const [coverUrl, setCoverUrl] = useState(defaultCoverUrl)
    const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl)

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setCoverUrl(URL.createObjectURL(file))
    }
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setAvatarUrl(URL.createObjectURL(file))
    }

    return (
        <Card className="w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-md">
            {/* Cover image */}
            <div className="relative h-48 w-full">
                <Image
                    src={coverUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                    priority
                />
                <label className="absolute bottom-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100 cursor-pointer">
                    ✏️
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverChange}
                    />
                </label>
            </div>

            {/* Profile Info */}
            <div className="relative px-8 pb-6 bg-white">
                {/* Avatar */}
                <div className="absolute -top-16 left-8 group">
                    <div className="relative size-32 rounded-full border-4 border-white overflow-hidden shadow-md">
                        <Image
                            src={avatarUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                        />
                        <label className="absolute inset-0 bg-black/40 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            Đổi ảnh
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                        </label>
                    </div>
                </div>

                {/* Name and Info  */}
                <div className="pl-44 pt-4 min-h-[100px] pb-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-semibold text-black">{displayName}</h2>
                        {onEditClick && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onEditClick}
                                className="text-gray-600 hover:text-black shrink-0"
                            >
                                <Pencil className="w-5 h-5" />
                            </Button>
                        )}
                    </div>

                    {username && (
                        <p className="text-sm text-gray-500 mt-1">{username}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 text-sm text-gray-700 mt-2 gap-x-6 gap-y-1">
                        {school && <div><span className="font-medium text-black">Trường học:</span> {school}</div>}
                        {major && <div><span className="font-medium text-black">Chuyên môn:</span> {major}</div>}
                        {country && <div><span className="font-medium text-black">Quốc gia:</span> {country}</div>}
                        {favoriteSubject && <div><span className="font-medium text-black">Môn yêu thích:</span> {favoriteSubject}</div>}
                    </div>
                </div>

            </div>
        </Card>
    )
}