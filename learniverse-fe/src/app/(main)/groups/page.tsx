"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Search, Users, Loader2, Image, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { groupService } from "@/lib/api/groupService"
import { tagService } from "@/lib/api/tagService"
import type { GroupSummary, CreateGroupRequest } from "@/types/group"
import type { Tag } from "@/types/post"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

export default function GroupsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const isAuthenticated = !!user

    const [activeTab, setActiveTab] = useState<"discover" | "my">("discover")
    const [groups, setGroups] = useState<GroupSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    
    // Pagination state
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 12

    // Create group dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [tags, setTags] = useState<Tag[]>([])
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [newGroup, setNewGroup] = useState<CreateGroupRequest>({
        name: "",
        description: "",
        privacy: "PUBLIC",
        tagIds: [],
    })

    useEffect(() => {
        // Reset pagination when tab changes
        setPage(0)
        setGroups([])
        setHasMore(true)
        loadGroups(0, false)
    }, [activeTab, isAuthenticated])

    useEffect(() => {
        loadTags()
    }, [])

    const loadGroups = async (pageNum: number = 0, append: boolean = false) => {
        if (append) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
        }
        try {
            let response
            if (activeTab === "my" && isAuthenticated) {
                response = await groupService.getMyGroups({ page: pageNum, size: PAGE_SIZE })
            } else {
                response = await groupService.getPublicGroups({ query: searchQuery, page: pageNum, size: PAGE_SIZE })
            }
            
            const newGroups = response.content || []
            setHasMore(!response.last)
            
            if (append) {
                setGroups(prev => [...prev, ...newGroups])
            } else {
                setGroups(newGroups)
            }
        } catch (error) {
            console.error("Failed to load groups:", error)
            toast.error("Không thể tải danh sách nhóm")
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            loadGroups(nextPage, true)
        }
    }

    const loadTags = async () => {
        try {
            const response = await tagService.getAllTags()
            setTags(response.content || [])
        } catch (error) {
            console.error("Failed to load tags:", error)
        }
    }

    const handleSearch = () => {
        setPage(0)
        setGroups([])
        setHasMore(true)
        loadGroups(0, false)
    }

    const handleCreateGroup = async () => {
        if (!newGroup.name.trim()) {
            toast.error("Vui lòng nhập tên nhóm")
            return
        }

        setIsCreating(true)
        try {
            const created = await groupService.create(newGroup, avatarFile, coverFile)
            toast.success("Tạo nhóm thành công!")
            setIsCreateOpen(false)
            // Reset form
            setNewGroup({ name: "", description: "", privacy: "PUBLIC", tagIds: [] })
            setAvatarFile(null)
            setCoverFile(null)
            setAvatarPreview(null)
            setCoverPreview(null)
            router.push(`/groups/${created.slug}`)
        } catch (error: any) {
            console.error("Failed to create group:", error)
            toast.error(error.response?.data?.message || "Không thể tạo nhóm")
        } finally {
            setIsCreating(false)
        }
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh")
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ảnh quá lớn (tối đa 5MB)")
                return
            }
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Vui lòng chọn file ảnh")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Ảnh quá lớn (tối đa 10MB)")
                return
            }
            setCoverFile(file)
            setCoverPreview(URL.createObjectURL(file))
        }
    }

    const handleJoinGroup = async (groupId: string) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để tham gia nhóm")
            return
        }

        try {
            await groupService.join(groupId)
            toast.success("Tham gia nhóm thành công!")
            loadGroups()
        } catch (error: any) {
            console.error("Failed to join group:", error)
            toast.error(error.response?.data?.message || "Không thể tham gia nhóm")
        }
    }

    return (
        <div className="w-full mx-auto py-6 px-4 md:px-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Nhóm học tập</h1>
                    <p className="text-sm text-muted-foreground">
                        Tham gia các nhóm để thảo luận và chia sẻ kiến thức
                    </p>
                </div>

                {isAuthenticated && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-1.5 size-4" />
                                Tạo nhóm
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Tạo nhóm mới</DialogTitle>
                                <DialogDescription>
                                    Tạo một nhóm học tập để thảo luận với bạn bè
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Tên nhóm *</Label>
                                    <Input
                                        id="name"
                                        placeholder="VD: Giải tích 1 - K23"
                                        value={newGroup.name}
                                        onChange={(e) =>
                                            setNewGroup({ ...newGroup, name: e.target.value })
                                        }
                                        maxLength={100}
                                    />
                                </div>

                                {/* Avatar & Cover Upload */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Ảnh đại diện</Label>
                                        <div className="relative">
                                            {avatarPreview ? (
                                                <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Avatar preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="destructive"
                                                        className="absolute top-1 right-1 size-6"
                                                        onClick={() => {
                                                            setAvatarFile(null)
                                                            setAvatarPreview(null)
                                                        }}
                                                    >
                                                        <X className="size-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                                    <Image className="size-8 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground mt-1">Chọn ảnh</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Ảnh bìa</Label>
                                        <div className="relative">
                                            {coverPreview ? (
                                                <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Cover preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="destructive"
                                                        className="absolute top-1 right-1 size-6"
                                                        onClick={() => {
                                                            setCoverFile(null)
                                                            setCoverPreview(null)
                                                        }}
                                                    >
                                                        <X className="size-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                                    <Image className="size-8 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground mt-1">Chọn ảnh</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleCoverChange}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Mô tả về nhóm..."
                                        value={newGroup.description}
                                        onChange={(e) =>
                                            setNewGroup({ ...newGroup, description: e.target.value })
                                        }
                                        maxLength={500}
                                        rows={3}
                                    />
                                </div>

                                {/* Tags selection */}
                                <div className="grid gap-2">
                                    <Label>Thẻ môn học (1-3 thẻ)</Label>
                                    <div className="flex flex-wrap gap-2 rounded-md border p-3">
                                        {tags.length > 0 ? (
                                            tags.map((tag) => {
                                                const isSelected = newGroup.tagIds?.includes(tag.id)
                                                return (
                                                    <Badge
                                                        key={tag.id}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setNewGroup({
                                                                    ...newGroup,
                                                                    tagIds: newGroup.tagIds?.filter(id => id !== tag.id)
                                                                })
                                                            } else if ((newGroup.tagIds?.length || 0) < 3) {
                                                                setNewGroup({
                                                                    ...newGroup,
                                                                    tagIds: [...(newGroup.tagIds || []), tag.id]
                                                                })
                                                            }
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                )
                                            })
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                Đang tải thẻ...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button onClick={handleCreateGroup} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
                                    Tạo nhóm
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm nhóm..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <Button onClick={handleSearch}>Tìm kiếm</Button>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "discover" | "my")}
            >
                <TabsList>
                    <TabsTrigger value="discover">Khám phá</TabsTrigger>
                    {isAuthenticated && (
                        <TabsTrigger value="my">Nhóm của tôi</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="discover" className="mt-4">
                    <GroupList
                        groups={groups}
                        isLoading={isLoading}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        onJoin={handleJoinGroup}
                        isAuthenticated={isAuthenticated}
                    />
                </TabsContent>

                <TabsContent value="my" className="mt-4">
                    <GroupList
                        groups={groups}
                        isLoading={isLoading}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        onJoin={handleJoinGroup}
                        isAuthenticated={isAuthenticated}
                        showMyGroups
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Group list component
function GroupList({
    groups,
    isLoading,
    isLoadingMore = false,
    hasMore = false,
    onLoadMore,
    onJoin,
    isAuthenticated,
    showMyGroups = false,
}: {
    groups: GroupSummary[]
    isLoading: boolean
    isLoadingMore?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    onJoin: (groupId: string) => void
    isAuthenticated: boolean
    showMyGroups?: boolean
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                    {showMyGroups ? "Bạn chưa tham gia nhóm nào" : "Không tìm thấy nhóm nào"}
                </h3>
                <p className="text-muted-foreground">
                    {showMyGroups
                        ? "Hãy khám phá và tham gia các nhóm học tập"
                        : "Thử tìm kiếm với từ khóa khác"}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groups.map((group) => (
                    <Card key={group.id} className="overflow-hidden transition-shadow hover:shadow-md bg-transparent border">
                        <CardContent className="py-0 px-4 flex h-full flex-col gap-2">
                            <div className="flex items-start gap-3">
                                <Avatar className="size-12">
                                    <AvatarImage src={group.avatarUrl || undefined} />
                                    <AvatarFallback>
                                        {group.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <Link href={`/groups/${group.slug}`}>
                                        <CardTitle className="line-clamp-1 text-lg hover:text-primary">
                                            {group.name}
                                        </CardTitle>
                                    </Link>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="size-3" />
                                        <span>{group.memberCount} thành viên</span>
                                    </div>
                                </div>
                            </div>

                            {group.description && (
                                <CardDescription className="line-clamp-2">
                                    {group.description}
                                </CardDescription>
                            )}

                            {group.tags && group.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {group.tags.map((tag) => (
                                        <Badge key={tag.id} variant="secondary" className="text-xs">
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="mt-auto">
                                {group.isMember ? (
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={`/groups/${group.slug}`}>
                                            Đã tham gia
                                        </Link>
                                    </Button>
                                ) : group.hasPendingRequest ? (
                                    <Button variant="outline" className="w-full" disabled>
                                        Đã gửi yêu cầu
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => onJoin(group.id)}
                                        disabled={!isAuthenticated}
                                    >
                                        Tham gia
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && onLoadMore && (
                <div className="flex justify-center pt-4">
                    <Button 
                        variant="outline" 
                        onClick={onLoadMore} 
                        disabled={isLoadingMore}
                        className="min-w-[200px]"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Đang tải...
                            </>
                        ) : (
                            "Xem thêm"
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
