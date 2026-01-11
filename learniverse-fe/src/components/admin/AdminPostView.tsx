// src/components/admin/AdminPostView.tsx
"use client"
import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
  FileText,
  ThumbsUp,
  MessageCircle,
  Share2,
  Heart,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Loader2,
  Copy,
  Send,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog } from "@/components/ui/dialog"
import { toast } from "sonner"
import { interactionService } from "@/lib/api/interactionService"
import { shareService } from "@/lib/api/shareService"
import { SharePostDialog } from "@/components/post/SharePostDialog"
import { ReportDialog } from "@/components/common/ReportDialog"
import { MarkdownRenderer } from "@/components/post/MarkdownRenderer"
import type { Post } from "@/types/post"
import { ReactionType } from "@/lib/api/interactionService"
import { cn } from "@/lib/utils"
import { CommentSection } from "@/components/post/CommentSection"
import { useAuth } from "@/context/AuthContext"
import { postService } from "@/lib/api/postService"

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

interface AdminPostViewProps {
  post: Post
}

export function AdminPostView({ post }: AdminPostViewProps) {
  const { user } = useAuth()
  const { author, title, body, tags = [], attachments = [], createdAt, lastEditedAt } = post

  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    (post.currentUserReaction as ReactionType) || null
  )
  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [shareCount, setShareCount] = useState(post.shareCount)
  
  const [fetchedOriginalPost, setFetchedOriginalPost] = useState<Post | null>(
    (post.originalPost && post.originalPost.body) ? post.originalPost : null
  );
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);

  React.useEffect(() => {
    const loadOriginalPost = async () => {
      if (post.originalPost) {
        const isDataIncomplete = !post.originalPost.body;

        if (isDataIncomplete) {
          setIsLoadingOriginal(true);
          try {
            const response = await postService.getPostById(post.originalPost.id);
            if (response.data) {
              setFetchedOriginalPost(response.data);
            }
          } catch (err) {
            console.error("Failed to load original post details", err);
          } finally {
            setIsLoadingOriginal(false);
          }
        }
      }
    };
    loadOriginalPost();
  }, [post.originalPost]);

  const displayOriginalPost = fetchedOriginalPost || (post.originalPost && post.originalPost.body ? post.originalPost : null);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full w-full">
        {/* Left Column: Post Content */}
        <div className="h-full overflow-y-auto p-4 border-r">
            <Card className="w-full border-none shadow-none">
            <CardHeader className="p-0 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                {post.groupName ? (
                    <>
                    <a href={`/groups/${post.groupSlug}`} className="relative shrink-0" target="_blank" rel="noopener noreferrer">
                        <Avatar className="h-10 w-10">
                        <AvatarImage src={post.groupAvatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {post.groupName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                        </Avatar>
                        <Avatar className="h-6 w-6 absolute -bottom-1 -right-1 border-2 border-background">
                        <AvatarImage src={author.avatarUrl || (author as any).avatar || ""} />
                        <AvatarFallback className="text-xs">{author.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </a>
                    <div className="min-w-0 flex-1">
                        <a 
                        href={`/groups/${post.groupSlug}`}
                        className="font-semibold text-sm leading-none hover:underline"
                        target="_blank" rel="noopener noreferrer"
                        >
                        {post.groupName}
                        </a>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                        <span className="font-medium text-foreground">
                            {author.username}
                        </span>
                        <span>•</span>
                        <span>{formatDistanceToNow(postDate, { addSuffix: true, locale: vi })}</span>
                        {lastEditedAt && (
                            <span className="text-muted-foreground ml-1" title={new Date(lastEditedAt).toLocaleString()}>
                            (đã chỉnh sửa)
                            </span>
                        )}
                        </div>
                    </div>
                    </>
                ) : (
                    <>
                    <Avatar 
                        className="h-10 w-10 border cursor-pointer"
                        onClick={() => window.open(`/profile/${author.id}`, '_blank')}
                    >
                        <AvatarImage src={author.avatarUrl || (author as any).avatar || ""} />
                        <AvatarFallback>{author.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span 
                        className="font-semibold text-sm cursor-pointer hover:underline"
                        onClick={() => window.open(`/profile/${author.id}`, '_blank')}
                        >
                        {author.username}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(postDate, { addSuffix: true, locale: vi })}</span>
                        {lastEditedAt && (
                            <span title={new Date(lastEditedAt).toLocaleString()}>
                            (đã chỉnh sửa)
                            </span>
                        )}
                        </div>
                    </div>
                    </>
                )}
                </div>
            </CardHeader>

            <CardContent className="p-0 space-y-3">
                <h3 className="text-xl font-bold leading-tight">{title}</h3>
                
                <div className="text-base leading-relaxed break-words">
                    <MarkdownRenderer content={body} />
                </div>

                {/* Display Shared Post */}
                {post.contentType === "SHARED_POST" && (
                    isLoadingOriginal ? (
                        <div className="mt-3 border rounded-md p-4 bg-muted/10 flex items-center justify-center">
                             <Loader2 className="animate-spin w-4 h-4 mr-2 text-muted-foreground" /> 
                             <span className="text-sm text-muted-foreground">Đang tải bài viết gốc...</span>
                        </div>
                    ) : (displayOriginalPost ? (
                    <div className="mt-3 border rounded-md p-3 bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={displayOriginalPost.author.avatarUrl} />
                            <AvatarFallback>{displayOriginalPost.author.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold">{displayOriginalPost.author.username}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(displayOriginalPost.createdAt), { addSuffix: true, locale: vi })}
                        </span>
                        </div>
                        <h4 className="font-medium mb-1">{displayOriginalPost.title}</h4>
                        <div className="text-sm text-muted-foreground line-clamp-3">
                         <MarkdownRenderer content={displayOriginalPost.body} />
                        </div>
                    </div>
                    ) : (
                    <div className="mt-3 border rounded-md p-4 bg-muted/10 text-center">
                        <p className="text-sm text-muted-foreground">Bài viết gốc không tồn tại hoặc đã bị xóa.</p>
                    </div>
                    ))
                )}

                {/* Images Grid */}
                {images.length > 0 && (
                <div className={cn(
                    "grid gap-2 mt-3",
                    images.length === 1 ? "grid-cols-1" : 
                    images.length === 2 ? "grid-cols-2" : 
                    "grid-cols-2 md:grid-cols-3"
                )}>
                    {images.map((img) => (
                    <div key={img.id} className="relative aspect-auto rounded-md overflow-hidden bg-muted">
                        <img
                        src={img.storageUrl}
                        alt="Post attachment"
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                        // Simple enhancement: Click to open in new tab
                        onClick={() => window.open(img.storageUrl, '_blank')}
                        />
                    </div>
                    ))}
                </div>
                )}

                {/* PDF Attachments */}
                {pdfs.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {pdfs.map((pdf) => (
                    <a
                        key={pdf.id}
                        href={pdf.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {pdf.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">PDF Document</p>
                        </div>
                    </a>
                    ))}
                </div>
                )}

                {/* Tags */}
                {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                        {tag.name}
                    </Badge>
                    ))}
                </div>
                )}
            </CardContent>

            <CardFooter className="p-0 pt-4 flex flex-col gap-3 border-t mt-4">
                <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 min-w-[2rem]">
                            {activeReactionConfig ? (
                            <activeReactionConfig.icon className={cn("w-4 h-4", activeReactionConfig.color)} />
                            ) : (
                            <ThumbsUp className="w-4 h-4" />
                            )}
                            <span>{reactionCount} reactions</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                            <span className="hidden sm:inline">{post.commentCount} Comments</span>
                            <span className="sm:hidden">{post.commentCount}</span>
                            <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                            <span className="hidden sm:inline">{shareCount} Shares</span>
                            <span className="sm:hidden">{shareCount}</span>
                            <Share2 className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Interaction Buttons Row */}
                <div className="w-full border-t pt-2 flex relative">

                  <div className="flex-1 group relative">
                    <div className="absolute bottom-full left-0 pb-3 hidden group-hover:block z-50 w-max">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border shadow-lg rounded-full p-1.5 animate-in fade-in zoom-in duration-200">
                        {REACTIONS_CONFIG.map((reaction) => (
                          <button
                            key={reaction.type}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReact(reaction.type);
                            }}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-transform hover:scale-125 focus:outline-none"
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
                    onClick={() => {
                        // Focus comment input if possible, or just visually acknowledge
                    }}
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
                        <Send className="mr-2 h-4 w-4" />
                        Chia sẻ lên bảng tin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyLink}>
                        <Copy className="mr-2 h-4 w-4" />
                        Sao chép liên kết
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="text-destructive">
                         <Flag className="mr-2 h-4 w-4" />
                         Báo cáo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>
            </CardFooter>
            </Card>
        </div>

        {/* Right Column: Comments */}
        <div className="h-full overflow-y-auto p-4 bg-muted/10">
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Bình luận</h4>
            <CommentSection postId={post.id} commentableType="POST" />
        </div>

        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <SharePostDialog
            post={post}
            setOpen={setIsShareModalOpen}
            onSuccess={() => {
                setShareCount(prev => prev + 1);
            }}
            />
        </Dialog>

        <ReportDialog 
            open={isReportDialogOpen} 
            onOpenChange={setIsReportDialogOpen}
            reportableType="POST"
            reportableId={post.id}
        />
    </div>
  )
}
