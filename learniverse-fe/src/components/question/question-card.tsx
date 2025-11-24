"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { PostSummary } from "@/types/api"
import { cn } from "@/lib/utils"

interface QuestionCardProps {
    post: PostSummary
}

function getInitials(name: string) {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .map((segment) => segment[0]?.toUpperCase())
            .join("")
            .slice(0, 2) || "LV"
    )
}

function formatCount(value: number) {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000)
            .toFixed(value % 1_000_000 === 0 ? 0 : 1)
            .replace(/\.0$/, "")}m`
    }
    if (value >= 1_000) {
        return `${(value / 1_000)
            .toFixed(value % 1_000 === 0 ? 0 : 1)
            .replace(/\.0$/, "")}k`
    }
    return `${value}`
}

export function QuestionCard({ post }: QuestionCardProps) {
    const voteScore = post.voteScore ?? 0
    const answerCount = post.commentCount ?? 0
    const saveCount = post.bookmarkCount ?? 0
    const authorName = post.author?.username ?? "Ẩn danh"
    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null
    const publishedLabel = publishedAt
        ? formatDistanceToNow(publishedAt, { addSuffix: true, locale: vi })
        : "Vừa xong"

    const excerpt =
        post.bodyExcerpt?.trim() || "Nội dung mô tả đang được cập nhật."
    const tags = post.tags ?? []

    return (
        <article className="flex gap-5 border-b border-border/60 pb-6 last:border-b-0">
            <div className="flex w-28 shrink-0 flex-col gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Metric value={voteScore} label="Bình chọn" variant="vote" />
                <Metric
                    value={answerCount}
                    label="Trả lời"
                    variant="answer"
                    active={answerCount > 0}
                />
                <Metric
                    value={saveCount}
                    label="Đã lưu"
                    variant="save"
                    active={saveCount > 0}
                />
            </div>

            <div className="flex-1 space-y-3">
                <Link
                    href={`/questions/${post.slug}`}
                    className="text-lg font-semibold leading-snug text-primary hover:underline"
                >
                    {post.title || "Câu hỏi chưa có tiêu đề"}
                </Link>

                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="rounded-full bg-secondary text-secondary-foreground"
                            >
                                {tag.name}
                            </Badge>
                        ))}
                        {tags.length === 0 && (
                            <Badge variant="outline">Chưa gắn thẻ</Badge>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-xs">
                        <Avatar className="h-7 w-7">
                            <AvatarImage
                                src={post.author?.avatarUrl ?? undefined}
                                alt={authorName}
                            />
                            <AvatarFallback className="bg-[#f97362] text-[11px] font-semibold uppercase text-white">
                                {getInitials(authorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                            <p className="font-medium text-foreground">
                                {authorName}
                            </p>
                            <p className="text-muted-foreground">
                                {publishedLabel}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

interface MetricProps {
    value: number
    label: string
    variant?: "vote" | "answer" | "save"
    active?: boolean
}

function Metric({
    value,
    label,
    variant = "vote",
    active = false,
}: MetricProps) {
    const base = "rounded-md border px-3 py-1"

    const palette = {
        vote: {
            container: "border-amber-300 bg-amber-50",
            value: "text-amber-700",
            label: "text-amber-600",
        },
        answer: active
            ? {
                  container: "border-emerald-500 bg-emerald-500 text-white",
                  value: "text-white",
                  label: "text-white/90",
              }
            : {
                  container: "border-emerald-200 bg-emerald-50",
                  value: "text-emerald-700",
                  label: "text-emerald-600",
              },
        save: active
            ? {
                  container: "border-violet-500 bg-violet-500 text-white",
                  value: "text-white",
                  label: "text-white/90",
              }
            : {
                  container: "border-violet-200 bg-violet-50",
                  value: "text-violet-700",
                  label: "text-violet-600",
              },
    } as const

    const colors = palette[variant]
    const sharedTextClass = "text-[11px] font-semibold"

    return (
        <div
            className={cn(
                base,
                colors.container,
                "flex items-center justify-end gap-1 text-right"
            )}
        >
            <span className={cn(sharedTextClass, colors.value)}>
                {formatCount(value)}
            </span>
            <span className={cn(sharedTextClass, "uppercase", colors.label)}>
                {label}
            </span>
        </div>
    )
}
