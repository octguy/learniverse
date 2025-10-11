"use client"

import * as React from "react"
import Image from "next/image"
import { X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TagSelectorProps {
    mode?: "onboarding" | "profile"
    selectedTags: string[]
    onChange: (tags: string[]) => void
}


const allTags = [
    "Toán học",
    "Ngữ văn",
    "Tiếng Anh",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Lịch sử",
    "Địa lý",
    "Giáo dục công dân",
    "Tin học",
    "Công nghệ",
    "Thể dục",
]

export function TagSelector({
                                mode = "onboarding",
                                selectedTags,
                                onChange,
                            }: TagSelectorProps) {
    const [searchTerm, setSearchTerm] = React.useState("")

    const filteredTags = allTags.filter((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onChange(selectedTags.filter((t) => t !== tag))
        } else {
            onChange([...selectedTags, tag])
        }
    }

    // --- ONBOARDING MODE ---
    if (mode === "onboarding") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b text-black from-[#f6f6ff] to-white">
                <h1 className="text-5xl font-semibold mb-10 text-gray-600 font-serif text-left w-full ml-50">
                    Môn học yêu thích của bạn là gì?
                </h1>

                <div className="grid grid-cols-3 gap-6 w-[900px]">
                    {allTags.map((tag, index) => {
                        const isSelected = selectedTags.includes(tag)
                        return (
                            <div
                                key={index}
                                onClick={() => toggleTag(tag)}
                                className={cn(
                                    "flex items-center border rounded-md overflow-hidden cursor-pointer transition-all hover:shadow-md",
                                    isSelected
                                        ? "ring-2 ring-blue-500 bg-blue-50"
                                        : "bg-white hover:bg-gray-50"
                                )}
                            >
                                <div className="w-1/3 bg-gray-100 flex items-center justify-center p-2">
                                    <Image
                                        src="/favicon.ico"
                                        alt={tag}
                                        width={60}
                                        height={60}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="flex-1 text-center py-3 font-medium">{tag}</div>
                            </div>
                        )
                    })}
                </div>
                <div className="w-full">
                    <div className="flex gap-4 mt-10 justify-end mr-20">
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                            ←
                        </Button>
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                            →
                        </Button>
                    </div>
                </div>

            </div>
        )
    }

    // --- PROFILE MODE ---
    return (
        <Card className="w-full border-none shadow-none bg-transparent">
            <CardContent className="p-2">
                <ScrollArea className="max-h-[90px] pr-1">
                    <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag)
                            return (
                                <Badge
                                    key={tag}
                                    variant={isSelected ? "default" : "outline"}
                                    className={cn(
                                        "cursor-pointer select-none px-2 py-1 text-sm rounded-full transition-colors text-black",
                                        isSelected
                                            ? "bg-blue-300 hover:bg-primary/90 text-black"
                                            : "hover:bg-accent hover:text-accent-foreground bg-gray-200 text-black"
                                    )}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                    {isSelected && <X className="ml-1 size-3" />}
                                </Badge>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

    )
}
