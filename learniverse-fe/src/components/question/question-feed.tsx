"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { isAxiosError } from "axios"
import { SlidersHorizontal } from "lucide-react"

import { questionService } from "@/lib/api/questionService"
import type { PageResponse } from "@/types/api"
import type { QuestionSummary } from "@/types/question"
import { QuestionCard } from "@/components/question/question-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const PAGE_SIZE = 8

const SORT_OPTIONS: Array<{
    id: string
    label: string
    sort?: string
    badge?: string
    predicate?: (item: QuestionSummary) => boolean
}> = [
    { id: "newest", label: "Mới nhất", sort: "publishedAt,desc" },
    { id: "active", label: "Hoạt động", sort: "answerCount,desc" },
    {
        id: "bountied",
        label: "Đang treo thưởng",
        sort: "bookmarkCount,desc",
        badge: "22",
    },
    {
        id: "unanswered",
        label: "Chưa có trả lời",
        predicate: (item) => (item.answerCount ?? 0) === 0,
        sort: "publishedAt,desc",
    },
]

interface FeedState {
    items: QuestionSummary[]
    page: PageResponse<QuestionSummary> | null
    status: "idle" | "loading" | "error"
    error: string | null
}

export function QuestionFeed() {
    const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0])
    const [pageIndex, setPageIndex] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const [state, setState] = useState<FeedState>({
        items: [],
        page: null,
        status: "idle",
        error: null,
    })

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setState((prev) => ({
                ...prev,
                status: "loading",
                error: null,
            }))

            try {
                const pageData = await questionService.list({
                    page: pageIndex,
                    size: PAGE_SIZE,
                    sort: activeSort.sort,
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
    }, [activeSort, pageIndex, refreshKey])

    const visibleItems = useMemo(() => {
        const predicate = activeSort.predicate
        if (!predicate) {
            return state.items
        }
        return state.items.filter(predicate)
    }, [state.items, activeSort])

    const { page, status, error } = state
    const isLoading = status === "loading"
    const showErrorBanner = Boolean(error)
    const canGoPrev = Boolean(page && !page.first)
    const canGoNext = Boolean(page && !page.last)

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-md border bg-muted/40 p-1">
                    {SORT_OPTIONS.map((option) => {
                        const isActive = option.id === activeSort.id
                        return (
                            <Button
                                key={option.id}
                                variant={isActive ? "default" : "ghost"}
                                size="sm"
                                className="rounded-md"
                                onClick={() => {
                                    setActiveSort(option)
                                    setPageIndex(0)
                                }}
                            >
                                {option.label}
                                {option.badge && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-2 rounded-full px-2 py-0 text-[10px]"
                                    >
                                        {option.badge}
                                    </Badge>
                                )}
                            </Button>
                        )
                    })}
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled
                    className="gap-1"
                >
                    <SlidersHorizontal className="size-4" /> Bộ lọc
                </Button>
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
                <EmptyState />
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

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">
                Chưa có nội dung
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
                Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại. Hãy là người
                đầu tiên đặt câu hỏi cho cộng đồng nhé!
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
