"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, ArrowLeft } from "lucide-react"

import { questionService } from "@/lib/api/questionService"
import type { PageResponse } from "@/types/api"
import type { QuestionSummary } from "@/types/question"
import { QuestionCard } from "@/components/question/question-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

function SearchPageContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get("q") || ""
    
    const [searchQuery, setSearchQuery] = useState(query)
    const [results, setResults] = useState<QuestionSummary[]>([])
    const [page, setPage] = useState<PageResponse<QuestionSummary> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [pageIndex, setPageIndex] = useState(0)

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            setPage(null)
            return
        }

        const search = async () => {
            setIsLoading(true)
            try {
                const data = await questionService.list({
                    query: query.trim(),
                    page: pageIndex,
                    size: 10,
                })
                setResults(data?.content ?? [])
                setPage(data)
            } catch (error) {
                console.error("Search error:", error)
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }

        search()
    }, [query, pageIndex])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/questions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại Hỏi đáp
                    </Link>
                    
                    {/* Search form */}
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm câu hỏi..."
                            className="pl-10 pr-4 py-3 text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* Results */}
                {query.trim() && (
                    <div className="mb-4">
                        <h1 className="text-lg font-semibold">
                            Kết quả tìm kiếm cho &quot;{query}&quot;
                        </h1>
                        {page && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Tìm thấy {page.totalElements} câu hỏi
                            </p>
                        )}
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 border rounded-lg space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        {results.map((question) => (
                            <QuestionCard key={question.id} question={question} />
                        ))}
                        
                        {/* Pagination */}
                        {page && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page.first}
                                    onClick={() => setPageIndex((prev) => prev - 1)}
                                >
                                    Trang trước
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Trang {page.number + 1} / {page.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page.last}
                                    onClick={() => setPageIndex((prev) => prev + 1)}
                                >
                                    Trang sau
                                </Button>
                            </div>
                        )}
                    </div>
                ) : query.trim() ? (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h2 className="text-lg font-medium mb-2">Không tìm thấy kết quả</h2>
                        <p className="text-muted-foreground">
                            Thử tìm kiếm với từ khóa khác hoặc{" "}
                            <Link href="/questions/new" className="text-primary hover:underline">
                                đặt câu hỏi mới
                            </Link>
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h2 className="text-lg font-medium mb-2">Tìm kiếm câu hỏi</h2>
                        <p className="text-muted-foreground">
                            Nhập từ khóa để tìm câu hỏi liên quan
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Search className="w-8 h-8 mx-auto text-muted-foreground animate-pulse mb-2" />
                    <p className="text-muted-foreground">Đang tải...</p>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    )
}
