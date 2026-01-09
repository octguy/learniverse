"use client"

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Flag } from "lucide-react";
import { commentService } from "@/lib/api/commentService";
import type { Comment } from "@/types/comment";
import { toast } from "sonner";
import { ReportDialog } from "@/components/common/ReportDialog";

import { useAuth } from "@/context/AuthContext";

import { cn } from "@/lib/utils";

import { PostAuthor } from "@/types/post";

interface CommentItemProps {
    comment: Comment;
    postId: string;
    commentableType: "POST" | "QUESTION" | "ANSWER";
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

    const isAuthor = user?.id === comment.author.id;

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
        } catch (error) {
            console.error("Lỗi gửi phản hồi:", error);
            toast.error("Gửi thất bại. Vui lòng thử lại.");
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
                    <button className="text-xs font-medium text-muted-foreground hover:text-foreground">Thích</button>
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
            <ReportDialog 
                open={isReportOpen} 
                onOpenChange={setIsReportOpen}
                reportableType="COMMENT" 
                reportableId={comment.id} 
            />        </div>
    );
}
