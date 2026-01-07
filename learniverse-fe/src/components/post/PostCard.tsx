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
import { useAuth } from "@/context/AuthContext"
import { Dialog } from "@/components/ui/dialog"
import CreatePostModal from "./CreatePostModal"
import { Edit, Trash2, Flag, Copy, Send as SendIcon } from "lucide-react"
import { SharePostDialog } from "./SharePostDialog"
import { postService } from "@/lib/api/postService"
import { shareService } from "@/lib/api/shareService"
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
  onDelete?: (postId: string) => void
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const { author, title, body, tags = [], attachments = [], createdAt, lastEditedAt } = post

  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    (post.currentUserReaction as ReactionType) || null
  )
  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedByCurrentUser);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [shareCount, setShareCount] = useState(post.shareCount)

  const isAuthor = user?.id === author.id


  const [fetchedOriginalPost, setFetchedOriginalPost] = useState<Post | null>(
    post.originalPost ? post.originalPost : null
  );

  React.useEffect(() => {
    const loadOriginalPost = async () => {
      if (post.originalPost) {
        const isDataIncomplete = !post.originalPost.body && !post.originalPost.createdAt;

        if (isDataIncomplete) {
          try {
            const response = await postService.getPostById(post.originalPost.id);
            if (response.data) {
              setFetchedOriginalPost(response.data);
            }
          } catch (err) {
            console.error("Failed to load original post details", err);
          }
        }
      }
    };
    loadOriginalPost();
  }, [post.originalPost]);

  const displayOriginalPost = fetchedOriginalPost || post.originalPost;


  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return

    try {
      await postService.deletePost(post.id)
      toast.success("Đã xóa bài viết")
      if (onDelete) {
        onDelete(post.id)
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error("Lỗi xóa bài viết:", error)
      if (error.response?.status === 500) {
        toast.error("Lỗi máy chủ khi xóa bài viết. Vui lòng báo cáo với admin.")
      } else {
        toast.error("Không thể xóa bài viết")
      }
    }
  }

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

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/posts/${post.id}`
      await navigator.clipboard.writeText(link)
      toast.success("Đã sao chép liên kết")

      // Track share action
      await shareService.trackShare({
        originalContentId: post.id,
        shareType: "DIRECT_MESSAGE"
      })
      setShareCount(prev => prev + 1)
    } catch (error) {
      console.error("Copy link failed", error)
      toast.error("Không thể sao chép liên kết")
    }
  }

  const activeReactionConfig = REACTIONS_CONFIG.find(r => r.type === currentReaction)
  const postDate = new Date(createdAt)

  const images = attachments.filter((att) => att.fileType === "IMAGE")
  const pdfs = attachments.filter((att) => att.fileType === "PDF")
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-visible">
      <CardHeader className="p-4 pb-1 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.location.href = `/profile/${author.id}`}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatarUrl || author.avatar || ""} />
              <AvatarFallback>{author.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-none truncate hover:underline">
                {author.username}
              </p>
              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <span>
                  {!isNaN(postDate.getTime()) ? (
                    formatDistanceToNow(postDate, { addSuffix: true, locale: vi })
                  ) : (
                    "Vừa xong"
                  )}
                </span>
                {(() => {
                  if (!lastEditedAt) return null;

                  const created = new Date(createdAt).getTime();
                  const edited = new Date(lastEditedAt).getTime();


                  const normalize = (d: string) => {
                    try {
                      return d.split('.')[0].replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, '');
                    } catch (e) { return d; }
                  };

                  const isSameWallClock = normalize(createdAt) === normalize(lastEditedAt);

                  if (isSameWallClock || edited <= created + 60 * 1000) {
                    return null;
                  }
                  const diff = Math.abs(edited - created);
                  if (diff > 60000 && diff % 3600000 === 0) {
                    return null;
                  }

                  return (
                    <>
                      <span>•</span>
                      <span className="italic">Đã chỉnh sửa</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa bài viết
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa bài viết
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem>
                  <Flag className="mr-2 h-4 w-4" />
                  Báo cáo
                </DropdownMenuItem>
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
        {title && !title.startsWith("Shared:") && (
          <h2 className="text-lg font-bold text-foreground leading-tight">
            {title}
          </h2>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="mb-4">
          <MarkdownRenderer content={body} />
        </div>

        {displayOriginalPost && (
          <div className="border border-muted rounded-md p-3 mt-4 mb-4 select-none cursor-pointer hover:bg-muted/10" onClick={() => window.location.href = `/posts/${displayOriginalPost?.id}`}>
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={displayOriginalPost.author.avatarUrl || displayOriginalPost.author.avatar || ""} />
                <AvatarFallback>{displayOriginalPost.author.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{displayOriginalPost.author.username}</span>
                <span className="text-xs text-muted-foreground">
                  {!isNaN(new Date(displayOriginalPost.createdAt).getTime()) ? (
                    formatDistanceToNow(new Date(displayOriginalPost.createdAt), { addSuffix: true, locale: vi })
                  ) : "Vừa xong"}
                </span>
              </div>
            </div>
            {displayOriginalPost.title && <p className="font-semibold text-sm mb-1">{displayOriginalPost.title}</p>}
            <div className="text-sm text-foreground/90">
              <MarkdownRenderer content={displayOriginalPost.body} />
            </div>
            {displayOriginalPost.attachments && displayOriginalPost.attachments.length > 0 && (
              <div className="mt-2 w-full bg-muted/20 rounded overflow-hidden flex items-center justify-center border">
                {displayOriginalPost.attachments[0].fileType === "IMAGE" ? (
                  <img src={displayOriginalPost.attachments[0].storageUrl} className="max-h-96 w-full object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground p-4">
                    <FileText /> {displayOriginalPost.attachments.length} tệp đính kèm
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
          <span>{commentCount} Comments</span>
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




          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex-1 flex items-center justify-center">
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ
                <span className="ml-1 text-xs text-muted-foreground">({shareCount})</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                <SendIcon className="mr-2 h-4 w-4" />
                Chia sẻ lên bảng tin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Sao chép liên kết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            <CommentSection
              postId={post.id}
              commentableType={post.contentType}
              onCommentAdded={() => setCommentCount(prev => prev + 1)}
            />
          </div>
        )}
      </CardFooter>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <CreatePostModal
          setOpen={setIsEditModalOpen}
          onSuccess={() => {
            // Có thể thêm logic reload post hoặc update UI ở đây
            window.location.reload(); // Tạm thời reload để thấy thay đổi
          }}
          initialData={post}
        />
      </Dialog>

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <SharePostDialog
          post={post}
          setOpen={setIsShareModalOpen}
          onSuccess={() => {
            setShareCount(prev => prev + 1);
            // Optionally reload but setting count is mostly enough unless we show the new post immediately
          }}
        />
      </Dialog>
    </Card>
  )
}