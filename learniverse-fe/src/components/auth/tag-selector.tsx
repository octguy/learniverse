"use client"

import * as React from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserTag } from "@/types/userProfile"

interface TagSelectorProps {
    mode?: "onboarding" | "profile"
    selectedTags: string[]
    onChange: (tags: string[]) => void
    onNext?: () => void
    onPrev?: () => void
    availableTags: UserTag[]
}

export function TagSelector({
                                mode = "onboarding",
                                selectedTags,
                                onChange,
                                onNext,
                                onPrev,
                                availableTags = [],
                            }: TagSelectorProps) {
    const [searchTerm, setSearchTerm] = React.useState("")

    const filteredTags = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const MAX_SELECTION = 5
    const MIN_SELECTION = 3

    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            onChange(selectedTags.filter((t) => t !== tagId))
        } else {
            if (selectedTags.length >= MAX_SELECTION) return
            onChange([...selectedTags, tagId])
        }
    }

    if (mode === "onboarding") {
        const canProceed = selectedTags.length >= MIN_SELECTION && selectedTags.length <= MAX_SELECTION
        return (
            <div className="flex flex-col justify-between bg-gradient-to-b from-[#f6f6ff] to-white w-full max-w-[1250px] h-full min-h-[60vh] lg:min-h-[50vh] xl:min-h-[45vh] 2xl:min-h-[40vh] rounded-xl p-10">
                {/* ... Header ... */}
                <div className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-700 font-serif mb-1">
                                Môn học yêu thích của bạn là gì?
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Hãy chọn từ <strong>3 đến 5</strong> môn học bạn yêu thích nhất nhé.
                            </p>
                        </div>
                        <Image src="/logo.png" alt="Learniverse Mini Logo" width={180} height={50} className="object-contain" />
                    </div>
                </div>

                {/* ... Main content ... */}
                <div className="flex-1 flex items-start">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                        {filteredTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id)
                            const isDisabled = !isSelected && selectedTags.length >= MAX_SELECTION
                            return (
                                <div
                                    key={tag.id}
                                    onClick={() => !isDisabled && toggleTag(tag.id)}
                                    className={cn(
                                        "flex items-center border rounded-md overflow-hidden cursor-pointer transition-all select-none",
                                        isSelected
                                            ? "ring-2 ring-blue-500 bg-blue-50"
                                            : isDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : "bg-white hover:bg-gray-50 hover:shadow-md"
                                    )}
                                >
                                    <div className="w-1/3 bg-gray-100 flex items-center justify-center p-2">
                                        <Image src="/favicon.ico" alt={tag.name} width={50} height={50} />
                                    </div>
                                    <div className="flex-1 text-center py-2 text-sm font-medium">{tag.name}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ... Footer ... */}
                <div className="flex justify-end gap-4 mt-10">
                    <Button variant="outline" onClick={onPrev} className="text-blue-600 border-blue-500 hover:bg-blue-50 rounded">
                        ← Quay lại
                    </Button>
                    <Button
                        className={cn("bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded", !canProceed && "opacity-50 cursor-not-allowed")}
                        disabled={!canProceed}
                        onClick={onNext}
                    >
                        Tiếp tục →
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="w-full border-none shadow-none bg-transparent">
            <CardContent className="p-2">
                <ScrollArea className="max-h-[150px] pr-1">
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id)
                            return (
                                <Badge
                                    key={tag.id}
                                    variant={isSelected ? "default" : "outline"}
                                    className={cn(
                                        "cursor-pointer select-none px-2 py-1 text-sm rounded-full transition-colors text-black",
                                        isSelected
                                            ? "bg-blue-300 hover:bg-blue-400 text-black"
                                            : "hover:bg-blue-50 bg-gray-200 text-black"
                                    )}
                                    onClick={() => toggleTag(tag.id)}
                                >
                                    {tag.name}
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