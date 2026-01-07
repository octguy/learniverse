"use client"

import * as React from "react"
import Image from "next/image"
import { 
  X, 
  Calculator, 
  BookOpenText, 
  Languages, 
  Atom, 
  FlaskConical, 
  Dna, 
  History, 
  Globe2, 
  Scale, 
  Monitor, 
  Cpu, 
  Shapes 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserTag } from "@/types/userTag"

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

    const getIconForTag = (tagName: string) => {
        const lowerName = tagName.toLowerCase();
        if (lowerName.includes("toán")) return <Calculator className="w-8 h-8 text-blue-600" />;
        if (lowerName.includes("văn")) return <BookOpenText className="w-8 h-8 text-orange-600" />;
        if (lowerName.includes("tiếng anh") || lowerName.includes("ngoại ngữ")) return <Languages className="w-8 h-8 text-purple-600" />;
        if (lowerName.includes("lý")) return <Atom className="w-8 h-8 text-cyan-600" />;
        if (lowerName.includes("hóa")) return <FlaskConical className="w-8 h-8 text-green-600" />;
        if (lowerName.includes("sinh")) return <Dna className="w-8 h-8 text-red-600" />;
        if (lowerName.includes("sử")) return <History className="w-8 h-8 text-yellow-600" />;
        if (lowerName.includes("địa")) return <Globe2 className="w-8 h-8 text-teal-600" />;
        if (lowerName.includes("công dân")) return <Scale className="w-8 h-8 text-indigo-600" />;
        if (lowerName.includes("tin")) return <Monitor className="w-8 h-8 text-slate-600" />;
        if (lowerName.includes("công nghệ")) return <Cpu className="w-8 h-8 text-sky-600" />;
        return <Shapes className="w-8 h-8 text-gray-600" />;
    };

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
                <div className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-700 font-serif mb-1">
                                Môn học yêu thích của bạn là gì?
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Hãy chọn từ <strong>{MIN_SELECTION} đến {MAX_SELECTION}</strong> môn học bạn yêu thích nhất nhé.
                            </p>
                        </div>
                        <Image src="/logo.png" alt="Learniverse Mini Logo" width={180} height={50} className="object-contain" />
                    </div>
                </div>

                <div className="flex-1 flex items-start overflow-y-auto max-h-[400px] pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full auto-rows-[80px]">
                        {filteredTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id)
                            const isDisabled = !isSelected && selectedTags.length >= MAX_SELECTION
                            return (
                                <div
                                    key={tag.id}
                                    onClick={() => !isDisabled && toggleTag(tag.id)}
                                    className={cn(
                                        "flex h-full border rounded-xl overflow-hidden cursor-pointer transition-all select-none shadow-sm",
                                        isSelected
                                            ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50"
                                            : isDisabled
                                                ? "opacity-50 cursor-not-allowed border-gray-200"
                                                : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                                    )}
                                >
                                    <div className={cn(
                                        "w-[80px] flex items-center justify-center h-full",
                                        isSelected ? "bg-blue-100" : "bg-gray-50"
                                    )}>
                                        {getIconForTag(tag.name)}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-3 text-center">
                                        <span className={cn(
                                            "text-base font-semibold",
                                            isSelected ? "text-blue-700" : "text-gray-700"
                                        )}>
                                            {tag.name}
                                        </span>
                                    </div>
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