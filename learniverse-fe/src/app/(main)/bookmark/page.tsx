"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { interactionService } from "@/lib/api/interactionService";
import { postService } from "@/lib/api/postService";
import { BookmarkResponse } from "@/types/post";
import { PostCard } from "@/components/post/PostCard";
import { QuestionCard } from "@/components/question/question-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Filter, Bookmark, AlertCircle, LayoutGrid, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageResponse } from "@/types/api";

export default function BookmarksPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 10;
    
    const [collectionFilter, setCollectionFilter] = useState("");
    const [debouncedCollectionFilter, setDebouncedCollectionFilter] = useState("");
    
    const [knownCollections, setKnownCollections] = useState<string[]>([]);

    useEffect(() => {
        if (bookmarks.length > 0) {
            const currentCollections = bookmarks
                .map(b => b.collectionName)
                .filter((name): name is string => !!name && name.trim() !== "");
                
            setKnownCollections(prev => {
                const unique = new Set([...prev, ...currentCollections]);
                return Array.from(unique).sort();
            });
        }
    }, [bookmarks]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCollectionFilter(collectionFilter);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [collectionFilter]);

    const fetchBookmarks = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data: PageResponse<BookmarkResponse> = await interactionService.getMyBookmarks(
                page, 
                pageSize, 
                debouncedCollectionFilter || undefined
            );
            
            const hydratedBookmarks = await Promise.all(
                data.content.map(async (bookmark) => {
                     if (bookmark.postSummary) {
                         try {
                              const detail = await postService.getPostById(bookmark.postSummary.id);
                              if (detail?.data) {
                                  return { 
                                      ...bookmark, 
                                      postSummary: detail.data 
                                  };
                              }
                         } catch (e) {
                              console.error("Failed to load full post details", bookmark.postSummary.id);
                         }
                     }
                     return bookmark;
                })
            );

            setBookmarks(hydratedBookmarks);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch bookmarks", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedCollectionFilter, user]);

    useEffect(() => {
        fetchBookmarks();
    }, [fetchBookmarks]);

    const clearFilter = () => {
        setCollectionFilter("");
    }

    if (authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container max-w-4xl mx-auto py-6 space-y-6">
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bookmark className="w-6 h-6 text-primary" />
                        Kho lưu trữ
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Quản lý các bài viết và câu hỏi bạn đã lưu.
                    </p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Tìm theo tên bộ sưu tập..."
                        className="pl-9 pr-9"
                        value={collectionFilter}
                        onChange={(e) => setCollectionFilter(e.target.value)}
                    />
                    {collectionFilter && (
                         <button 
                            onClick={clearFilter}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                         >
                            <X className="w-4 h-4 cursor-pointer" />
                         </button>
                    )}
                </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center pb-2">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Bộ sưu tập:</span>
                    <Button
                        variant={collectionFilter === "" ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8 px-4"
                        onClick={() => setCollectionFilter("")}
                    >
                        Tất cả
                    </Button>

                    <Button
                        variant={collectionFilter === "General" ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8 px-4 border-dashed border-primary/40"
                        onClick={() => setCollectionFilter("General")}
                    >
                        General 
                    </Button>
                    
                    {knownCollections
                        .filter(name => name !== "General") 
                        .map(name => (
                        <Button
                            key={name}
                            variant={collectionFilter === name ? "default" : "outline"}
                            size="sm"
                            className="rounded-full h-8 px-4 border-dashed border-primary/40"
                            onClick={() => setCollectionFilter(name)}
                        >
                            {name}
                        </Button>
                    ))}
                    
                    {knownCollections.length === 0 && bookmarks.length > 0 && (
                        <span className="text-xs text-muted-foreground italic ml-2">
                           
                        </span>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Đang tải danh sách đã lưu...</p>
                    </div>
                ) : bookmarks.length > 0 ? (
                    <div className="space-y-6">
                        {bookmarks.map((bookmark) => {
                             const isPost = !!bookmark.postSummary;
                             const contentId = bookmark.postSummary?.id || bookmark.questionSummary?.id;
                             
                             if (!contentId) return null;

                             return (
                                 <div key={bookmark.id} className="relative">
                                     {bookmark.collectionName && (
                                         <div className="absolute -top-3 left-4 z-10">
                                             <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-sm">
                                                 📁 {bookmark.collectionName}
                                             </Badge>
                                         </div>
                                     )}
                                     
                                     {isPost ? (
                                         <PostCard 
                                            post={{
                                                ...bookmark.postSummary!,
                                                bookmarkedByCurrentUser: true
                                            }}
                                            initialCollectionName={bookmark.collectionName}
                                         />
                                     ) : (
                                         <QuestionCard question={bookmark.questionSummary as any} />
                                     )}
                                 </div>
                             );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/30">
                        <LayoutGrid className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">Chưa có nội dung nào</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            {collectionFilter 
                                ? `Không tìm thấy nội dung nào trong bộ sưu tập "${collectionFilter}".` 
                                : "Bạn chưa lưu bài viết hay câu hỏi nào. Hãy đánh dấu những nội dung hay để xem lại sau!"}
                        </p>
                        {collectionFilter && (
                            <Button variant="link" onClick={clearFilter} className="mt-4">
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {!loading && totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <Button 
                        variant="outline" 
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Trang trước
                    </Button>
                    <span className="flex items-center text-sm font-medium px-4">
                        Trang {page + 1} / {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Trang sau
                    </Button>
                </div>
            )}
        </div>
    );
}