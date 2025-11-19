"use client"

import React, { useEffect, useState } from "react"
import { CreatePostTrigger } from "@/components/post/CreatePostTrigger"
import { PostCard } from "@/components/post/PostCard"
import type { Post } from "@/types/post"
import { postService } from "@/lib/api/postService"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MainPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
/*
  const fetchPosts = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await postService.getNewsfeed(0, 20) 
      const mappedPosts: Post[] = data.data.content.map((item: any) => ({
        ...item,
        body: item.bodyExcerpt || item.body || "",
        attachments: item.attachments || [],
        viewCount: item.viewCount || 0,
        shareCount: item.shareCount || 0,
        createdAt: item.publishedAt || new Date().toISOString(),
        publishedAt: item.publishedAt || new Date().toISOString(),
      }))
      setPosts(mappedPosts)
    } catch (err) {
      console.error("Failed to fetch posts:", err)
      setError("Không thể tải bảng tin. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  } */
 //hot fix "bodyExcerpt": null from /api/v1/posts/feed
 const fetchPosts = async () => {
  setLoading(true)
  setError("")
  try {
    const feedRes = await postService.getNewsfeed(0, 20)
    if (!feedRes.data || !feedRes.data.content) {
      setPosts([])
      return
    }

    const detailPromises = feedRes.data.content.map((summary: any) =>
      postService.getPostById(summary.id),
    )

    const detailResponses = await Promise.all(detailPromises)

    const fullPosts = detailResponses.map((response) => {
      console.log("getPostById response:", response) // 👈 xem structure ở đây
      return response.data // có thể cần response.data.data tùy API
    })

    console.log("fullPosts:", fullPosts) // 👈 kiểm tra có field title không

    setPosts(fullPosts)
  } catch (err) {
    console.error("Failed to fetch posts:", err)
    setError("Không thể tải bảng tin. Vui lòng thử lại sau.")
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <CreatePostTrigger />
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="text-center py-10 space-y-3">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={fetchPosts} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </Button>
        </div>
      )}

      {/* Danh sách bài viết */}
      {!loading && !error && posts.length > 0 && (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
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