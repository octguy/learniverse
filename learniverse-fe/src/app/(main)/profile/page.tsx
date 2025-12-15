"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userProfileService } from "@/lib/api/userProfileService";
import { postService } from "@/lib/api/postService";
import { interactionService } from "@/lib/api/interactionService";
import { UserProfileResponse } from "@/types/userProfile";
import { PostResponse, BookmarkResponse } from "@/types/post";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { ProfileEditForm } from "@/components/auth/profile-edit-form";
import {PostCard} from "@/components/post/PostCard";
import { Loader2, FileText, Bookmark, LayoutGrid } from "lucide-react";
import {QuestionCard} from "@/components/question/question-card";
import { CreatePostTrigger } from "@/components/post/CreatePostTrigger";

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [myPosts, setMyPosts] = useState<PostResponse[]>([]);
    const [savedContent, setSavedContent] = useState<BookmarkResponse[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);

    const fetchProfile = async () => {
        try {
            const data = await userProfileService.getMyProfile();
            setProfile(data);
        } catch (error) {
            console.error("Lỗi tải hồ sơ:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyPosts = async () => {
        if (!profile?.user?.id) return;
        setLoadingContent(true);
        try {
            const data = await postService.getPostsByUser(profile.user.id);
            setMyPosts(data.content || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchBookmarks = async () => {
        setLoadingContent(true);
        try {
            const data = await interactionService.getMyBookmarks();
            setSavedContent(data.content || []);
        } catch (error) {
            console.error("Lỗi tải bookmark:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile) fetchMyPosts();
    }, [profile]);

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;
    if (!profile) return <div className="text-center mt-10">Không tìm thấy thông tin người dùng.</div>;

    const isMe = true;
    return (
        <div className="container max-w-5xl mx-auto py-6 px-4 md:px-6 space-y-6">
            <ProfileHeader
                profile={profile}
                isOwnProfile={true}
                onEditClick={() => setIsEditDialogOpen(true)}
                onRefresh={fetchProfile}
            />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><div className="lg:col-span-4">
                    <Tabs defaultValue="posts" className="w-full" onValueChange={(val) => {
                        if (val === "posts") fetchMyPosts();
                        if (val === "saved") fetchBookmarks();
                    }}>
                        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
                            <TabsList className="bg-transparent h-auto p-0 gap-6">
                                <TabsTrigger
                                    value="posts"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none"
                                >
                                    <FileText className="w-4 h-4" /> Bài viết ({profile.postCount || 0})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="saved"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none"
                                >
                                    <Bookmark className="w-4 h-4" /> Đã lưu
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="posts" className="space-y-4 focus-visible:ring-0 outline-none">
                            {isMe && (
                                <div className="mb-6">
                                    <CreatePostTrigger onPostCreated={fetchMyPosts} />
                                </div>
                            )}
                            {loadingContent ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : myPosts.length > 0 ? (
                                myPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300">
                                    <LayoutGrid className="w-12 h-12 mb-3 text-gray-300" />
                                    <p>Bạn chưa đăng bài viết nào.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="saved" className="space-y-4 focus-visible:ring-0 outline-none">
                            {loadingContent ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : savedContent.length > 0 ? (
                                savedContent.map((bookmark) => {
                                    if (bookmark.postSummary) {
                                        return <PostCard key={bookmark.id} post={bookmark.postSummary} />;
                                    }
                                    if (bookmark.questionSummary) {
                                        return <QuestionCard key={bookmark.id} question={bookmark.questionSummary as any} />;
                                    }
                                    return null;
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300">
                                    <Bookmark className="w-12 h-12 mb-3 text-gray-300" />
                                    <p>Bạn chưa lưu nội dung nào.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[90vh] max-h-[900px] p-0 overflow-hidden bg-gray-50 dark:bg-zinc-950 border-none flex flex-col">
                    <DialogTitle className="sr-only">Chỉnh sửa hồ sơ</DialogTitle>
                    <ProfileEditForm
                        user={profile}
                        onCancel={() => setIsEditDialogOpen(false)}
                        onSuccess={() => {
                            setIsEditDialogOpen(false);
                            fetchProfile();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}