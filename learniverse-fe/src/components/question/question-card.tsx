"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { QuestionSummary } from "@/types/question"

interface QuestionCardProps {
    question: QuestionSummary
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

export function QuestionCard({ question }: QuestionCardProps) {
    const voteScore = question.voteScore ?? 0
    const userVoteState = question.currentUserVote
    const voteActive =
        userVoteState !== undefined ? Boolean(userVoteState) : voteScore > 0
    const answerCount = question.answerCount ?? 0
    const viewCount = question.viewCount ?? 0
    const authorName = question.author?.username ?? "Ẩn danh"
    const publishedAt = question.publishedAt
        ? new Date(question.publishedAt)
        : null
    const publishedLabel = publishedAt
        ? formatDistanceToNow(publishedAt, { addSuffix: true, locale: vi })
        : "Vừa xong"
    const excerpt =
        question.excerpt?.trim() || "Nội dung mô tả đang được cập nhật."
    const tags = question.tags ?? []

    return (
        <article className="flex gap-5 rounded-lg border bg-card px-5 py-4 shadow-sm">
            <div className="flex w-28 shrink-0 flex-col gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Metric
                    value={voteScore}
                    label="Bình chọn"
                    variant="vote"
                    active={voteActive}
                />
                <Metric
                    value={answerCount}
                    label="Trả lời"
                    variant="answer"
                    active={answerCount > 0}
                />
                <Metric
                    value={viewCount}
                    label="Lượt xem"
                    variant="view"
                    active={viewCount > 0}
                />
            </div>

            <div className="flex-1 space-y-3">
                <Link
                    href={`/questions/${question.slug}`}
                    className="text-lg font-semibold leading-snug text-primary hover:underline"
                >
                    {question.title || "Câu hỏi chưa có tiêu đề"}
                </Link>

                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {excerpt}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {tags.length > 0 ? (
                            tags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="rounded-full bg-secondary text-secondary-foreground"
                                >
                                    {tag.name}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="outline">Chưa gắn thẻ</Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-7 w-7">
                            <AvatarImage
                                src={question.author?.avatarUrl ?? undefined}
                                alt={authorName}
                            />
                            <AvatarFallback className="bg-[#f97362] text-[11px] font-semibold uppercase text-white">
                                {getInitials(authorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight text-left">
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
    variant?: "vote" | "answer" | "view"
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
        vote: active
            ? {
                  container: "border-amber-500 bg-amber-500 text-white",
                  value: "text-white",
                  label: "text-white/90",
              }
            : {
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
        view: active
            ? {
                  container: "border-sky-400 bg-sky-500 text-white",
                  value: "text-white",
                  label: "text-white/90",
              }
            : {
                  container: "border-sky-200 bg-sky-50",
                  value: "text-sky-700",
                  label: "text-sky-600",
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
