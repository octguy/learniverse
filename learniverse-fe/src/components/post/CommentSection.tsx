"use client"
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Send, Loader2 } from "lucide-react";
import { commentService } from "@/lib/api/commentService";
import type { Comment } from "@/types/comment";
import { toast } from "sonner";

import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await commentService.getComments("CONTENT", postId);
      setComments(data.content);
    } catch (error) {
      console.error("Lỗi tải bình luận:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const createdComment = await commentService.createComment({
        commentableType: "CONTENT",
        commentableId: postId,
        body: newComment
      });

      setComments([createdComment, ...comments]);
      setNewComment("");
      onCommentAdded?.();

      toast.success("Đã gửi bình luận!");

    } catch (error) {
      console.error("Lỗi gửi bình luận:", error);
      toast.error("Gửi thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-4 border-t">
      <h3 className="text-sm font-semibold mb-4">Bình luận</h3>
      <div className="flex gap-3 mb-6">
        <Avatar className="w-8 h-8">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
        <div className="flex-1 gap-2 flex flex-col min-w-0">
          <Textarea
            placeholder="Viết bình luận của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}

              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gửi
            </Button>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}