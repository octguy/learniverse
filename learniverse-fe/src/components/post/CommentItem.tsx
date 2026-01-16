"use client"

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Heart, ThumbsUp, Lightbulb, CheckCircle, HelpCircle, Flag } from "lucide-react";
import { commentService } from "@/lib/api/commentService";
import { interactionService } from "@/lib/api/interactionService";
import { ReactionType } from "@/types/comment";
import type { Comment } from "@/types/comment";
import { toast } from "sonner";
import { ReportDialog } from "@/components/common/ReportDialog";

import { useAuth } from "@/context/AuthContext";

import { cn } from "@/lib/utils";

import { PostAuthor } from "@/types/post";
import { CommentInput } from "./CommentInput";

interface CommentItemProps {
    comment: Comment;
    postId: string;
    commentableType: "POST" | "QUESTION" | "ANSWER" | "SHARED_POST";
    depth?: number;
    parentAuthor?: PostAuthor;
}

export function CommentItem({ comment, postId, commentableType, depth = 0, parentAuthor }: CommentItemProps) {
    const { user } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState<Comment[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [replyCount, setReplyCount] = useState(comment.replyCount);
    const [isReportOpen, setIsReportOpen] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.body);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    const isAuthor = user?.id === comment.author.id;

    const isEditable = React.useMemo(() => {
        if (!isAuthor) return false;
        const createdAt = new Date(comment.createdAt).getTime();
        const now = new Date().getTime();
        const diffInMinutes = (now - createdAt) / (1000 * 60);
        return diffInMinutes < 15;
    }, [isAuthor, comment.createdAt]);

    const [reactionCount, setReactionCount] = useState(comment.reactionCount || 0);
    const [userReaction, setUserReaction] = useState<string | null>(comment.currentUserReaction || null);

    const reactionConfig = {
        [ReactionType.LIKE]: { icon: ThumbsUp, color: "text-blue-600", label: "Thích" },
        [ReactionType.LOVE]: { icon: Heart, color: "text-red-500", label: "Yêu thích" },
        [ReactionType.INSIGHTFUL]: { icon: Lightbulb, color: "text-yellow-600", label: "Sâu sắc" },
        [ReactionType.HELPFUL]: { icon: CheckCircle, color: "text-green-600", label: "Hữu ích" },
        [ReactionType.CURIOUS]: { icon: HelpCircle, color: "text-purple-600", label: "Tò mò" },
    };

    const handleReaction = async (type: string = "LIKE") => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thực hiện chức năng này");
            return;
        }

        const previousReaction = userReaction;
        const previousCount = reactionCount;

        let newReaction: string | null = type;
        let newCount = previousCount;

        if (previousReaction === type) {
            newReaction = null;
            newCount = previousCount - 1;
        } else if (previousReaction) {
            newReaction = type;
            newCount = previousCount;
        } else {
            // New reaction
            newReaction = type;
            newCount = previousCount + 1;
        }

        // Optimistic update
        setUserReaction(newReaction);
        setReactionCount(newCount);

        try {
            await interactionService.react({
                reactableType: "COMMENT",
                reactableId: comment.id,
                reactionType: type as any
            });
        } catch (error) {
            // Rollback
            setUserReaction(previousReaction);
            setReactionCount(previousCount);
            toast.error("Có lỗi xảy ra khi thả cảm xúc");
        }
    };

    const getReactionIcon = () => {
        if (userReaction && reactionConfig[userReaction as ReactionType]) {
            const config = reactionConfig[userReaction as ReactionType];
            const Icon = config.icon;
            return <Icon className={cn("w-3.5 h-3.5", config.color)} />;
        }
        return <ThumbsUp className="w-3.5 h-3.5" />; // Default icon
    };

    const getReactionLabel = () => {
        if (userReaction && reactionConfig[userReaction as ReactionType]) {
            return reactionConfig[userReaction as ReactionType].label;
        }
        return "Thích";
    };

    const handleToggleReplies = async () => {
        const newShowReplies = !showReplies;
        setShowReplies(newShowReplies);

        if (newShowReplies && replies.length === 0 && replyCount > 0) {
            await fetchReplies();
        }
    };

    const handleReplyClick = () => {
        if (!isReplying) {
            setReplyText(`@${comment.author.username} `);
        }
        setIsReplying(!isReplying);
    };

    const fetchReplies = async () => {
        try {
            setIsLoadingReplies(true);
            const data = await commentService.getReplies(comment.id);
            setReplies(data.content);
        } catch (error) {
            console.error("Lỗi tải phản hồi:", error);
            toast.error("Không thể tải phản hồi");
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleSubmitReply = async (text: string, mentionedUserIds: string[]) => {
        if (!text.trim()) return;

        setIsSubmittingReply(true);
        try {
            const createdReply = await commentService.createComment({
                commentableType: commentableType,
                commentableId: postId,
                parentId: comment.id,
                body: text,
                mentionedUserIds: mentionedUserIds
            });

            setReplies([...replies, createdReply]);
            setReplyText("");
            setIsReplying(false);
            setReplyCount(prev => prev + 1);

            if (!showReplies) {
                setShowReplies(true);
            }

            toast.success("Đã phản hồi!");
        } catch (error: any) {
            console.error("Lỗi gửi phản hồi:", error);
            if (error.response?.status === 400) {
                toast.error(error.response.data?.message || "Bình luận không được đăng vì chứa ngôn từ không phù hợp.");
            } else {
                toast.error("Gửi thất bại. Vui lòng thử lại.");
            }
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleUpdate = async (text: string, mentionedUserIds: string[]) => {
        if (!text.trim() || text === comment.body) {
            setIsEditing(false);
            return;
        }

        setIsSubmittingEdit(true);
        try {
            const updatedComment = await commentService.updateComment(comment.id, text, mentionedUserIds);

            toast.success("Đã cập nhật bình luận");
            comment.body = updatedComment.body;
            setIsEditing(false);
        } catch (error: any) {
            console.error("Lỗi cập nhật:", error);
            toast.error(error.response?.data?.message || "Không thể cập nhật bình luận");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    return (
        <div className="flex gap-3">
            <Avatar className="w-8 h-8">
                <AvatarImage src={comment.author.avatarUrl || comment.author.avatar} />
                <AvatarFallback>{comment.author.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{comment.author.username}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <CommentInput
                            initialValue={editText}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Lưu"
                            autoFocus
                        />
                    </div>
                ) : (
                    <div className="text-sm text-foreground/90 whitespace-pre-line">
                        {(() => {
                            const elements: React.ReactNode[] = [];
                            const regex = /(@\[([\w._@]+)\]\(([a-zA-Z0-9-]+)\))|(@[\w._@]+)/g;

                            let lastIndex = 0;
                            let match;

                            while ((match = regex.exec(comment.body)) !== null) {
                                if (match.index > lastIndex) {
                                    elements.push(comment.body.slice(lastIndex, match.index));
                                }

                                const fullMatch = match[0];
                                const isNewFormat = fullMatch.startsWith("@[");

                                if (isNewFormat) {
                                    const username = match[2];
                                    const userId = match[3];
                                    elements.push(
                                        <a
                                            key={match.index}
                                            href={`/profile/${userId}`}
                                            className="text-blue-600 hover:underline font-medium"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            @{username}
                                        </a>
                                    );
                                } else {
                                    const part = match[4];
                                    if (part.length > 1) {
                                        const username = part.slice(1);
                                        let link = `/profile/${username}`;

                                        if (parentAuthor && parentAuthor.username === username) {
                                            link = `/profile/${parentAuthor.id}`;
                                        } else if (user && user.username === username) {
                                            link = `/profile/${user.id}`;
                                        }

                                        elements.push(
                                            <a
                                                key={match.index}
                                                href={link}
                                                className="text-blue-600 hover:underline font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {part}
                                            </a>
                                        );
                                    } else {
                                        elements.push(part);
                                    }
                                }

                                lastIndex = regex.lastIndex;
                            }

                            if (lastIndex < comment.body.length) {
                                elements.push(comment.body.slice(lastIndex));
                            }

                            return elements;
                        })()}
                    </div>
                )}
                <div className="flex gap-4 mt-1 items-center">
                    <div className="relative group/reaction">
                        <div className="absolute bottom-full left-0 pb-4 hidden group-hover/reaction:block z-50">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border shadow-lg rounded-full p-1 animate-in fade-in zoom-in duration-200">
                                {Object.entries(reactionConfig).map(([type, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={type}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReaction(type);
                                            }}
                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-transform hover:scale-125 relative focus:outline-none"
                                            title={config.label}
                                        >
                                            <Icon className={cn("w-5 h-5", config.color)} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            className={cn(
                                "text-xs font-medium flex items-center gap-1 transition-colors py-1",
                                userReaction && reactionConfig[userReaction as ReactionType]
                                    ? reactionConfig[userReaction as ReactionType].color
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => handleReaction(userReaction || "LIKE")}
                        >
                            {getReactionIcon()}
                            <span>
                                {reactionCount > 0 ? reactionCount : "Thích"}
                            </span>
                        </button>
                    </div>

                    <button
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                        onClick={handleReplyClick}
                    >
                        Phản hồi
                    </button>
                    {!isAuthor && (
                        <button
                            className="text-xs font-medium text-muted-foreground hover:text-destructive"
                            onClick={() => setIsReportOpen(true)}
                        >
                            Báo cáo
                        </button>
                    )}

                    {isEditable && (
                        <button
                            className="text-xs font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => setIsEditing(true)}
                        >
                            Chỉnh sửa
                        </button>
                    )}

                    {replyCount > 0 && (
                        <button
                            className="text-xs font-medium text-muted-foreground hover:text-foreground ml-2"
                            onClick={handleToggleReplies}
                        >
                            {showReplies ? "Ẩn phản hồi" : `Xem ${replyCount} phản hồi`}
                        </button>
                    )}
                </div>

                {isReplying && (
                    <div className="flex gap-3 mt-3 animate-in slide-in-from-top-2">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback>Me</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CommentInput
                                initialValue={replyText}
                                initialMentions={[comment.author] as any}
                                onSubmit={handleSubmitReply}
                                onCancel={() => setIsReplying(false)}
                                placeholder={`Trả lời ${comment.author.username}...`}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {showReplies && (
                    <div className={cn("mt-4 space-y-4 pt-2", depth >= 2 && "-ml-11")}>
                        {isLoadingReplies ? (
                            <div className="text-xs text-muted-foreground pl-4">Đang tải...</div>
                        ) : (
                            replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    postId={postId}
                                    commentableType={commentableType}
                                    depth={depth + 1}
                                    parentAuthor={comment.author}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
            <ReportDialog
                open={isReportOpen}
                onOpenChange={setIsReportOpen}
                reportableType="COMMENT"
                reportableId={comment.id}
            />        </div>
    );
}
