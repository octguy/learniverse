"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { userProfileService } from "@/lib/api/userProfileService";
import { postService } from "@/lib/api/postService";
import { questionService } from "@/lib/api/questionService";
import { friendService } from "@/lib/api/friendService";
import { UserProfileResponse } from "@/types/userProfile";
import { PostResponse, BookmarkResponse } from "@/types/post";
import { QuestionResponse } from "@/types/question";
import { SuggestedFriend } from "@/types/friend";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { PostCard } from "@/components/post/PostCard";
import { QuestionCard } from "@/components/question/question-card";
import { Loader2, FileText, MessageCircleQuestion, Users, Bookmark, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { interactionService } from "@/lib/api/interactionService";

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Data states
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [questions, setQuestions] = useState<QuestionResponse[]>([]);
    const [friends, setFriends] = useState<SuggestedFriend[]>([]);
    const [savedContent, setSavedContent] = useState<BookmarkResponse[]>([]);
    const [postCount, setPostCount] = useState(0);

    const [loadingTab, setLoadingTab] = useState(false);

    const isMe = currentUser?.id === userId;

    const fetchProfile = async () => {
        try {
            const data = await userProfileService.getUserProfile(userId);
            setProfile(data);
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        setLoadingTab(true);
        try {
            // Get summary page
            const summaryPage = await postService.getPostsByUser(userId);

            if (summaryPage && summaryPage.totalElements) {
                setPostCount(summaryPage.totalElements);
            }

            if (!summaryPage || !summaryPage.content) {
                setPosts([]);
                return;
            }

            // Fetch details for each post to satisfy PostResponse type usually required by PostCard
            // Optimization: If PostCard accepts summary, we can skip this. 
            // Assuming we need full details based on previous file viewing:
            const detailPromises = summaryPage.content.map((summary: PostResponse) =>
                postService.getPostById(summary.id)
            );
            const detailResponses = await Promise.all(detailPromises);
            const fullPosts = detailResponses.map((res: any) => res.data);

            setPosts(fullPosts);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoadingTab(false);
        }
    };

    const fetchQuestions = async () => {
        setLoadingTab(true);
        try {
            const res = await questionService.getQuestionsByUserId(userId);
            // @ts-ignore
            setQuestions(res.content || []);
        } catch (error) {
            console.error("Error loading questions:", error);
        } finally {
            setLoadingTab(false);
        }
    };

    const fetchFriends = async () => {
        setLoadingTab(true);
        try {
            const targetId = profile?.user?.id || userId;
            const res = await friendService.getFriendsByUser(targetId);
            // @ts-ignore
            setFriends(res.data.data || []);
        } catch (error) {
            console.error("Error loading friends:", error);
        } finally {
            setLoadingTab(false);
        }
    };

    const fetchBookmarks = async () => {
        if (!isMe) return;
        setLoadingTab(true);
        try {
            const data = await interactionService.getMyBookmarks();
            const bookmarks = data.content || [];

            // Hydrate bookmarks
            const postPromises = bookmarks
                .filter(b => b.postSummary)
                .map(b => postService.getPostById(b.postSummary!.id));

            const postsDetails = await Promise.all(postPromises);

            const enriched = bookmarks.map(b => {
                if (b.postSummary) {
                    const detail = postsDetails.find(res => res.data.id === b.postSummary?.id);
                    if (detail) return { ...b, postSummary: detail.data };
                }
                return b;
            });

            setSavedContent(enriched);
        } catch (error) {
            console.error("Error loading bookmarks:", error);
        } finally {
            setLoadingTab(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchProfile();
            fetchPosts();
        }
    }, [userId]);

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>;
    if (!profile) return <div className="text-center mt-10">Không tìm thấy thông tin người dùng.</div>;

    return (
        <div className="container max-w-5xl mx-auto py-6 px-4 md:px-6 space-y-6">
            <ProfileHeader
                profile={profile}
                isOwnProfile={isMe}
                onRefresh={fetchProfile}
                customPostCount={postCount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-4">
                    <Tabs defaultValue="posts" className="w-full" onValueChange={(val) => {
                        if (val === "posts") fetchPosts();
                        if (val === "questions") fetchQuestions();
                        if (val === "friends") fetchFriends();
                        if (val === "saved") fetchBookmarks();
                    }}>
                        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
                            <TabsList className="bg-transparent h-auto p-0 gap-6 overflow-x-auto flex-nowrap justify-start w-full">
                                <TabsTrigger
                                    value="posts"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none whitespace-nowrap"
                                >
                                    <FileText className="w-4 h-4" /> Bài viết ({postCount || profile.postCount || 0})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="questions"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none whitespace-nowrap"
                                >
                                    <MessageCircleQuestion className="w-4 h-4" /> Câu hỏi ({profile.answeredQuestionCount || 0})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="friends"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none whitespace-nowrap"
                                >
                                    <Users className="w-4 h-4" /> Bạn bè
                                </TabsTrigger>
                                {isMe && (
                                    <TabsTrigger
                                        value="saved"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 bg-transparent px-4 py-3 gap-2 text-base font-medium text-gray-500 hover:text-gray-700 transition-all shadow-none whitespace-nowrap"
                                    >
                                        <Bookmark className="w-4 h-4" /> Đã lưu
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent value="posts" className="space-y-4 focus-visible:ring-0 outline-none">
                            {loadingTab ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : posts.length > 0 ? (
                                posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onDelete={() => { }} // Can't delete other's posts
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300">
                                    <LayoutGrid className="w-12 h-12 mb-3 text-gray-300" />
                                    <p>Người dùng chưa đăng bài viết nào.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="questions" className="space-y-4 focus-visible:ring-0 outline-none">
                            {loadingTab ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : questions.length > 0 ? (
                                questions.map((q) => (
                                    // @ts-ignore - QuestionCard types mismatch potentially
                                    <QuestionCard key={q.id} question={q} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300">
                                    <MessageCircleQuestion className="w-12 h-12 mb-3 text-gray-300" />
                                    <p>Người dùng chưa đặt câu hỏi nào.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="friends" className="space-y-4 focus-visible:ring-0 outline-none">
                            {loadingTab ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : friends.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {friends.map(friend => (
                                        <div key={friend.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12 cursor-pointer" onClick={() => window.location.href = `/profile/${friend.userId}`}>
                                                    <AvatarImage src={friend.avatarUrl || ""} />
                                                    <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-lg cursor-pointer hover:underline" onClick={() => window.location.href = `/profile/${friend.userId}`}>
                                                        {friend.displayName || friend.username}
                                                    </h3>
                                                    {friend.bio && <p className="text-sm text-gray-500 line-clamp-1">{friend.bio}</p>}
                                                </div>
                                            </div>
                                            <Button asChild variant="outline" size="sm">
                                                <a href={`/profile/${friend.userId}`}>Xem</a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-gray-500">Chưa có bạn bè nào.</div>
                            )}
                        </TabsContent>

                        {isMe && (
                            <TabsContent value="saved" className="space-y-4 focus-visible:ring-0 outline-none">
                                {loadingTab ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
                                ) : savedContent.length > 0 ? (
                                    savedContent.map((bookmark) => {
                                        if (bookmark.postSummary) {
                                            return <PostCard
                                                key={bookmark.id}
                                                post={bookmark.postSummary}
                                                onDelete={() => { }}
                                            />;
                                        }
                                        if (bookmark.questionSummary) {
                                            return <QuestionCard key={bookmark.id} question={bookmark.questionSummary as QuestionResponse} />;
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
                        )}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
