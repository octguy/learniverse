"use client"

import { useMemo, useState } from "react"
import { X, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface TagOption {
    id: string
    name: string
    slug: string
    description?: string | null
}

interface TagMultiSelectProps {
    options: TagOption[]
    value: TagOption[]
    onChange: (value: TagOption[]) => void
    isLoading?: boolean
    error?: string | null
    maxSelections?: number
}

export function TagMultiSelect({
    options,
    value,
    onChange,
    isLoading,
    error,
    maxSelections,
}: TagMultiSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const filteredOptions = useMemo(() => {
        const normalized = search.trim().toLowerCase()
        if (!normalized) {
            return options
        }
        return options.filter((option) =>
            [option.name, option.slug, option.description]
                .filter(Boolean)
                .some((field) => field!.toLowerCase().includes(normalized))
        )
    }, [options, search])

    const isSelected = (id: string) => value.some((tag) => tag.id === id)

    const handleToggle = (option: TagOption, nextState?: boolean) => {
        const exists = isSelected(option.id)
        const shouldSelect =
            typeof nextState === "boolean" ? nextState : !exists

        if (shouldSelect) {
            if (exists) return
            if (maxSelections && value.length >= maxSelections) return
            onChange([...value, option])
            return
        }

        if (!exists) return
        onChange(value.filter((tag) => tag.id !== option.id))
    }

    const handleRemove = (id: string) => {
        onChange(value.filter((tag) => tag.id !== id))
    }

    const selectedLabel = value.length
        ? `${value.length} thẻ đã chọn`
        : maxSelections
        ? `Chọn tối đa ${maxSelections} thẻ`
        : "Chọn thẻ"

    return (
        <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        aria-label="Chọn thẻ"
                    >
                        <span
                            className={cn(
                                "truncate",
                                value.length
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            {selectedLabel}
                        </span>
                        <Search className="size-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[320px] space-y-3 p-4"
                    align="start"
                >
                    <Input
                        autoFocus
                        placeholder="Tìm thẻ"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    {isLoading ? (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Đang tải danh sách thẻ…
                        </div>
                    ) : (
                        <div className="h-64 overflow-y-auto pr-1">
                            <div className="space-y-1">
                                {filteredOptions.length === 0 && (
                                    <p className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                                        {options.length === 0
                                            ? "Chưa có thẻ nào được cấu hình. Hãy nhờ nhóm của bạn thêm một vài chủ đề."
                                            : "Không tìm thấy thẻ phù hợp."}
                                    </p>
                                )}
                                {filteredOptions.map((option) => {
                                    const checked = isSelected(option.id)
                                    const reachedLimit = Boolean(
                                        maxSelections &&
                                            value.length >= maxSelections
                                    )
                                    const interactionDisabled =
                                        !checked && reachedLimit

                                    const handleOptionActivate = () => {
                                        if (interactionDisabled) return
                                        handleToggle(option)
                                    }

                                    return (
                                        <div
                                            key={option.id}
                                            role="button"
                                            tabIndex={
                                                interactionDisabled ? -1 : 0
                                            }
                                            aria-pressed={checked}
                                            aria-disabled={interactionDisabled}
                                            onClick={handleOptionActivate}
                                            onKeyDown={(event) => {
                                                if (interactionDisabled) return
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault()
                                                    handleToggle(option)
                                                }
                                            }}
                                            className={cn(
                                                "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                                                checked
                                                    ? "border-primary bg-primary/10"
                                                    : "border-transparent hover:bg-accent",
                                                interactionDisabled &&
                                                    "cursor-not-allowed opacity-70"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={checked}
                                                    disabled={
                                                        interactionDisabled &&
                                                        !checked
                                                    }
                                                    onCheckedChange={(value) =>
                                                        handleToggle(
                                                            option,
                                                            value === true
                                                        )
                                                    }
                                                />
                                                <div className="flex-1 space-y-1">
                                                    <div className="font-medium leading-none">
                                                        {option.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {option.description ||
                                                            option.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {maxSelections && (
                        <p className="text-xs text-muted-foreground">
                            Bạn có thể chọn tối đa {maxSelections} thẻ để mọi
                            người dễ tìm thấy câu hỏi của bạn.
                        </p>
                    )}
                </PopoverContent>
            </Popover>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap gap-2">
                {value.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Chưa có thẻ nào được chọn.
                    </p>
                )}
                {value.map((tag) => (
                    <Badge
                        key={tag.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                    >
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => handleRemove(tag.id)}
                            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                            aria-label={`Gỡ thẻ ${tag.name}`}
                        >
                            <X className="size-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
