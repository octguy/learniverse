"use client"

import {
    useEffect,
    useMemo,
    useState,
    type HTMLAttributes,
    type LiHTMLAttributes,
    type OlHTMLAttributes,
} from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { isAxiosError } from "axios"
import {
    ArrowLeft,
    Bookmark,
    Eye,
    FileText,
    Loader2,
    MessageCircle,
    Share2,
    ThumbsUp,
    Image as ImageIcon,
} from "lucide-react"

import { postService } from "@/lib/api/postService"
import type { Post, PostAttachment } from "@/types/post"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DetailState {
    status: "loading" | "ready" | "error"
    post: Post | null
    error: string | null
}

type HeadingProps = HTMLAttributes<HTMLHeadingElement>
type ParagraphProps = HTMLAttributes<HTMLParagraphElement>
type ListProps = HTMLAttributes<HTMLUListElement>
type OrderedListProps = OlHTMLAttributes<HTMLOListElement>
type ListItemProps = LiHTMLAttributes<HTMLLIElement>
type BlockquoteProps = HTMLAttributes<HTMLQuoteElement>
type CodeProps = HTMLAttributes<HTMLElement> & { inline?: boolean }

type MarkdownComponents = Components

const MarkdownH2 = ({ className, children, ...props }: HeadingProps) => (
    <h2
        className={cn(
            "mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0",
            className
        )}
        {...props}
    >
        {children}
    </h2>
)

const MarkdownH3 = ({ className, children, ...props }: HeadingProps) => (
    <h3 className={cn("mt-4 text-lg font-semibold", className)} {...props}>
        {children}
    </h3>
)

const MarkdownParagraph = ({
    className,
    children,
    ...props
}: ParagraphProps) => (
    <p
        className={cn("mt-3 leading-7 text-muted-foreground", className)}
        {...props}
    >
        {children}
    </p>
)

const MarkdownList = ({ className, children, ...props }: ListProps) => (
    <ul className={cn("mt-3 list-disc space-y-2 pl-6", className)} {...props}>
        {children}
    </ul>
)

const MarkdownOrderedList = ({
    className,
    children,
    ...props
}: OrderedListProps) => (
    <ol
        className={cn("mt-3 list-decimal space-y-2 pl-6", className)}
        {...props}
    >
        {children}
    </ol>
)

const MarkdownListItem = ({ className, children, ...props }: ListItemProps) => (
    <li className={cn("leading-7", className)} {...props}>
        {children}
    </li>
)

const MarkdownBlockquote = ({
    className,
    children,
    ...props
}: BlockquoteProps) => (
    <blockquote
        className={cn(
            "mt-4 border-l-4 border-primary/30 bg-primary/5 px-4 py-2 italic text-muted-foreground",
            className
        )}
        {...props}
    >
        {children}
    </blockquote>
)

const MarkdownCode = ({ inline, className, children, ...props }: CodeProps) => {
    if (inline) {
        return (
            <code
                className={cn(
                    "rounded bg-muted px-1.5 py-0.5 font-mono text-xs",
                    className
                )}
                {...props}
            >
                {children}
            </code>
        )
    }
    return (
        <pre className="mt-4 overflow-x-auto rounded-md bg-muted/50 p-4">
            <code className={cn("font-mono text-sm", className)} {...props}>
                {children}
            </code>
        </pre>
    )
}

const markdownComponents: MarkdownComponents = {
    h2: MarkdownH2,
    h3: MarkdownH3,
    p: MarkdownParagraph,
    ul: MarkdownList,
    ol: MarkdownOrderedList,
    li: MarkdownListItem,
    blockquote: MarkdownBlockquote,
    code: MarkdownCode,
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

function formatMetric(value: number) {
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

function splitAttachments(attachments: PostAttachment[]) {
    const images: PostAttachment[] = []
    const documents: PostAttachment[] = []

    attachments.forEach((attachment) => {
        if (attachment.fileType === "IMAGE") {
            images.push(attachment)
        } else {
            documents.push(attachment)
        }
    })

    return { images, documents }
}

export default function QuestionDetailPage() {
    const params = useParams<{ slug: string }>()
    const router = useRouter()
    const slug = params?.slug

    const [state, setState] = useState<DetailState>({
        status: "loading",
        post: null,
        error: null,
    })

    useEffect(() => {
        if (!slug) return

        let cancelled = false
        const run = async () => {
            setState({ status: "loading", post: null, error: null })
            try {
                const response = await postService.getPostBySlug(slug)
                if (cancelled) return

                const post = response?.data ?? null
                if (!post) {
                    setState({
                        status: "error",
                        post: null,
                        error: "Không tìm thấy câu hỏi này.",
                    })
                    return
                }

                setState({ status: "ready", post, error: null })
            } catch (error) {
                if (cancelled) return
                const message = isAxiosError(error)
                    ? error.response?.data?.message ??
                      "Không thể tải chi tiết câu hỏi lúc này."
                    : "Không thể tải chi tiết câu hỏi lúc này."
                setState({ status: "error", post: null, error: message })
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [slug])

    const publishedLabel = useMemo(() => {
        if (!state.post?.publishedAt) return "Vừa đăng"
        return formatDistanceToNow(new Date(state.post.publishedAt), {
            addSuffix: true,
            locale: vi,
        })
    }, [state.post?.publishedAt])

    const attachments = useMemo(() => {
        if (!state.post?.attachments?.length) {
            return { images: [], documents: [] }
        }
        return splitAttachments(state.post.attachments)
    }, [state.post?.attachments])

    const metrics = useMemo(() => {
        if (!state.post) {
            return []
        }
        return [
            {
                icon: ThumbsUp,
                label: "Tương tác",
                value: formatMetric(state.post.reactionCount ?? 0),
            },
            {
                icon: MessageCircle,
                label: "Trả lời",
                value: formatMetric(state.post.commentCount ?? 0),
            },
            {
                icon: Bookmark,
                label: "Đã lưu",
                value: formatMetric(state.post.bookmarkCount ?? 0),
            },
            {
                icon: Eye,
                label: "Lượt xem",
                value: formatMetric(state.post.viewCount ?? 0),
            },
        ]
    }, [state.post])

    if (state.status === "loading") {
        return (
            <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Đang tải câu hỏi…
                    </Button>
                </div>
                <div className="rounded-xl border p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (state.status === "error") {
        return (
            <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 size-4" /> Quay lại
                </Button>
                <Alert variant="destructive">
                    <AlertTitle>Đã xảy ra lỗi</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-3">
                        <span>{state.error}</span>
                        <Button size="sm" onClick={() => router.refresh()}>
                            Thử lại
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const post = state.post!
    const authorName = post.author?.username ?? "Ẩn danh"
    const statusLabel =
        post.status === "PUBLISHED"
            ? "Đang hiển thị"
            : post.status === "DRAFT"
            ? "Bản nháp"
            : "Đã lưu trữ"

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft className="size-4" />
                    Quay lại
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                        <Share2 className="size-4" /> Chia sẻ
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Bookmark className="size-4" /> Lưu lại
                    </Button>
                </div>
            </div>

            <article className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
                    <div className="space-y-3">
                        <Badge
                            variant="secondary"
                            className="w-fit text-xs uppercase tracking-wide"
                        >
                            {statusLabel}
                        </Badge>
                        <h1 className="text-2xl font-semibold leading-tight text-foreground">
                            {post.title || "Câu hỏi chưa có tiêu đề"}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>Đăng {publishedLabel}</span>
                            <span aria-hidden="true">•</span>
                            <span>
                                Cập nhật lần cuối{" "}
                                {formatDistanceToNow(
                                    new Date(post.updatedAt ?? post.createdAt),
                                    { addSuffix: true, locale: vi }
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm">
                        {metrics.map((metric) => (
                            <div key={metric.label} className="text-center">
                                <metric.icon className="mx-auto mb-1 size-4 text-primary" />
                                <p className="text-sm font-semibold text-foreground">
                                    {metric.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {metric.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-6">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                            <AvatarImage
                                src={post.author?.avatarUrl ?? undefined}
                                alt={authorName}
                            />
                            <AvatarFallback className="bg-[#f97362] text-sm font-semibold uppercase text-white">
                                {getInitials(authorName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                            <p className="font-medium text-foreground">
                                {authorName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Thành viên từ{" "}
                                {formatDistanceToNow(new Date(post.createdAt), {
                                    addSuffix: true,
                                    locale: vi,
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {post.tags?.length ? (
                            post.tags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="rounded-full text-sm font-medium"
                                >
                                    {tag.name}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="outline">Chưa gắn thẻ</Badge>
                        )}
                    </div>

                    <div className="prose prose-sm max-w-none leading-relaxed text-foreground">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {post.body ||
                                "Nội dung chi tiết đang được cập nhật."}
                        </ReactMarkdown>
                    </div>

                    {(attachments.images.length > 0 ||
                        attachments.documents.length > 0) && (
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">
                                Tệp đính kèm
                            </h2>
                            {attachments.images.length > 0 && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {attachments.images.map((file) => (
                                        <figure
                                            key={file.id}
                                            className="overflow-hidden rounded-lg border"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={file.storageUrl}
                                                alt={file.fileName}
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                            <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                                                <ImageIcon className="mr-1 inline size-3" />
                                                {file.fileName}
                                            </figcaption>
                                        </figure>
                                    ))}
                                </div>
                            )}
                            {attachments.documents.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {attachments.documents.map((file) => (
                                        <Link
                                            key={file.id}
                                            href={file.storageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-primary hover:bg-primary/5"
                                        >
                                            <FileText className="size-4" />
                                            {file.fileName}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </article>

            <aside className="rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                    Chia sẻ câu trả lời của bạn
                </p>
                <p className="mt-2">
                    Tận dụng kinh nghiệm của bạn để giúp người khác vượt qua thử
                    thách tương tự.
                </p>
                <Button asChild className="mt-3">
                    <Link href={`/questions/${post.slug}#answer`}>
                        Viết câu trả lời
                    </Link>
                </Button>
            </aside>
        </div>
    )
}
