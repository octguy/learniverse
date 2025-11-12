"use client"
import React from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
  MoreHorizontal,
  FileText,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
} from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"
import type { Post } from "@/types/post"

const CURRENT_USER_ID = "user_123"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { author, body, tags, attachments, createdAt, lastEditedAt } = post

  const postDate = new Date(createdAt)
  const isOwnPost = author.id === CURRENT_USER_ID
  const hoursSinceCreation =
    (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60)
  const canEdit = isOwnPost && hoursSinceCreation < 24

  const images = attachments.filter((att) => att.fileType === "IMAGE")
  const pdfs = attachments.filter((att) => att.fileType === "PDF")

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={author.avatarUrl} />
            <AvatarFallback>{author.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-none truncate">
              {author.username}
            </p>
            <div className="mt-1 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(postDate, { addSuffix: true, locale: vi })}
              </span>
              {lastEditedAt && <span> • (Đã chỉnh sửa)</span>}
            </div>
          </div>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {canEdit && (
                  <DropdownMenuItem onClick={() => alert("Mở modal chỉnh sửa")}>
                    Chỉnh sửa bài viết
                  </DropdownMenuItem>
                )}
                {isOwnPost ? (
                  <DropdownMenuItem className="text-red-500">
                    Xóa bài viết
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>Báo cáo bài viết</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent>
        <div className="mb-4">
          <MarkdownRenderer content={body} />
        </div>

        {images.length > 0 && (
          <div className="mt-4">
            <img
              src={images[0].storageUrl}
              alt={images[0].fileName}
              className="max-h-96 w-full rounded-md border object-contain"
            />
          </div>
        )}

        {pdfs.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {pdfs.map((pdf) => (
              <a
                key={pdf.id}
                href={pdf.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border p-2 text-sm text-blue-600 hover:bg-accent"
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{pdf.fileName}</span>
              </a>
            ))}
          </div>
        )}
      </CardContent>

      {/* FOOTER */}
      <CardFooter className="flex-col items-start gap-4">
        <div className="flex w-full justify-between text-xs text-muted-foreground">
          <span>{post.reactionCount} Reactions</span>
          <span>{post.commentCount} Comments</span>
        </div>

        <div className="w-full border-t pt-2 flex">
          <Button variant="ghost" className="flex-1 flex items-center justify-center">
            <ThumbsUp className="h-4 w-4 mr-2" /> Thích
          </Button>
          <Button variant="ghost" className="flex-1 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 mr-2" /> Bình luận
          </Button>
          <Button variant="ghost" className="flex-1 flex items-center justify-center">
            <Share2 className="h-4 w-4 mr-2" /> Chia sẻ
          </Button>
        </div>


        {tags.length > 0 && (
          <div className="w-full border-t pt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
