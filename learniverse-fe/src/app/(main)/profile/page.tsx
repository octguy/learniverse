"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userProfileService } from "@/lib/api/userProfileService";
import { postService } from "@/lib/api/postService";
import { interactionService } from "@/lib/api/interactionService";
import { friendService } from "@/lib/api/friendService";
import { UserProfileResponse } from "@/types/userProfile";
import { PostResponse, BookmarkResponse } from "@/types/post";
import { SuggestedFriend } from "@/types/friend";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import ProfileHeader from "@/components/profile/ProfileHeader";
import {ProfileEditForm} from "@/components/auth/profile-edit-form";
import {PostCard} from "@/components/post/PostCard";
import {Loader2, FileText, Bookmark, LayoutGrid, AlertCircle, Users, UserPlus} from "lucide-react";
import {QuestionCard} from "@/components/question/question-card";
import { CreatePostTrigger } from "@/components/post/CreatePostTrigger";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [myPosts, setMyPosts] = useState<PostResponse[]>([]);
    const [savedContent, setSavedContent] = useState<BookmarkResponse[]>([]);
    const [savedTotalCount, setSavedTotalCount] = useState(0);
    const [loadingContent, setLoadingContent] = useState(false);

    const [friends, setFriends] = useState<SuggestedFriend[]>([]);
    const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);

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

    const fetchFriendsData = async () => {
        try {
            const [friendsRes, suggestionsRes] = await Promise.all([
                friendService.getFriends(),
                friendService.getSuggestedFriends(5)
            ]);
            if (friendsRes.data) setFriends(friendsRes.data);
            if (suggestionsRes.data) setSuggestedFriends(suggestionsRes.data);
        } catch (error) {
            console.error("Lỗi tải bạn bè:", error);
        }
    };

    const fetchMyPosts = async () => {
        const targetUserId = user?.id;

        if (!targetUserId) return;

        setLoadingContent(true);
        try {
            const summaryPage = await postService.getPostsByUser(targetUserId);

            if (!summaryPage || !summaryPage.content) {
                setMyPosts([]);
                return;
            }

            const detailPromises = summaryPage.content.map((summary: any) =>
                postService.getPostById(summary.id)
            );

            const detailResponses = await Promise.all(detailPromises);

            const fullPosts = detailResponses.map((res: any) => {
                return res.data;
            });

            setMyPosts(fullPosts);
        } catch (error) {
            console.error("Lỗi tải bài viết:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchBookmarks = async () => {
        setLoadingContent(true);
        try {
            const data = await interactionService.getMyBookmarks();
            // @ts-ignore
            const bookmarks = data.content || [];
            if (data.totalElements) setSavedTotalCount(data.totalElements);
            
            // Enrich bookmarks with full post details to ensure content/images are available
            const enhancedBookmarks = await Promise.all(bookmarks.map(async (b: any) => {
                if (b.postSummary) {
                    try {
                        const detail = await postService.getPostById(b.postSummary.id);
                        if (detail?.data) {
                            return { ...b, postSummary: detail.data };
                        }
                    } catch (e) {
                        console.error("Failed to load full post details for bookmark", b.postSummary.id);
                    }
                }
                return b;
            }));

            setSavedContent(enhancedBookmarks);
        } catch (error) {
            console.error("Lỗi tải bookmark:", error);
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchFriendsData();
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchMyPosts();
            fetchBookmarks();
        }
    }, [user?.id, profile]);

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;
    if (!profile) return <div className="text-center mt-10">Không tìm thấy thông tin người dùng.</div>;

    const isMe = true;
    return (
        <div className="w-full mx-auto py-6 px-4 md:px-6 space-y-6 pb-20">
            <ProfileHeader
                profile={profile}
                isOwnProfile={true}
                onEditClick={() => setIsEditDialogOpen(true)}
                onRefresh={fetchProfile}
                customPostCount={myPosts.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Friends List */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Bạn bè <span className="text-gray-500 text-sm font-normal">({friends.length})</span>
                        </h3>
                        <Link href="/friend" className="text-sm text-blue-600 hover:underline">Xem tất cả</Link>
                    </div>
                    
                    {friends.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                            {friends.slice(0, 8).map(friend => (
                                <Link href={`/profile/${friend.userId}`} key={friend.userId} className="flex flex-col items-center gap-2 group">
                                    <Avatar className="w-12 h-12 border-2 border-transparent group-hover:border-blue-500 transition-all">
                                        <AvatarImage src={friend.avatarUrl || ""} />
                                        <AvatarFallback>{friend.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-center truncate w-full font-medium group-hover:text-blue-600">
                                        {friend.displayName}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-4">Chưa có bạn bè nào.</p>
                    )}
                </div>

                {/* Suggestions List */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-green-500" />
                            Gợi ý kết bạn
                        </h3>
                    </div>
                    
                    {suggestedFriends.length > 0 ? (
                        <div className="space-y-4">
                            {suggestedFriends.map(friend => (
                                <div key={friend.userId} className="flex items-center justify-between">
                                    <Link href={`/profile/${friend.userId}`} className="flex items-center gap-3 group">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={friend.avatarUrl || ""} />
                                            <AvatarFallback>{friend.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium group-hover:text-blue-600 transition-colors">{friend.displayName}</p>
                                            <p className="text-xs text-gray-500">@{friend.username}</p>
                                        </div>
                                    </Link>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                                        friendService.sendRequest(friend.userId).then(() => {
                                            fetchFriendsData();
                                        });
                                    }}>
                                        Kết bạn
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-4">Không có gợi ý nào.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><div className="lg:col-span-4">
                    <Tabs defaultValue="posts" className="w-full" onValueChange={(val) => {
                        if (val === "posts" && myPosts.length === 0) fetchMyPosts();
                        if (val === "saved" && savedContent.length === 0) fetchBookmarks();
                    }}>
                        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
                            <TabsList className="bg-transparent h-auto p-0 gap-6">
                                <TabsTrigger
                                    value="posts"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none"
                                >
                                    <FileText className="w-4 h-4" /> Bài viết ({myPosts.length || profile.postCount || 0})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="saved"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none"
                                >
                                    <Bookmark className="w-4 h-4" /> Đã lưu ({savedTotalCount || savedContent.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="posts" className="space-y-4 focus-visible:ring-0 outline-none w-full min-h-[500px]">
                            {isMe && (
                                <div className="mb-6">
                                    <CreatePostTrigger onPostCreated={fetchMyPosts} />
                                </div>
                            )}
                            {loadingContent ? (
                                <div className="flex items-center justify-center w-full h-[300px]">
                                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                                </div>
                            ) : myPosts.length > 0 ? (
                                myPosts.map((post) => (
                                    <PostCard 
                                        key={post.id} 
                                        post={post} 
                                        onDelete={(id) => setMyPosts((prev) => prev.filter((p) => p.id !== id))}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300">
                                    <LayoutGrid className="w-12 h-12 mb-3 text-gray-300" />
                                    <p>Bạn chưa đăng bài viết nào.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="saved" className="space-y-4 focus-visible:ring-0 outline-none w-full min-h-[500px]">
                            {loadingContent ? (
                                <div className="flex items-center justify-center w-full h-[300px]">
                                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                                </div>
                            ) : savedContent.length > 0 ? (
                                savedContent.map((bookmark) => {
                                    if (bookmark.postSummary) {
                                        return <PostCard 
                                            key={bookmark.id} 
                                            post={bookmark.postSummary} 
                                            onDelete={(id) => setSavedContent((prev) => prev.filter((b) => b.postSummary?.id !== id))}
                                        />;
                                    }
                                    if (bookmark.questionSummary) {
                                        return <QuestionCard key={bookmark.id} question={bookmark.questionSummary as any} />;
                                    }
                                    
                                    return (
                                        <div key={bookmark.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-500 flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-sm">Nội dung không khả dụng</p>
                                                <p className="text-xs">Nội dung này có thể đã bị xóa hoặc không tồn tại.</p>
                                            </div>
                                        </div>
                                    );
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