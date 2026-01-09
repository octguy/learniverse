"use client"

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Heart, ThumbsUp, Lightbulb, CheckCircle, HelpCircle } from "lucide-react";
import { commentService } from "@/lib/api/commentService";
import { interactionService } from "@/lib/api/interactionService";
import { ReactionType } from "@/types/comment";
import type { Comment } from "@/types/comment";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";

import { cn } from "@/lib/utils";

import { PostAuthor } from "@/types/post";

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
    
    // Reaction state
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

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;

        setIsSubmittingReply(true);
        try {
            const createdReply = await commentService.createComment({
                commentableType: commentableType,
                commentableId: postId,
                parentId: comment.id,
                body: replyText,
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
                <div className="text-sm text-foreground/90 whitespace-pre-line">
                    {comment.body.split(/(@[\w._@]+)/g).map((part, index) => {
                        if (part.startsWith("@") && part.length > 1) {
                            const username = part.slice(1);

                            let link = `/profile/${username}`;


                            if (parentAuthor && parentAuthor.username === username) {
                                link = `/profile/${parentAuthor.id}`;
                            }
                            else if (user && user.username === username) {
                                link = `/profile/${user.id}`;
                            }

                            return (
                                <a
                                    key={index}
                                    href={link}
                                    className="text-blue-600 hover:underline font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {part}
                                </a>
                            );
                        }
                        return part;
                    })}
                </div>
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
                        <div className="flex-1 gap-2 flex flex-col">
                            <Textarea
                                placeholder={`Trả lời ${comment.author.username}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[60px] text-sm"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Hủy</Button>
                                <Button
                                    size="sm"
                                    onClick={handleSubmitReply}
                                    disabled={!replyText.trim() || isSubmittingReply}
                                >
                                    {isSubmittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : "Gửi"}
                                </Button>
                            </div>
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
        </div>
    );
}
