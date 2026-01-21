"use client"

import React, { useState, useEffect } from "react"
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Loader2, Check } from "lucide-react"
import { Post } from "@/types/post"
import { SuggestedFriend } from "@/types/friend"
import { friendService } from "@/lib/api/friendService"
import { chatService } from "@/lib/api/chatService"
import { shareService } from "@/lib/api/shareService"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"

interface SendPostDialogProps {
    post: Post
    setOpen: (open: boolean) => void
    onSuccess?: () => void
}

export function SendPostDialog({ post, setOpen, onSuccess }: SendPostDialogProps) {
    const { user } = useAuth()
    const [friends, setFriends] = useState<SuggestedFriend[]>([])
    const [selectedFriends, setSelectedFriends] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const debouncedSearchTerm = useDebounce(searchQuery, 300)

    useEffect(() => {
        const fetchFriends = async () => {
            setIsLoading(true)
            try {
                let response
                if (debouncedSearchTerm) {
                    response = await friendService.searchFriends(debouncedSearchTerm)
                } else {
                    response = await friendService.getFriends()
                }
                const resData = (response.data || response) as any
                let results: any[] = [];
                if (resData.data?.content && Array.isArray(resData.data.content)) {
                    results = resData.data.content;
                }
                else if (Array.isArray(resData.data)) {
                    results = resData.data;
                }
                else if (Array.isArray(resData)) {
                    results = resData;
                }

                const uniqueResults = Array.from(new Map(results.map((item: SuggestedFriend) => [item.id, item])).values())
                setFriends(uniqueResults as SuggestedFriend[])
            } catch (error) {
                console.error("Failed to fetch friends", error)
                toast.error("Không thể tải danh sách bạn bè")
            } finally {
                setIsLoading(false)
            }
        }

        fetchFriends()
    }, [debouncedSearchTerm])

    const toggleFriend = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        )
    }

    const handleSend = async () => {
        if (selectedFriends.length === 0) return
        setIsSending(true)

        try {
            const postLink = `${window.location.origin}/posts/${post.id}`
            const fullMessage = message ? `${postLink}\n\n${message}` : postLink
            let existingChats: any[] = [];
            try {
                const directsRes = await chatService.getDirectChats();
                // @ts-ignore
                const raw = directsRes.data || directsRes;
                if (Array.isArray(raw)) existingChats = raw;
                // @ts-ignore
                else if (Array.isArray(raw?.data)) existingChats = raw.data;
            } catch (err) {
                console.error("Failed to fetch direct chats", err);
            }
            const sendPromises = selectedFriends.map(async (friendId) => {
                const friend = friends.find(f => f.id === friendId)
                const targetUserId = friend?.userId || friendId
                let roomId = existingChats.find((c: any) =>
                    !c.isGroupChat && c.participants.includes(targetUserId)
                )?.id;

                if (!roomId) {
                    try {
                        const chatRes = await chatService.createDirectChat(targetUserId)
                        // @ts-ignore
                        roomId = chatRes.data?.id || chatRes.id
                    } catch (error: any) {
                        console.error("Create chat failed", error);

                    }
                }

                if (roomId) {
                    await chatService.sendMessage(roomId, {
                        textContent: fullMessage,
                    })
                }
            })

            await Promise.all(sendPromises)

            // Track share action
            await shareService.trackShare({
                originalContentId: post.id,
                shareType: "DIRECT_MESSAGE"
            })
            if (onSuccess) {
                onSuccess()
            }

            toast.success(`Đã gửi cho ${selectedFriends.length} người bạn`)
            setOpen(false)
        } catch (error) {
            console.error("Send failed", error)
            toast.error("Gửi thất bại. Vui lòng thử lại.")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-4 py-3 border-b">
                <DialogTitle className="text-center">Gửi cho bạn bè</DialogTitle>
            </DialogHeader>

            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm..."
                        className="pl-9 bg-gray-50 border-none focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-0">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : friends.length > 0 ? (
                    <div className="flex flex-col">
                        {friends.map(friend => (
                            <div
                                key={friend.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => toggleFriend(friend.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={friend.avatarUrl || ""} />
                                            <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {selectedFriends.includes(friend.id) && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-gray-900">{friend.username}</span>
                                        <span className="text-xs text-gray-500">{friend.displayName || friend.username}</span>
                                    </div>
                                </div>
                                <Checkbox
                                    checked={selectedFriends.includes(friend.id)}
                                    onCheckedChange={() => toggleFriend(friend.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Không tìm thấy bạn bè nào
                    </div>
                )}
            </ScrollArea>

            <div className="p-3 border-t bg-gray-50 space-y-3">
                <Textarea
                    placeholder="Viết tin nhắn..."
                    className="min-h-[60px] resize-none bg-white focus-visible:ring-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                    className="w-full"
                    onClick={handleSend}
                    disabled={selectedFriends.length === 0 || isSending}
                >
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Gửi {selectedFriends.length > 0 ? `(${selectedFriends.length})` : ""}
                </Button>
            </div>
        </DialogContent>
    )
}
