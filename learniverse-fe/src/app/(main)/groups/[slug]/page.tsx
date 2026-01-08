"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Users,
    Loader2,
    UserPlus,
    LogOut,
    Crown,
    Shield,
    MoreVertical,
    Trash2,
    UserMinus,
    Repeat,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import { groupService } from "@/lib/api/groupService"
import { postService } from "@/lib/api/postService"
import type { Group, GroupMember, GroupMemberRole } from "@/types/group"
import type { Post } from "@/types/post"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { CreatePostTrigger } from "@/components/post/CreatePostTrigger"
import { PostCard } from "@/components/post/PostCard"

export default function GroupDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const isAuthenticated = !!user
    const slug = params.slug as string

    const [group, setGroup] = useState<Group | null>(null)
    const [members, setMembers] = useState<GroupMember[]>([])
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("about")

    // Dialogs
    const [showLeaveDialog, setShowLeaveDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showTransferDialog, setShowTransferDialog] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isTransferring, setIsTransferring] = useState(false)
    const [selectedNewOwner, setSelectedNewOwner] = useState<string>("")

    useEffect(() => {
        if (slug) {
            loadGroup()
        }
    }, [slug])

    useEffect(() => {
        if (group) {
            if (activeTab === "members") {
                loadMembers()
            } else if (activeTab === "feed") {
                loadFeed()
            }
        }
    }, [activeTab, group?.id])

    const loadGroup = async () => {
        setIsLoading(true)
        try {
            const data = await groupService.getBySlug(slug)
            setGroup(data)
        } catch (error) {
            console.error("Failed to load group:", error)
            toast.error("Không thể tải thông tin nhóm")
        } finally {
            setIsLoading(false)
        }
    }

    const loadMembers = async (groupId?: string) => {
        const id = groupId || group?.id
        if (!id) return
        try {
            const response = await groupService.getMembers(id)
            setMembers(response.content || [])
        } catch (error) {
            console.error("Failed to load members:", error)
        }
    }

    const loadFeed = async (groupId?: string) => {
        const id = groupId || group?.id
        if (!id) return
        try {
            const response = await groupService.getFeed(id)
            const summaries = response.content || []
            
            // Fetch full PostResponse for each post to get attachments, shareCount, etc.
            const fullPosts = await Promise.all(
                summaries.map(async (summary: Post) => {
                    try {
                        const fullPost = await postService.getPostById(summary.id)
                        return fullPost.data || summary
                    } catch (e) {
                        console.error("Failed to load full post:", summary.id)
                        return summary
                    }
                })
            )
            setPosts(fullPosts)
        } catch (error) {
            console.error("Failed to load feed:", error)
        }
    }

    const handleJoin = async () => {
        if (!group || !isAuthenticated) return

        try {
            await groupService.join(group.id)
            toast.success(
                group.privacy === "PRIVATE"
                    ? "Đã gửi yêu cầu tham gia!"
                    : "Tham gia nhóm thành công!"
            )
            loadGroup()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể tham gia nhóm")
        }
    }

    const handleLeave = async () => {
        if (!group) return
        setIsLeaving(true)
        try {
            await groupService.leave(group.id)
            toast.success("Đã rời khỏi nhóm")
            router.push("/groups")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể rời nhóm")
        } finally {
            setIsLeaving(false)
            setShowLeaveDialog(false)
        }
    }

    const handleDelete = async () => {
        if (!group) return
        setIsDeleting(true)
        try {
            await groupService.delete(group.id)
            toast.success("Đã xóa nhóm")
            router.push("/groups")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể xóa nhóm")
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const handleTransferOwnership = async () => {
        if (!group || !selectedNewOwner) return
        setIsTransferring(true)
        try {
            await groupService.transferOwnership(group.id, selectedNewOwner)
            toast.success("Đã chuyển quyền sở hữu thành công!")
            setShowTransferDialog(false)
            loadGroup()
            loadMembers()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể chuyển quyền")
        } finally {
            setIsTransferring(false)
        }
    }

    const handleKickMember = async (userId: string) => {
        if (!group) return
        try {
            await groupService.kickMember(group.id, userId)
            toast.success("Đã đuổi thành viên khỏi nhóm")
            setMembers((prev) => prev.filter((m) => m.userId !== userId))
            await loadMembers(group.id)
            loadGroup()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể đuổi thành viên")
        }
    }

    const handleAssignModerator = async (userId: string) => {
        if (!group) return
        try {
            await groupService.assignModerator(group.id, userId)
            toast.success("Đã bổ nhiệm điều hành viên")
            loadMembers()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể bổ nhiệm")
        }
    }

    const handleRemoveModerator = async (userId: string) => {
        if (!group) return
        try {
            await groupService.removeModerator(group.id, userId)
            toast.success("Đã gỡ quyền điều hành viên")
            loadMembers()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể gỡ quyền")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!group) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-semibold">Không tìm thấy nhóm</h2>
                <Button asChild className="mt-4">
                    <Link href="/groups">Quay lại</Link>
                </Button>
            </div>
        )
    }

    const isOwner = group.currentUserRole === "OWNER"
    const isModerator = group.currentUserRole === "MODERATOR"
    const isOwnerOrMod = isOwner || isModerator
    const canViewContent = group.privacy === "PUBLIC" || group.isMember
    const otherMembers = members.filter(m => m.userId !== user?.id && m.role !== "OWNER")

    return (
        <div className="space-y-6 w-full mx-auto px-4 md:px-6 lg:px-8">
            {/* Back button */}
            <Button variant="ghost" size="sm" asChild>
                <Link href="/groups">
                    <ArrowLeft className="mr-2 size-4" />
                    Quay lại
                </Link>
            </Button>

            {/* Group Header */}
            <div className="relative overflow-hidden rounded-xl">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/5">
                    {group.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={group.coverImageUrl}
                            alt="Cover"
                            className="size-full object-cover"
                        />
                    )}
                </div>

                {/* Group Info */}
                <div className="relative p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex items-end gap-4">
                            <Avatar className="-mt-16 size-24 border-4 border-background">
                                <AvatarImage src={group.avatarUrl || undefined} />
                                <AvatarFallback className="text-2xl">
                                    {group.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold">{group.name}</h1>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="size-3" />
                                        {group.memberCount} thành viên
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {group.isMember ? (
                                <>
                                    {isOwner && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                {members.length > 1 && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                                                            <Repeat className="mr-2 size-4" />
                                                            Chuyển quyền sở hữu
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                    </>
                                                )}
                                                {members.length > 1 ? (
                                                    <DropdownMenuItem
                                                        onClick={() => setShowLeaveDialog(true)}
                                                        className="text-orange-600 focus:text-orange-600"
                                                    >
                                                        <LogOut className="mr-2 size-4" />
                                                        Rời nhóm
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => setShowDeleteDialog(true)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Giải tán nhóm
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                    {!isOwner && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowLeaveDialog(true)}
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            Rời nhóm
                                        </Button>
                                    )}
                                </>
                            ) : group.hasPendingRequest ? (
                                <Button variant="secondary" size="sm" disabled>
                                    Đã gửi yêu cầu
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleJoin} disabled={!isAuthenticated}>
                                    <UserPlus className="mr-2 size-4" />
                                    Tham gia
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {group.tags && group.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {group.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="about">Giới thiệu</TabsTrigger>
                    {canViewContent && <TabsTrigger value="feed">Bài viết</TabsTrigger>}
                    <TabsTrigger value="members">Thành viên</TabsTrigger>
                    {isOwnerOrMod && group.privacy === "PRIVATE" && (
                        <TabsTrigger value="requests">Yêu cầu tham gia</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="about" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mô tả nhóm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {group.description ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <ReactMarkdown>{group.description}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Chưa có mô tả</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feed" className="mt-6">
                    {canViewContent ? (
                        <div className="max-w-2xl mx-auto space-y-4">
                            {/* Create Post CTA */}
                            {group.isMember && (
                                <CreatePostTrigger 
                                    onPostCreated={loadFeed}
                                    groupId={group.id}
                                    groupName={group.name}
                                />
                            )}

                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <PostCard 
                                        key={post.id}
                                        post={post} 
                                        onDelete={loadFeed}
                                        showGroupName={false}
                                    />
                                ))
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    Chưa có bài viết nào trong nhóm
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            Tham gia nhóm để xem nội dung
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="members" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {members.map((member) => (
                            <Card key={member.id}>
                                <CardContent className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.avatarUrl || undefined} />
                                            <AvatarFallback>
                                                {member.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {member.displayName || member.username}
                                                </span>
                                                <RoleBadge role={member.role} />
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                @{member.username}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Member actions - only for owner/mod on regular members */}
                                    {isOwnerOrMod && member.userId !== user?.id && member.role !== "OWNER" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {isOwner && member.role === "MEMBER" && (
                                                    <DropdownMenuItem onClick={() => handleAssignModerator(member.userId)}>
                                                        <Shield className="mr-2 size-4" />
                                                        Bổ nhiệm Mod
                                                    </DropdownMenuItem>
                                                )}
                                                {isOwner && member.role === "MODERATOR" && (
                                                    <DropdownMenuItem onClick={() => handleRemoveModerator(member.userId)}>
                                                        <Shield className="mr-2 size-4" />
                                                        Gỡ quyền Mod
                                                    </DropdownMenuItem>
                                                )}
                                                {(isOwner || (isModerator && member.role === "MEMBER")) && (
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleKickMember(member.userId)}
                                                    >
                                                        <UserMinus className="mr-2 size-4" />
                                                        Đuổi khỏi nhóm
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    <JoinRequestsList groupId={group.id} />
                </TabsContent>
            </Tabs>

            {/* Leave Dialog */}
            <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isOwner ? "Bạn là chủ sở hữu nhóm" : "Rời khỏi nhóm?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isOwner && members.length > 1
                                ? "Bạn cần chuyển quyền sở hữu cho thành viên khác trước khi rời nhóm."
                                : isOwner && members.length === 1
                                ? "Bạn là thành viên duy nhất. Rời nhóm sẽ giải tán nhóm."
                                : "Bạn sẽ không thể xem nội dung nhóm nữa sau khi rời đi."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        {isOwner && members.length > 1 ? (
                            <AlertDialogAction onClick={() => {
                                setShowLeaveDialog(false)
                                setShowTransferDialog(true)
                            }}>
                                Chuyển quyền sở hữu
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction 
                                onClick={isOwner ? handleDelete : handleLeave} 
                                disabled={isLeaving || isDeleting}
                                className={isOwner ? "bg-destructive text-white hover:bg-destructive/90" : ""}
                            >
                                {(isLeaving || isDeleting) && <Loader2 className="mr-2 size-4 animate-spin" />}
                                {isOwner ? "Giải tán nhóm" : "Rời nhóm"}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Giải tán nhóm?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Tất cả bài viết và thành viên sẽ bị xóa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Giải tán nhóm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Transfer Ownership Dialog */}
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chuyển quyền sở hữu</DialogTitle>
                        <DialogDescription>
                            Chọn thành viên sẽ trở thành chủ sở hữu mới. Bạn sẽ trở thành điều hành viên.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Chọn thành viên</Label>
                        <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Chọn thành viên..." />
                            </SelectTrigger>
                            <SelectContent>
                                {otherMembers.map((member) => (
                                    <SelectItem key={member.userId} value={member.userId}>
                                        <div className="flex items-center gap-2">
                                            <span>{member.displayName || member.username}</span>
                                            {member.role === "MODERATOR" && (
                                                <Badge variant="secondary" className="text-xs">Mod</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                            Hủy
                        </Button>
                        <Button 
                            onClick={handleTransferOwnership} 
                            disabled={!selectedNewOwner || isTransferring}
                        >
                            {isTransferring && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Xác nhận chuyển quyền
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Role badge component
function RoleBadge({ role }: { role: GroupMemberRole }) {
    if (role === "OWNER") {
        return (
            <Badge variant="default" className="gap-1">
                <Crown className="size-3" />
                Chủ sở hữu
            </Badge>
        )
    }
    if (role === "MODERATOR") {
        return (
            <Badge variant="secondary" className="gap-1">
                <Shield className="size-3" />
                Mod
            </Badge>
        )
    }
    return null
}

// Join requests list component
function JoinRequestsList({ groupId }: { groupId: string }) {
    const [requests, setRequests] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadRequests()
    }, [groupId])

    const loadRequests = async () => {
        setIsLoading(true)
        try {
            const response = await groupService.getPendingRequests(groupId)
            setRequests(response.content || [])
        } catch (error) {
            console.error("Failed to load requests:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = async (requestId: string) => {
        try {
            await groupService.approveRequest(groupId, requestId)
            toast.success("Đã chấp nhận yêu cầu")
            loadRequests()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi")
        }
    }

    const handleReject = async (requestId: string) => {
        try {
            await groupService.rejectRequest(groupId, requestId)
            toast.success("Đã từ chối yêu cầu")
            loadRequests()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi")
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin" />
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                Không có yêu cầu nào đang chờ duyệt
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {requests.map((req) => (
                <Card key={req.id}>
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={req.user?.avatarUrl} />
                                <AvatarFallback>
                                    {req.user?.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <span className="font-medium">
                                    {req.user?.displayName || req.user?.username}
                                </span>
                                <p className="text-sm text-muted-foreground">
                                    @{req.user?.username}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(req.id)}
                            >
                                Từ chối
                            </Button>
                            <Button size="sm" onClick={() => handleApprove(req.id)}>
                                Chấp nhận
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
