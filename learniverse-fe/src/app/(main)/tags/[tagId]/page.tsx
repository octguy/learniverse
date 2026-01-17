"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { PostCard } from "@/components/post/PostCard"
import { PostCardSkeletonList } from "@/components/post/PostCardSkeleton"
import type { Post } from "@/types/post"
import { postService } from "@/lib/api/postService"
import { Loader2 } from "lucide-react"

const PAGE_SIZE = 10

export default function TagPage() {
  const params = useParams()
  const tagId = params.tagId as string
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (!tagId) return

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const resp = await postService.getPostsByTag(tagId, pageNum, PAGE_SIZE)
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
      console.error("Failed to fetch tag posts:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tagId])

  useEffect(() => {
    setPage(0)
    fetchPosts(0)
  }, [fetchPosts])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
           const nextPage = page + 1
           setPage(nextPage)
           fetchPosts(nextPage, true)
        }
      },
      { rootMargin: "100px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, page, fetchPosts])

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Bài viết theo chủ đề</h1>
      
      {loading && !loadingMore ? (
        <PostCardSkeletonList count={3} />
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Load more sentinel */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          Chưa có bài viết nào cho chủ đề này.
        </div>
      )}
    </div>
  )
}
