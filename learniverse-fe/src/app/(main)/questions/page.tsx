"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { QuestionFeed } from "@/components/question/question-feed"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { friendService } from "@/lib/api/friendService"
import { SuggestedFriend } from "@/types/friend"
import { Loader2 } from "lucide-react"

function initialsFromName(name: string) {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .map((segment) => segment[0]?.toUpperCase())
            .join("")
            .slice(0, 2) || "LV"
    )
}

export default function QuestionsPage() {
    const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
    const [loadingFollowId, setLoadingFollowId] = useState<string | null>(null)

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setIsLoadingSuggestions(true)
                const response = await friendService.getSuggestedFriends(5)
                setSuggestions(response.data?.data ?? [])
            } catch (error) {
                console.error("Failed to fetch friend suggestions:", error)
                setSuggestions([])
            } finally {
                setIsLoadingSuggestions(false)
            }
        }

        fetchSuggestions()
    }, [])

    const handleFollow = async (userId: string) => {
        if (loadingFollowId) return
        setLoadingFollowId(userId)
        try {
            await friendService.sendRequest(userId)
            setFollowingIds((prev) => new Set(prev).add(userId))
        } catch (error) {
            console.error("Failed to send friend request:", error)
        } finally {
            setLoadingFollowId(null)
        }
    }

    return (
        <div className="w-full space-y-8 pb-12 py-6 px-4 md:px-6 lg:px-8 mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Câu hỏi
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Khám phá những thắc mắc của cộng đồng và chia sẻ kiến
                        thức của bạn.
                    </p>
                </div>
                <Button asChild size="sm" className="px-4">
                    <Link href="/questions/ask">Đặt câu hỏi</Link>
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
                <QuestionFeed />

                <aside className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Gợi ý kết nối
                            </CardTitle>
                            <CardDescription>
                                Kết nối với những người học cùng mối quan tâm.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoadingSuggestions ? (
                                // Loading skeleton
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-1.5">
                                                    <Skeleton className="h-3.5 w-24" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    ))}
                                </>
                            ) : suggestions.length > 0 ? (
                                // Display suggestions
                                suggestions.map((person) => (
                                    <div
                                        key={person.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <Link
                                            href={`/profile/${person.userId}`}
                                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                        >
                                            <Avatar>
                                                <AvatarImage
                                                    src={person.avatarUrl ?? undefined}
                                                    alt={person.displayName || person.username}
                                                />
                                                <AvatarFallback>
                                                    {initialsFromName(
                                                        person.displayName || person.username
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="leading-tight">
                                                <p className="text-sm font-medium text-foreground">
                                                    {person.displayName || person.username}
                                                </p>
                                                {person.bio ? (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {person.bio}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        {person.postCount} bài viết • {person.answeredQuestionCount} câu trả lời
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant={followingIds.has(person.userId) ? "secondary" : "outline"}
                                            disabled={loadingFollowId === person.userId || followingIds.has(person.userId)}
                                            onClick={() => handleFollow(person.userId)}
                                        >
                                            {loadingFollowId === person.userId ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : followingIds.has(person.userId) ? (
                                                "Đã gửi"
                                            ) : (
                                                "+ Kết bạn"
                                            )}
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                // No suggestions
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    Không có gợi ý kết nối nào.
                                </p>
                            )}
                            {suggestions.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-primary"
                                    asChild
                                >
                                    <Link href="/friends">
                                        Xem thêm gợi ý
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="h-40 w-full">
                                <img
                                    src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=600&q=80"
                                    alt="Study group"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="space-y-2 p-4">
                                <Badge variant="secondary">
                                    Nổi bật trong cộng đồng
                                </Badge>
                                <p className="text-sm font-medium text-foreground">
                                    Tham gia nhóm học tập cộng đồng
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Trao đổi làm quen với những người có chung khó khăn để học tập
                                    và chuẩn bị cho kỳ thi.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    asChild
                                >
                                    <Link href="/groups">
                                        Tìm hiểu thêm
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
