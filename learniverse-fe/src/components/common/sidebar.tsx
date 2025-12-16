"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
    Home,
    MessageCircle,
    HelpCircle,
    User,
    Settings,
    Hash,
    LogOut,
    Bookmark
} from "lucide-react"
import { tagService, Tag } from "@/lib/api/tagService"
import { cn } from "@/lib/utils"

export function SideBar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const isAuthLoading = !user
    const [tags, setTags] = useState<Tag[]>([])
    const [isTagsLoading, setIsTagsLoading] = useState(true)

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await tagService.getPopularTags()
                setTags(data)
            } catch (error) {
                console.error("Failed to load tags", error)
            } finally {
                setIsTagsLoading(false)
            }
        }
        fetchTags()
    }, [])

    const navItems = [
        { href: "/home", label: "Bảng tin", icon: Home },
        { href: "/questions", label: "Hỏi đáp", icon: HelpCircle },
        { href: "/chat", label: "Tin nhắn", icon: MessageCircle },
        { href: "/profile", label: "Hồ sơ cá nhân", icon: User },
        { href: "/bookmark", label: "Đã đánh dấu", icon: Bookmark },
        { href: "/settings", label: "Cài đặt", icon: Settings },
    ]

    return (
        <aside className="w-64 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r pr-4 pb-4">

            <div className="py-4">
                {isAuthLoading ? (
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-[60px]" />
                        </div>
                    </div>
                ) : user ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent hover:bg-accent transition-colors border shadow-sm">
                        <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarImage src={user.avatarUrl} alt={user.username} />
                            <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user.username}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center border rounded-lg bg-muted/50">
                        <p className="text-sm mb-2">Bạn chưa đăng nhập</p>
                        <Button size="sm" asChild className="w-full">
                            <Link href="/login">Đăng nhập ngay</Link>
                        </Button>
                    </div>
                )}
            </div>

            <Separator className="my-2" />
            <nav className="flex flex-col gap-1 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 font-normal",
                                    isActive && "font-semibold text-primary"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    )
                })}
                {user && (
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 font-normal text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                    </Button>
                )}
            </nav>

            {/* Spacer để đẩy Tags xuống dưới cùng */}
            <div className="flex-1" />

            <Separator className="my-2" />

            {/* PHẦN 3: DANH SÁCH TAGS (Ở DƯỚI CÙNG) */}
            <div className="py-2">
                <h3 className="flex items-center gap-2 font-semibold mb-3 px-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    Chủ đề nổi bật
                </h3>

                <div className="flex flex-wrap gap-2 px-1">
                    {isTagsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-6 w-16 rounded-full" />
                        ))
                    ) : tags.length > 0 ? (
                        tags.map((tag) => (
                            <Link key={tag.id} href={`/tags/${tag.slug}`}>
                                <Badge variant="outline" className="hover:bg-accent cursor-pointer transition-colors">
                                    # {tag.name}
                                </Badge>
                            </Link>
                        ))
                    ) : (
                        <p className="text-xs text-muted-foreground px-2">Chưa có thẻ nào.</p>
                    )}
                </div>

                <Button variant="link" size="sm" className="px-0 mt-2 text-xs w-full text-muted-foreground" asChild>
                    <Link href="/tags">Xem tất cả Tags</Link>
                </Button>
            </div>

        </aside>
    )
}