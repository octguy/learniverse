"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { postService } from "@/lib/api/postService";
import { Post } from "@/types/post";
import { PostCard } from "@/components/post/PostCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;

            setLoading(true);
            try {
                const response = await postService.getPostById(postId);
                if (response.data) {
                    setPost(response.data);
                } else {
                    setError("Không tìm thấy bài viết");
                }
            } catch (err: any) {
                console.error("Lỗi tải bài viết:", err);
                setError(err.response?.data?.message || "Có lỗi xảy ra khi tải bài viết");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const handleBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{error || "Không tìm thấy bài viết"}</p>
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-6 px-4 md:px-0">
            <Button
                variant="ghost"
                onClick={handleBack}
                className="mb-4 pl-0 hover:bg-transparent hover:text-primary transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>

            <PostCard
                post={post}
                onDelete={() => router.push("/")}
            />
        </div>
    );
}
