"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ProfileCardProps {
    defaultCoverUrl?: string
    defaultAvatarUrl?: string
    displayName: string
    username?: string
    school?: string
    major?: string
    country?: string
    favoriteSubject?: string
}

export function ProfileCard({
                                defaultCoverUrl = "/favicon.ico",
                                defaultAvatarUrl = "/favicon.ico",
                                displayName,
                                username = "username",
                                school = "Trường học ...",
                                major = "Chuyên môn / Ngành học ...",
                                country = "Quốc gia:",
                                favoriteSubject = "Môn học yêu thích:",
                            }: ProfileCardProps) {
    // State ảnh nền và avatar
    const [coverUrl, setCoverUrl] = useState(defaultCoverUrl)
    const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl)

    // Upload ảnh nền
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setCoverUrl(url)
        }
    }

    // Upload avatar
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setAvatarUrl(url)
        }
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
                {/* Edit cover button */}
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
                        {/* Overlay upload avatar */}
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

                {/* Name and Info */}
                <div className="pl-44 pt-4">
                    <h2 className="text-2xl font-semibold text-black">{displayName}</h2>
                    <div className="grid grid-cols-2 text-sm text-gray-700 mt-1">
                        <div>
                            <div>{username}</div>
                            <div>{school}</div>
                            <div>{major}</div>
                        </div>
                        <div>
                            <div>{country}</div>
                            <div>{favoriteSubject}</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pl-44">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                        + Thêm bạn
                    </Button>
                    <Button variant="outline" className="border-blue-600 text-blue-600">
                        💬 Gửi tin nhắn
                    </Button>
                    <Button variant="outline">Thêm...</Button>
                </div>
            </div>
        </Card>
    )
}
