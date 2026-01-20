"use client"
import React, { useState } from "react"
import Link from "next/link"
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Edit,
  Trash2,
  Flag,
  Copy,
  Send as SendIcon,
  Globe,
  Users,
  Lock,
  Check,
} from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { Post, ContentVisibility } from "@/types/post"
import { interactionService, ReactionType } from "@/lib/api/interactionService"
import { cn } from "@/lib/utils"
import { CommentSection } from "./CommentSection"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Dialog } from "@/components/ui/dialog"
import CreatePostModal from "./CreatePostModal"
import { SharePostDialog } from "./SharePostDialog"
import { SendPostDialog } from "./SendPostDialog"
import { postService } from "@/lib/api/postService"
import { shareService } from "@/lib/api/shareService"
import { ReportDialog } from "@/components/common/ReportDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  initialCollectionName?: string
  showGroupName?: boolean
}

export function PostCard({ post, onDelete, initialCollectionName, showGroupName = true }: PostCardProps) {
  const { user } = useAuth()
  const { author, title, body, tags = [], attachments = [], createdAt, publishedAt, lastEditedAt } = post

  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    (post.currentUserReaction as ReactionType) || null
  )
  const [reactionCount, setReactionCount] = useState(post.reactionCount)
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedByCurrentUser);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [collectionName, setCollectionName] = useState(initialCollectionName || "");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [shareCount, setShareCount] = useState(post.shareCount)
  const [visibility, setVisibility] = useState<ContentVisibility>(post.visibility || ContentVisibility.PUBLIC)

  const isAuthor = user?.id === author.id

  const handleChangeVisibility = async (newVisibility: ContentVisibility) => {
    try {
      await postService.updatePostVisibility(post.id, newVisibility);
      setVisibility(newVisibility);
      toast.success("Đã cập nhật quyền riêng tư");
    } catch (error) {
      toast.error("Lỗi cập nhật quyền riêng tư");
    }
  }

  const getVisibilityIcon = () => {
    switch (visibility) {
      case ContentVisibility.PUBLIC: return <Globe className="h-3 w-3" />;
      case ContentVisibility.FRIENDS_ONLY: return <Users className="h-3 w-3" />;
      case ContentVisibility.PRIVATE: return <Lock className="h-3 w-3" />;
      case ContentVisibility.GROUP: return <Users className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  }


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

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
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
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const handlePublish = async () => {
    try {
      await postService.updatePostStatus(post.id, 'PUBLISHED');
      toast.success("Đã đăng bài viết thành công!");
      if (onDelete) {
        onDelete(post.id);
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Lỗi đăng bài:", error);
      const errorMessage = error.response?.data?.message || "Không thể đăng bài viết.";
      toast.error(errorMessage);
    }
  }

  const handleReact = async (type: ReactionType) => {
    if (post.status !== 'PUBLISHED') {
      toast.error("Bạn không thể tương tác với bài viết chưa được xuất bản (Nháp).")
      return
    }

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
    } catch (error: any) {
      console.error("Lỗi reaction:", error)
      // Revert optimistic update
      setCurrentReaction(prevReaction)
      setReactionCount(prevCount)

      const errorMessage = error.response?.data?.message || "Không thể thực hiện tương tác.";
      toast.error(errorMessage);
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleSaveBookmark = async () => {
    if (isBookmarkLoading) return;
    setIsBookmarkLoading(true);

    try {
      await interactionService.bookmark({
        contentId: post.id,
        collectionName: collectionName.trim() || "General"
      });
      setIsBookmarked(true);
      toast.success(collectionName ? `Đã lưu vào "${collectionName}"` : "Đã lưu vào General");
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Lỗi bookmark:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleUnbookmark = async () => {
    if (isBookmarkLoading) return;
    setIsBookmarkLoading(true);

    try {
      await interactionService.unbookmark(post.id);
      setIsBookmarked(false);
      toast.success("Đã bỏ lưu bài viết");
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Lỗi unbookmark:", error);
      toast.error("Có lỗi xảy ra");
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

  const parseDate = (dateString: string) => {
    if (!dateString) return new Date();
    const cleanDate = dateString.split('.')[0];
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) return date;
    return new Date();
  }

  const postDate = parseDate(publishedAt || createdAt)

  const images = attachments.filter((att) => att.fileType === "IMAGE")
  const pdfs = attachments.filter((att) => att.fileType === "PDF")
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-visible">
      <CardHeader className="p-4 pb-1 space-y-3">
        <div className="flex items-center gap-3">
          {/* Group post header - Facebook style */}
          {showGroupName && post.groupName ? (
            <>
              {/* Group avatar with nested user avatar */}
              <a href={`/groups/${post.groupSlug}`} className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.groupAvatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {post.groupName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* User avatar nested */}
                <Avatar className="h-6 w-6 absolute -bottom-1 -right-1 border-2 border-background">
                  <AvatarImage src={author.avatarUrl || (author as any).avatar || ""} />
                  <AvatarFallback className="text-xs">{author.username?.charAt(0)}</AvatarFallback>
                </Avatar>
              </a>
              <div className="min-w-0 flex-1">
                {/* Group name */}
                <a
                  href={`/groups/${post.groupSlug}`}
                  className="font-semibold text-sm leading-none hover:underline"
                >
                  {post.groupName}
                </a>
                {/* User name + time */}
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                  <span
                    className="font-medium text-foreground cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = isAuthor ? "/profile" : `/profile/${author.id}`;
                    }}
                  >
                    {author.username}
                  </span>
                  <span>•</span>
                  <span>
                    {!isNaN(postDate.getTime()) ? (
                      formatDistanceToNow(postDate, { addSuffix: true, locale: vi })
                    ) : (
                      "Vừa xong"
                    )}
                  </span>
                  <span>•</span>
                  {getVisibilityIcon()}
                  {(
                    <>
                      <span>•</span>
                      <span className="italic">Đã chỉnh sửa</span>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Personal post header */
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.href = isAuthor ? "/profile" : `/profile/${author.id}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={author.avatarUrl || (author as any).avatar || ""} />
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
                  <span>•</span>
                  {getVisibilityIcon()}
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
          )}
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <>{!post.groupName && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Globe className="mr-2 h-4 w-4" />
                        <span>Chỉnh sửa đối tượng</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleChangeVisibility(ContentVisibility.PUBLIC)}>
                          <Globe className="mr-2 h-4 w-4" />
                          <span>Công khai</span>
                          {visibility === ContentVisibility.PUBLIC && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeVisibility(ContentVisibility.FRIENDS_ONLY)}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>Bạn bè</span>
                          {visibility === ContentVisibility.FRIENDS_ONLY && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeVisibility(ContentVisibility.PRIVATE)}>
                          <Lock className="mr-2 h-4 w-4" />
                          <span>Chỉ mình tôi</span>
                          {visibility === ContentVisibility.PRIVATE && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}

                    {post.status === 'DRAFT' && (
                      <DropdownMenuItem onClick={handlePublish}>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Đăng bài
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa bài viết
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={handleDeleteClick}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa bài viết
                    </DropdownMenuItem>
                  </>
                )}
                {!isAuthor && (
                  <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                    <Flag className="mr-2 h-4 w-4" />
                    Báo cáo vi phạm
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex-none w-12 transition-colors",
                    isBookmarked && "text-yellow-600 hover:text-yellow-700 bg-yellow-50"
                  )}
                  disabled={isBookmarkLoading}
                  title={isBookmarked ? "Đã lưu" : "Lưu bài viết"}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      isBookmarked && "fill-current"
                    )}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">{isBookmarked ? "Đã lưu bài viết" : "Lưu vào bộ sưu tập"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {isBookmarked ? "Quản lý bài viết đã lưu của bạn." : "Nhập tên bộ sưu tập để dễ dàng tìm kiếm sau này."}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collection">Tên bộ sưu tập</Label>
                    <Input
                      id="collection"
                      placeholder="Ví dụ: Java, Tips, Đọc sau..."
                      className="h-9"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between gap-2 mt-2">
                    {isBookmarked && (
                      <Button variant="outline" size="sm" onClick={handleUnbookmark} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Bỏ lưu
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSaveBookmark}
                      className={isBookmarked ? "ml-auto" : "w-full"}
                    >
                      {isBookmarked ? "Cập nhật" : "Lưu bài viết"}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
          {body ? (
            <MarkdownRenderer content={body} />
          ) : (
            <p className="text-muted-foreground">Nội dung bài viết...</p>
          )}
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
                  {!isNaN(parseDate(displayOriginalPost.publishedAt || displayOriginalPost.createdAt).getTime()) ? (
                    formatDistanceToNow(parseDate(displayOriginalPost.publishedAt || displayOriginalPost.createdAt), { addSuffix: true, locale: vi })
                  ) : "Vừa xong"}
                </span>
              </div>
            </div>
            {displayOriginalPost.title && <p className="font-semibold text-sm mb-1">{displayOriginalPost.title}</p>}
            <div className="text-sm text-foreground/90">
              <MarkdownRenderer content={displayOriginalPost.body} />
            </div>

            {displayOriginalPost.attachments && displayOriginalPost.attachments.filter(att => att.fileType === "IMAGE").length > 0 && (
              <div className={cn(
                "mt-2 grid gap-1",
                displayOriginalPost.attachments.filter(att => att.fileType === "IMAGE").length === 1 ? "grid-cols-1" :
                  displayOriginalPost.attachments.filter(att => att.fileType === "IMAGE").length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
              )}>
                {displayOriginalPost.attachments.filter(att => att.fileType === "IMAGE").map((img, index) => (
                  <div key={index} className="relative aspect-video">
                    <img
                      src={img.storageUrl}
                      alt={img.fileName}
                      className="w-full h-full object-cover rounded-sm border"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Display Shared Post PDFs */}
            {displayOriginalPost.attachments && displayOriginalPost.attachments.filter(att => att.fileType === "PDF").length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {displayOriginalPost.attachments.filter(att => att.fileType === "PDF").map((pdf, index) => (
                  <a
                    key={index}
                    href={pdf.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border p-2 text-xs text-blue-600 hover:bg-accent bg-background"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{pdf.fileName}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Fallback for OTHER types or if logic fails */}
            {displayOriginalPost.attachments && displayOriginalPost.attachments.length > 0 &&
              displayOriginalPost.attachments.every(att => att.fileType !== "IMAGE" && att.fileType !== "PDF") && (
                <div className="mt-2 text-muted-foreground text-xs p-2 bg-muted/20 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {displayOriginalPost.attachments.length} tệp đính kèm
                  </div>
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
              disabled={isApiLoading || post.status !== "PUBLISHED"}
              title={post.status !== "PUBLISHED" ? "Bài viết nháp không thể tương tác" : "Thích"}
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
            disabled={post.status !== "PUBLISHED"}
            title={post.status !== "PUBLISHED" ? "Bài viết nháp không thể bình luận" : "Bình luận"}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Bình luận
          </Button>




          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 flex items-center justify-center"
                disabled={post.status !== "PUBLISHED"}
                title={post.status !== "PUBLISHED" ? "Bài viết nháp không thể chia sẻ" : "Chia sẻ"}
              >
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
              <DropdownMenuItem onClick={() => setIsSendDialogOpen(true)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Gửi bằng tin nhắn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Sao chép liên kết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            {isSendDialogOpen && <SendPostDialog post={post} setOpen={setIsSendDialogOpen} />}
          </Dialog>

        </div>

        {tags.length > 0 && (
          <div className="w-full border-t pt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge variant="outline" className="hover:bg-accent cursor-pointer transition-colors">
                  # {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
        {showComments && (
          <div className="w-full animate-in slide-in-from-top-2 duration-200">
            <CommentSection
              postId={post.id}
              commentableType={post.contentType as any}
              onCommentAdded={() => setCommentCount(prev => prev + 1)}
            />
          </div>
        )}
      </CardFooter>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {isEditModalOpen && (
          <CreatePostModal
            setOpen={setIsEditModalOpen}
            onSuccess={() => {
              window.location.reload();
            }}
            initialData={post}
          />
        )}
      </Dialog>

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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa bài viết này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}