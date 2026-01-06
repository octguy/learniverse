"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { isAxiosError } from "axios"
import { ChevronDown, Search, X } from "lucide-react"

import { questionService } from "@/lib/api/questionService"
import { tagService, type Tag } from "@/lib/api/tagService"
import type { PageResponse } from "@/types/api"
import type { QuestionSummary } from "@/types/question"
import { QuestionCard } from "@/components/question/question-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PAGE_SIZE = 8

// UC3.2: Filter options
type FilterType = "all" | "unanswered" | "answered" | "accepted"

const FILTER_OPTIONS: Array<{
    id: FilterType
    label: string
}> = [
    { id: "all", label: "Tất cả" },
    { id: "unanswered", label: "Chưa trả lời" },
    { id: "answered", label: "Đã trả lời" },
    { id: "accepted", label: "Có câu trả lời hay nhất" },
]

// UC3.2: Sort options
const SORT_OPTIONS: Array<{
    id: string
    label: string
    sort: string
}> = [
    { id: "newest", label: "Mới nhất", sort: "publishedAt,desc" },
    { id: "hottest", label: "Nổi bật", sort: "voteScore,desc" },
    { id: "active", label: "Hoạt động", sort: "answerCount,desc" },
    { id: "views", label: "Lượt xem", sort: "viewCount,desc" },
]

interface FeedState {
    items: QuestionSummary[]
    page: PageResponse<QuestionSummary> | null
    status: "idle" | "loading" | "error"
    error: string | null
}

export function QuestionFeed() {
    const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0])
    const [activeFilter, setActiveFilter] = useState<FilterType>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [pageIndex, setPageIndex] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const [tags, setTags] = useState<Tag[]>([])
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const [state, setState] = useState<FeedState>({
        items: [],
        page: null,
        status: "idle",
        error: null,
    })

    // Fetch tags on mount
    useEffect(() => {
        tagService.getPopularTags().then(setTags).catch(console.error)
    }, [])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPageIndex(0) // Reset to first page on search
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setState((prev) => ({
                ...prev,
                status: "loading",
                error: null,
            }))

            try {
                // Use unified API with filter parameters for server-side filtering
                const pageData = await questionService.list({
                    page: pageIndex,
                    size: PAGE_SIZE,
                    sort: activeSort.sort,
                    answerFilter: activeFilter === "all" ? undefined : activeFilter,
                    tagIds: selectedTags.length > 0 ? selectedTags.map(t => t.id) : undefined,
                    query: debouncedSearch.trim() || undefined,
                })

                if (cancelled) {
                    return
                }

                const content = pageData?.content ?? []
                const items: QuestionSummary[] = content.map((summary) => ({
                    ...summary,
                    excerpt: createExcerpt(
                        summary.body ?? summary.excerpt ?? ""
                    ),
                }))

                setState({
                    items,
                    page: pageData ?? null,
                    status: "idle",
                    error: null,
                })
            } catch (error) {
                if (cancelled) {
                    return
                }
                const message = isAxiosError(error)
                    ? (error.response?.data as { message?: string })?.message ??
                      "Không thể tải danh sách câu hỏi lúc này."
                    : "Không thể tải danh sách câu hỏi lúc này."
                setState({
                    items: [],
                    page: null,
                    status: "error",
                    error: message,
                })
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [activeSort, activeFilter, selectedTags, pageIndex, refreshKey, debouncedSearch])

    // No longer need client-side filtering - use state.items directly
    const visibleItems = state.items

    const { page, status, error } = state
    const isLoading = status === "loading"
    const showErrorBanner = Boolean(error)
    const canGoPrev = Boolean(page && !page.first)
    const canGoNext = Boolean(page && !page.last)

    const handleClearSearch = () => {
        setSearchQuery("")
        setDebouncedSearch("")
    }

    return (
        <section className="space-y-5">
            {/* Search Bar - UC3.11 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi theo từ khóa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {/* Search result indicator */}
            {debouncedSearch && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                        Kết quả tìm kiếm cho: &quot;<span className="font-medium text-foreground">{debouncedSearch}</span>&quot;
                    </span>
                    {page && (
                        <Badge variant="secondary" className="text-xs">
                            {page.totalElements} câu hỏi
                        </Badge>
                    )}
                </div>
            )}

            {/* Filter and Sort Controls - UC3.2 */}
            <div className="space-y-3">
                {/* Row 1: Answer filter tabs */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-md border bg-muted/40 p-1">
                        {FILTER_OPTIONS.map((option) => {
                            const isActive = option.id === activeFilter
                            return (
                                <Button
                                    key={option.id}
                                    variant={isActive ? "default" : "ghost"}
                                    size="sm"
                                    className="rounded-md"
                                    onClick={() => {
                                        setActiveFilter(option.id)
                                        setPageIndex(0)
                                    }}
                                >
                                    {option.label}
                                </Button>
                            )
                        })}
                    </div>
                </div>

                {/* Row 2: Tag filter + Sort options */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Tag filter dropdown - multiple selection */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                    Môn học {selectedTags.length > 0 && `(${selectedTags.length})`}
                                    <ChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedTags([])
                                        setPageIndex(0)
                                    }}
                                    className={selectedTags.length === 0 ? "bg-accent" : ""}
                                >
                                    Tất cả môn học
                                </DropdownMenuItem>
                                {tags.map((tag) => {
                                    const isSelected = selectedTags.some(t => t.id === tag.id)
                                    return (
                                        <DropdownMenuItem
                                            key={tag.id}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (isSelected) {
                                                    setSelectedTags(selectedTags.filter(t => t.id !== tag.id))
                                                } else {
                                                    setSelectedTags([...selectedTags, tag])
                                                }
                                                setPageIndex(0)
                                            }}
                                            className={isSelected ? "bg-accent" : ""}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isSelected && <span className="text-primary">✓</span>}
                                                {tag.name}
                                            </span>
                                        </DropdownMenuItem>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Selected tags badges */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                                {selectedTags.map(tag => (
                                    <Badge key={tag.id} variant="secondary" className="gap-1 text-xs">
                                        {tag.name}
                                        <button
                                            onClick={() => {
                                                setSelectedTags(selectedTags.filter(t => t.id !== tag.id))
                                                setPageIndex(0)
                                            }}
                                            className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {selectedTags.length > 1 && (
                                    <button
                                        onClick={() => {
                                            setSelectedTags([])
                                            setPageIndex(0)
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sort options */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Sắp xếp:</span>
                        <div className="inline-flex rounded-md border bg-muted/40 p-1">
                            {SORT_OPTIONS.map((option) => {
                                const isActive = option.id === activeSort.id
                                return (
                                    <Button
                                        key={option.id}
                                        variant={isActive ? "default" : "ghost"}
                                        size="sm"
                                        className="rounded-md text-xs"
                                        onClick={() => {
                                            setActiveSort(option)
                                            setPageIndex(0)
                                        }}
                                    >
                                        {option.label}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {showErrorBanner && (
                <Alert variant="destructive">
                    <AlertTitle>Đã xảy ra lỗi</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-3">
                        <span>{error}</span>
                        <Button
                            size="sm"
                            onClick={() => setRefreshKey((prev) => prev + 1)}
                        >
                            Thử lại
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <LoadingRow key={index} />
                    ))}
                </div>
            ) : visibleItems.length > 0 ? (
                <div className="space-y-6">
                    {visibleItems.map((question) => (
                        <QuestionCard key={question.id} question={question} />
                    ))}
                </div>
            ) : (
                <EmptyState searchQuery={debouncedSearch} />
            )}

            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm text-muted-foreground">
                <div>
                    Trang {page ? page.currentPage + 1 : 1} /{" "}
                    {page ? Math.max(page.totalPages, 1) : 1}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setPageIndex((prev) => Math.max(prev - 1, 0))
                        }
                        disabled={!canGoPrev}
                    >
                        Trước
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex((prev) => prev + 1)}
                        disabled={!canGoNext}
                    >
                        Sau
                    </Button>
                </div>
            </div>
        </section>
    )
}

function LoadingRow() {
    return (
        <div className="flex gap-5">
            <div className="flex w-28 shrink-0 flex-col gap-2">
                <Skeleton className="h-12 rounded-md" />
                <Skeleton className="h-12 rounded-md" />
                <Skeleton className="h-12 rounded-md" />
            </div>
            <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
        </div>
    )
}

function EmptyState({ searchQuery }: { searchQuery?: string }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">
                {searchQuery ? "Không tìm thấy kết quả" : "Chưa có nội dung"}
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
                {searchQuery
                    ? `Không tìm thấy câu hỏi nào phù hợp với từ khóa "${searchQuery}". Hãy thử từ khóa khác hoặc đặt câu hỏi mới.`
                    : "Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại. Hãy là người đầu tiên đặt câu hỏi cho cộng đồng nhé!"}
            </p>
            <Button asChild>
                <Link href="/questions/ask">Đặt câu hỏi</Link>
            </Button>
        </div>
    )
}

function createExcerpt(source?: string | null, maxLength = 220) {
    if (!source) {
        return "Nội dung mô tả đang được cập nhật."
    }

    const normalized = source.replace(/\s+/g, " ").trim()
    if (normalized.length <= maxLength) {
        return normalized
    }

    const truncated = normalized.slice(0, maxLength)
    return `${truncated.replace(/\s+[^\s]*$/, "")}…`
}
