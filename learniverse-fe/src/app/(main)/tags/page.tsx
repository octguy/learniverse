"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Hash, Tag as TagIcon, Loader2 } from "lucide-react"
import { tagService, Tag } from "@/lib/api/tagService"
import { useDebounce } from "@/hooks/use-debounce"

export default function AllTagsPage() {
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [totalPages, setTotalPages] = useState(0)
    const [page, setPage] = useState(0)
    const [query, setQuery] = useState("")
    const [loadingMore, setLoadingMore] = useState(false)
    
    const debouncedQuery = useDebounce(query, 500)

    const fetchTags = useCallback(async (pageNum: number, searchQuery: string, append: boolean = false) => {
        try {
            if (!append) setLoading(true)
            else setLoadingMore(true)
            
            const data = await tagService.getAllTags(pageNum, 20, searchQuery)
            
            if (append) {
                setTags(prev => [...prev, ...data.content])
            } else {
                setTags(data.content)
            }
            setTotalPages(data.totalPages)
        } catch (error) {
            console.error("Failed to fetch tags", error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    useEffect(() => {
        setPage(0)
        fetchTags(0, debouncedQuery)
    }, [debouncedQuery, fetchTags])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchTags(nextPage, debouncedQuery, true)
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6">
               <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                     <div className="p-2 bg-primary/10 rounded-lg">
                        <TagIcon className="h-6 w-6 text-primary" />
                     </div>
                     Khám phá chủ đề
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                     Tìm kiếm và theo dõi các chủ đề bạn quan tâm trong cộng đồng
                  </p>
               </div>
               <div className="relative w-full md:w-80">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                      placeholder="Tìm kiếm chủ đề..." 
                      className="pl-9 bg-background"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                   />
               </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({length: 12}).map((_, i) => (
                        <Card key={i} className="h-full border-border/60 shadow-sm">
                           <CardHeader>
                               <Skeleton className="h-5 w-24 mb-2" />
                               <Skeleton className="h-4 w-full" />
                           </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : tags.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {tags.map((tag) => (
                            <Link key={tag.id} href={`/tags/${tag.id}`} className="block h-full outline-none"> 
                                <Card className="h-full hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer group flex flex-col bg-card">
                                    <CardHeader className="pb-3 flex-1">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                                            <Hash className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary/70" />
                                            {tag.name}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2 text-sm">
                                            {tag.description || "Chưa có mô tả cho chủ đề này."}
                                        </CardDescription>
                                    </CardHeader>
                                    {tag.postCount !== undefined && (
                                        <CardFooter className="pt-0 pb-4 text-xs font-medium text-muted-foreground flex justify-between items-center border-t bg-muted/20 px-6 py-2 mt-auto rounded-b-lg">
                                            <span>{tag.postCount} bài viết</span>
                                            <span className="text-primary/0 group-hover:text-primary/100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                Xem ngay &rarr;
                                            </span>
                                        </CardFooter>
                                    )}
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {page < totalPages - 1 && (
                        <div className="mt-10 flex justify-center">
                            <Button 
                                variant="outline" 
                                size="lg"
                                onClick={handleLoadMore} 
                                disabled={loadingMore}
                                className="min-w-[150px] gap-2 rounded-full shadow-sm hover:bg-secondary/80"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Đang tải...
                                    </>
                                ) : (
                                    "Xem thêm chủ đề"
                                )}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                 <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed">
                      <div className="bg-muted/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Hash className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Không tìm thấy chủ đề nào</h3>
                      <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                        Chúng tôi không tìm thấy chủ đề phù hợp với "{query}". Hãy thử tìm kiếm với từ khóa khác.
                      </p>
                      <Button 
                         variant="outline" 
                         className="mt-6"
                         onClick={() => setQuery("")}
                      >
                         Xóa bộ lọc
                      </Button>
                 </div>
            )}
        </div>
    )
}
