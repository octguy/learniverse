"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post/PostCard"
import { QuestionCard } from "@/components/question/question-card" // Check import path
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { postService } from "@/lib/api/postService"
import { questionService } from "@/lib/api/questionService"
import { friendService } from "@/lib/api/friendService"
import { Post } from "@/types/post"
import { QuestionSummary } from "@/types/question"
import { SuggestedFriend } from "@/types/friend"
import { Loader2 } from "lucide-react"

export default function SearchPage() {
    const searchParams = useSearchParams()
    const query = searchParams.get("query") || ""

    const [activeTab, setActiveTab] = useState("posts")
    const [posts, setPosts] = useState<Post[]>([])
    const [questions, setQuestions] = useState<QuestionSummary[]>([])
    const [friends, setFriends] = useState<SuggestedFriend[]>([])

    const [loadingPosts, setLoadingPosts] = useState(false)
    const [loadingQuestions, setLoadingQuestions] = useState(false)
    const [loadingFriends, setLoadingFriends] = useState(false)

    useEffect(() => {
        if (!query) return

        const fetchPosts = async () => {
            setLoadingPosts(true)
            try {
                const res = await postService.searchPosts(query)
                // @ts-ignore
                setPosts(res.content || res.data?.content || [])
            } catch (error) {
                console.error("Error searching posts:", error)
            } finally {
                setLoadingPosts(false)
            }
        }

        const fetchQuestions = async () => {
            setLoadingQuestions(true)
            try {
                const res = await questionService.list({ query, size: 10 })
                // @ts-ignore
                setQuestions(res.content || res.data?.content || [])
            } catch (error) {
                console.error("Error searching questions:", error)
            } finally {
                setLoadingQuestions(false)
            }
        }

        const fetchFriends = async () => {
            setLoadingFriends(true)
            try {
                const res = await friendService.searchFriends(query)
                // @ts-ignore
                const data = res.data || res
                const results = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                setFriends(results)
            } catch (error) {
                console.error("Error searching friends:", error)
            } finally {
                setLoadingFriends(false)
            }
        }

        fetchPosts()
        fetchQuestions()
        fetchFriends()
    }, [query])

    if (!query) {
        return <div className="p-8 text-center text-gray-500">Vui lòng nhập từ khóa để tìm kiếm.</div>
    }

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            <h1 className="text-2xl font-bold">Kết quả tìm kiếm cho "{query}"</h1>

            <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Bài viết ({posts.length})</TabsTrigger>
                    <TabsTrigger value="questions">Câu hỏi ({questions.length})</TabsTrigger>
                    <TabsTrigger value="friends">Mọi người ({friends.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4 mt-4">
                    {loadingPosts ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} onDelete={() => { }} />
                        ))
                    ) : (
                        <div className="text-center p-8 text-gray-500">Không tìm thấy bài viết nào.</div>
                    )}
                </TabsContent>

                <TabsContent value="questions" className="space-y-4 mt-4">
                    {loadingQuestions ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : questions.length > 0 ? (
                        questions.map(q => (
                            <QuestionCard key={q.id} question={q} />
                        ))
                    ) : (
                        <div className="text-center p-8 text-gray-500">Không tìm thấy câu hỏi nào.</div>
                    )}
                </TabsContent>

                <TabsContent value="friends" className="space-y-4 mt-4">
                    {loadingFriends ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : friends.length > 0 ? (
                        <div className="grid gap-4">
                            {friends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={friend.avatarUrl || ""} />
                                            <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-lg">{friend.username}</h3>
                                            {friend.bio && <p className="text-sm text-gray-500 line-clamp-1">{friend.bio}</p>}
                                        </div>
                                    </div>
                                    <Button asChild variant="outline">
                                        <a href={`/profile/${friend.id}`}>Xem hồ sơ</a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-gray-500">Không tìm thấy người dùng nào.</div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
