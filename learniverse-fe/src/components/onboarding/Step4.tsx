"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserTag } from "@/types/userTag"

interface Step4Props {
    selectedTags?: string[]
    onChange?: (tags: string[]) => void
    onPrev?: () => void
    onFinish?: () => void
    availableTags?: UserTag[] // Nhận props từ cha
}

export default function Step4({
                                  selectedTags = [],
                                  onChange = () => {},
                                  onPrev,
                                  onFinish,
                                  availableTags = [],
                              }: Step4Props) {
    const [searchTerm, setSearchTerm] = React.useState("")

    const filteredTags = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const MAX_SELECTION = 5
    const MIN_SELECTION = 1

    const toggleTag = (tagId: string) => {
        if (selectedTags.includes(tagId)) {
            onChange(selectedTags.filter((t) => t !== tagId))
        } else {
            if (selectedTags.length >= MAX_SELECTION) return
            onChange([...selectedTags, tagId])
        }
    }

    const canFinish =
        selectedTags.length >= MIN_SELECTION && selectedTags.length <= MAX_SELECTION

    return (
        <div className="flex flex-col justify-between bg-gradient-to-b from-[#f6f6ff] to-white w-full max-w-[1250px] h-full min-h-[60vh] rounded-xl p-10">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-700 font-serif mb-1">
                            Bạn có muốn cải thiện môn học nào không?
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Chọn tối đa <strong>5</strong> môn học.
                        </p>
                    </div>
                    <Image src="/logo.png" alt="Logo" width={180} height={50} className="object-contain" />
                </div>
            </div>

            {/* Tags Grid */}
            <div className="flex-1 flex items-start overflow-y-auto max-h-[400px] pr-2">
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
                                    <Image src="/favicon.ico" alt={tag.name} width={40} height={40} />
                                </div>
                                <div className="flex-1 text-center py-2 text-sm font-medium">
                                    {tag.name}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4 mt-10">
                <Button variant="outline" onClick={onPrev} className="text-blue-600 border-blue-500 hover:bg-blue-50 rounded">
                    ← Quay lại
                </Button>
                <Button
                    className={cn(
                        "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded",
                        !canFinish && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!canFinish}
                    onClick={onFinish}
                >
                    Hoàn tất ✓
                </Button>
            </div>
        </div>
    )
}