"use client"
import React, { useState } from "react"
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
  Heart,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Bookmark,
} from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"
import type { Post } from "@/types/post"
import { interactionService, ReactionType } from "@/lib/api/interactionService"
import { cn } from "@/lib/utils"
import { CommentSection } from "./CommentSection"
import { toast } from "sonner"
const REACTIONS_CONFIG = [
  {
    type: "LIKE" as ReactionType,
    icon: ThumbsUp,
    label: "Thích",
    color: "text-blue-600"
  },
  {
    type: "LOVE" as ReactionType,
    icon: Heart,
    label: "Yêu thích",
    color: "text-red-500"
  },
  {
    type: "INSIGHTFUL" as ReactionType,
    icon: Lightbulb,
    label: "Sâu sắc",
    color: "text-yellow-600"
  },
  {
    type: "HELPFUL" as ReactionType,
    icon: CheckCircle,
    label: "Hữu ích",
    color: "text-green-600"
  },
  {
    type: "CURIOUS" as ReactionType,
    icon: HelpCircle,
    label: "Tò mò",
    color: "text-purple-600"
  },
]

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { author, title, body, tags, attachments, createdAt, lastEditedAt } = post

  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    (post.currentUserReaction as ReactionType) || null
  )
  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedByCurrentUser);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const handleReact = async (type: ReactionType) => {
    if (isApiLoading) return
    setIsApiLoading(true)

    const prevReaction = currentReaction
    const prevCount = reactionCount

    if (currentReaction === type) {
      setCurrentReaction(null)
      setReactionCount(prevCount - 1)
    } else {
      if (!currentReaction) {
        setReactionCount(prevCount + 1)
      }
      setCurrentReaction(type)
    }

    try {
      await interactionService.react({
        reactableType: "CONTENT",
        reactableId: post.id,
        reactionType: type,
      })
    } catch (error) {
      console.error("Lỗi reaction:", error)
      setCurrentReaction(prevReaction)
      setReactionCount(prevCount)
    } finally {
      setIsApiLoading(false)
    }
  }
  const handleBookmark = async () => {
    if (isBookmarkLoading) return;
    setIsBookmarkLoading(true);
    const prevIsBookmarked = isBookmarked;
    
    setIsBookmarked(!isBookmarked);

    try {
      if (prevIsBookmarked) {
        await interactionService.unbookmark(post.id);
        toast.success("Đã bỏ lưu bài viết");
      } else {
        await interactionService.bookmark(post.id);
        toast.success("Đã lưu bài viết");
      }
    } catch (error) {
      console.error("Lỗi bookmark:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
      setIsBookmarked(prevIsBookmarked);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const activeReactionConfig = REACTIONS_CONFIG.find(r => r.type === currentReaction)
  const postDate = new Date(createdAt)
  const isOwnPost = author.id === "user_123"
  const hoursSinceCreation =
    (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60)
  const canEdit = isOwnPost && hoursSinceCreation < 24

  const images = attachments.filter((att) => att.fileType === "IMAGE")
  const pdfs = attachments.filter((att) => att.fileType === "PDF")
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-visible">
      <CardHeader className="p-4 pb-1 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatarUrl} />
            <AvatarFallback>{author.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm leading-none truncate">
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
              <DropdownMenuContent align="end">
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
            <Button
            variant="ghost"
            size="icon" 
            className={cn(
                "flex-none w-12 transition-colors", 
                isBookmarked && "text-yellow-600 hover:text-yellow-700 bg-yellow-50"
            )}
            onClick={handleBookmark}
            disabled={isBookmarkLoading}
            title={isBookmarked ? "Bỏ lưu" : "Lưu bài viết"}
          >
            <Bookmark 
                className={cn(
                    "h-4 w-4", 
                    isBookmarked && "fill-current"
                )} 
            />
          </Button>
          </div>
        </div>
        {title && (
          <h2 className="text-lg font-bold text-foreground leading-tight">
            {title}
          </h2>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
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

      <CardFooter className="flex-col items-start gap-4 z-10">
        <div className="flex w-full justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {activeReactionConfig && (
              <activeReactionConfig.icon className={cn("h-4 w-4", activeReactionConfig.color)} />
            )}
            <span>{reactionCount} Reactions</span>
          </div>
          <span>{post.commentCount} Comments</span>
        </div>

        <div className="w-full border-t pt-2 flex relative">

          <div className="flex-1 group relative">
            <div className="absolute bottom-full left-0 pb-3 hidden group-hover:block z-50 w-max">
              <div className="flex items-center gap-1 bg-white border shadow-lg rounded-full p-1.5 animate-in fade-in zoom-in duration-200">
                {REACTIONS_CONFIG.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(reaction.type);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-125 focus:outline-none"
                    title={reaction.label}
                  >
                    <reaction.icon className={cn("h-6 w-6", reaction.color)} />
                  </button>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              className={cn(
                "w-full flex items-center justify-center transition-colors",
                activeReactionConfig ? `${activeReactionConfig.color} font-semibold` : "text-muted-foreground"
              )}
              onClick={() => handleReact("LIKE")}
              disabled={isApiLoading}
            >
              {activeReactionConfig ? (
                <activeReactionConfig.icon className={cn("h-5 w-5 mr-2", activeReactionConfig.color)} />
              ) : (
                <ThumbsUp className="h-4 w-4 mr-2" />
              )}

              {activeReactionConfig ? activeReactionConfig.label : "Thích"}
            </Button>
          </div>

          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-center"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Bình luận
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
        {showComments && (
          <div className="w-full animate-in slide-in-from-top-2 duration-200">
             <CommentSection postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}