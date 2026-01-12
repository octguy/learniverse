"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { CreatePostTrigger } from "@/components/post/CreatePostTrigger"
import { PostCard } from "@/components/post/PostCard"
import { PostCardSkeletonList } from "@/components/post/PostCardSkeleton"
import type { Post } from "@/types/post"
import { postService } from "@/lib/api/postService"
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

const PAGE_SIZE = 10

export default function MainPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setError("")
    }

    try {
      const feedRes = await postService.getNewsfeed(pageNum, PAGE_SIZE)
      const feedData = feedRes.data
      const summaries = (feedData?.content ?? []).filter(
        (item: any) => item.contentType === "POST" || item.contentType === "SHARED_POST",
      )

      setHasMore(!feedData?.last)

      if (summaries.length === 0) {
        if (!append) setPosts([])
        return
      }

      const detailResponses = await Promise.all(
        summaries.map((summary: any) => postService.getPostById(summary.id)),
      )

      const fullPosts = detailResponses
        .map((response, idx) => {
          const summary = summaries[idx]
          const data = response.data
          return {
            ...data,
            groupId: data.groupId ?? summary.groupId,
            groupName: data.groupName ?? summary.groupName,
            groupSlug: data.groupSlug ?? summary.groupSlug,
            groupAvatarUrl: data.groupAvatarUrl ?? summary.groupAvatarUrl,
          }
        })
        .filter((post) => post.contentType === "POST" || post.contentType === "SHARED_POST")

      if (append) {
        setPosts((prev) => [...prev, ...fullPosts])
      } else {
        setPosts(fullPosts)
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err)
      if (!append) {
        setError("Không thể tải bảng tin. Vui lòng thử lại sau.")
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(nextPage, true)
    }
  }, [loadingMore, hasMore, loading, page, fetchPosts])

  useEffect(() => {
    fetchPosts(0)
  }, [fetchPosts])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadMore])

  // Refresh handler
  const handleRefresh = () => {
    setPage(0)
    setHasMore(true)
    fetchPosts(0)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <CreatePostTrigger onPostCreated={handleRefresh} />

      {loading && (
        <PostCardSkeletonList count={3} />
      )}

      {error && (
        <div className="text-center py-10 space-y-3">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </Button>
        </div>
      )}

      {/* Posts list */}
      {!loading && !error && posts.length > 0 && (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(deletedId) => setPosts((prev) => prev.filter((p) => p.id !== deletedId))}
            />
          ))}

          <div ref={sentinelRef} className="h-1" />

          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Đang tải thêm bài viết...</span>
              </div>
            </div>
          )}

          {!hasMore && posts.length > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mb-2 text-primary/60" />
              <p className="text-sm font-medium">Bạn đã xem hết bài viết mới nhất!</p>
              <p className="text-xs mt-1">Kéo xuống để làm mới hoặc quay lại sau</p>
            </div>
          )}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ kiến thức!
        </div>
      )}
    </div>
  )
}