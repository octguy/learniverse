"use client"

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

const FOLLOW_SUGGESTIONS = [
    {
        id: "marie",
        name: "Marie Clark",
        description: "Người hướng dẫn học tập",
        avatar: "https://randomuser.me/api/portraits/women/90.jpg",
    },
    {
        id: "mark",
        name: "Mark Tini",
        description: "Nhóm học STEM",
        avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    },
    {
        id: "linh",
        name: "Linh Tran",
        description: "Cộng đồng luyện IELTS",
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
]

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
    return (
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">
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
                            {FOLLOW_SUGGESTIONS.map((person) => (
                                <div
                                    key={person.id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage
                                                src={person.avatar}
                                                alt={person.name}
                                            />
                                            <AvatarFallback>
                                                {initialsFromName(person.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="leading-tight">
                                            <p className="text-sm font-medium text-foreground">
                                                {person.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {person.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        + Theo dõi
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-primary"
                            >
                                Xem thêm gợi ý
                            </Button>
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
                                    Tham gia giờ cố vấn mỗi tuần
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Gặp gỡ các cố vấn vào thứ Năm để trao đổi
                                    bài tập và chuẩn bị cho kỳ thi.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    Tìm hiểu thêm
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
