import React, { useState } from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Post } from "@/types/post";
import { useAuth } from "@/context/AuthContext";
import { shareService } from "@/lib/api/shareService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface SharePostDialogProps {
    post: Post;
    setOpen: (open: boolean) => void;
    onSuccess?: () => void;
}

export function SharePostDialog({ post, setOpen, onSuccess }: SharePostDialogProps) {
    const { user } = useAuth();
    const [caption, setCaption] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleShare = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            await shareService.shareToFeed({
                originalContentId: post.id,
                shareType: "NEWSFEED",
                caption: caption.trim() || undefined,
            });
            toast.success("Đã chia sẻ bài viết thành công");
            setOpen(false);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Share failed:", error);
            toast.error("Chia sẻ thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const postDate = new Date(post.createdAt);

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Chia sẻ bài viết</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatarUrl || ""} />
                        <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{user?.username}</p>
                        <div className="mt-2">
                            <Textarea
                                placeholder="Hãy nói gì đó về nội dung này..."
                                className="min-h-[80px] border-none focus-visible:ring-0 px-0 resize-none text-base"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview of Original Post */}
                <div className="border rounded-md p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={post.author.avatarUrl || post.author.avatar || ""} />
                            <AvatarFallback>{post.author.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{post.author.username}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {!isNaN(postDate.getTime()) ? (
                                    formatDistanceToNow(postDate, { addSuffix: true, locale: vi })
                                ) : "Vừa xong"}
                            </span>
                        </div>
                    </div>
                    {post.title && <p className="font-medium text-sm mb-1 line-clamp-1">{post.title}</p>}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.body}
                    </p>
                </div>

            </div>

            <DialogFooter className="sm:justify-end">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                    Hủy
                </Button>
                <Button onClick={handleShare} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Chia sẻ ngay
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
