"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { PostCard } from "@/components/post/PostCard"
import { PostCardSkeletonList } from "@/components/post/PostCardSkeleton"
import type { Post } from "@/types/post"
import { postService } from "@/lib/api/postService"
import { Loader2, FileEdit } from "lucide-react"

const PAGE_SIZE = 10

export default function MyDraftsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchDrafts = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const resp = await postService.getMyDrafts(pageNum, PAGE_SIZE)
      const summaries = resp?.content ?? []
      
      setHasMore(!resp?.last)

      if (summaries.length === 0) {
        if (!append) setPosts([])
        return
      }

      const detailResponses = await Promise.all(
        summaries.map((summary: any) => postService.getPostById(summary.id)),
      )

      const fullPosts = detailResponses
        .map((response) => response.data)
        .filter((post) => !!post)

      if (append) {
        setPosts((prev) => [...prev, ...fullPosts])
      } else {
        setPosts(fullPosts)
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchDrafts(0)
  }, [fetchDrafts])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
           const nextPage = page + 1
           setPage(nextPage)
           fetchDrafts(nextPage, true)
        }
      },
      { rootMargin: "100px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, page, fetchDrafts])

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileEdit className="w-6 h-6" />
        Bài viết nháp
      </h1>
      
      {loading && !loadingMore ? (
        <PostCardSkeletonList count={3} />
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-sidebar-accent/50">
           <FileEdit className="w-12 h-12 mx-auto mb-4 opacity-50" />
           <p>Bạn chưa có bài viết nháp nào.</p>
        </div>
      )}
    </div>
  )
}
