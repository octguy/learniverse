"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type {
    AnchorHTMLAttributes,
    HTMLAttributes,
    LiHTMLAttributes,
    OlHTMLAttributes,
    TableHTMLAttributes,
    TdHTMLAttributes,
    ThHTMLAttributes,
} from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import axios, { CanceledError } from "axios"
import {
    Loader2,
    Bold,
    Italic,
    Heading1 as Heading1Icon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Quote,
    Code,
    Globe2,
    Image as ImageIcon,
    FileText,
    Eye,
    MessageSquare,
    ThumbsUp,
    Bookmark,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import apiService from "@/lib/apiService"
import { questionService } from "@/lib/api/questionService"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    TagMultiSelect,
    type TagOption,
} from "@/components/question/tag-multi-select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { QuestionDetail, QuestionSummary } from "@/types/question"

const TITLE_LIMIT = 300
const MIN_TITLE_LENGTH = 10
const MIN_BODY_LENGTH = 10
const MAX_BODY_LENGTH = 10000
const MAX_TAGS = 5

const MAX_IMAGE_SIZE_MB = 5
const MAX_DOCUMENT_SIZE_MB = 15
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024
const MAX_IMAGE_COUNT = 3
const MAX_DOCUMENT_COUNT = 2

type HeadingProps = HTMLAttributes<HTMLHeadingElement>
type ParagraphProps = HTMLAttributes<HTMLParagraphElement>
type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>
type UnorderedListProps = HTMLAttributes<HTMLUListElement>
type OrderedListProps = OlHTMLAttributes<HTMLOListElement>
type ListItemProps = LiHTMLAttributes<HTMLLIElement>
type BlockquoteProps = HTMLAttributes<HTMLQuoteElement>
type CodeProps = HTMLAttributes<HTMLElement> & { inline?: boolean }
type TableProps = TableHTMLAttributes<HTMLTableElement>
type TableHeaderProps = ThHTMLAttributes<HTMLTableCellElement>
type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>

type StatusMessage = {
    type: "success" | "error"
    message: string
}

type PreviewFile = {
    name: string
    url: string
}

type MarkdownComponents = Components

interface ApiResponse<T> {
    data?: T
    message?: string
}

type FormMode = "create" | "edit"

interface QuestionFormProps {
    mode?: FormMode
    initialQuestion?: QuestionDetail | null
    onSuccess?: (slug: string) => void
}

const MarkdownH1 = ({ className, children, ...props }: HeadingProps) => (
    <h1 className={cn("mt-2 text-xl font-semibold", className)} {...props}>
        {children}
    </h1>
)

const MarkdownH2 = ({ className, children, ...props }: HeadingProps) => (
    <h2 className={cn("mt-2 text-lg font-semibold", className)} {...props}>
        {children}
    </h2>
)

const MarkdownH3 = ({ className, children, ...props }: HeadingProps) => (
    <h3 className={cn("mt-2 text-base font-semibold", className)} {...props}>
        {children}
    </h3>
)

const MarkdownParagraph = ({
    className,
    children,
    ...props
}: ParagraphProps) => (
    <p className={cn("mt-2 text-sm leading-6", className)} {...props}>
        {children}
    </p>
)

const MarkdownAnchor = ({ className, children, ...props }: AnchorProps) => (
    <a
        className={cn("text-primary underline underline-offset-2", className)}
        {...props}
    >
        {children}
    </a>
)

const MarkdownUnorderedList = ({
    className,
    children,
    ...props
}: UnorderedListProps) => (
    <ul className={cn("mt-2 list-disc space-y-1 pl-5", className)} {...props}>
        {children}
    </ul>
)

const MarkdownOrderedList = ({
    className,
    children,
    ...props
}: OrderedListProps) => (
    <ol
        className={cn("mt-2 list-decimal space-y-1 pl-5", className)}
        {...props}
    >
        {children}
    </ol>
)

const MarkdownListItem = ({ className, children, ...props }: ListItemProps) => (
    <li className={cn("leading-6", className)} {...props}>
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
            "mt-2 border-l-2 border-border pl-3 italic text-muted-foreground",
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
                    "rounded bg-muted px-1 py-0.5 font-mono text-xs",
                    className
                )}
                {...props}
            >
                {children}
            </code>
        )
    }
    return (
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted/60 p-3">
            <code className={cn("font-mono text-sm", className)} {...props}>
                {children}
            </code>
        </pre>
    )
}

const MarkdownTable = ({ className, children, ...props }: TableProps) => (
    <div className="mt-2 overflow-x-auto">
        <table
            className={cn("min-w-full border-collapse text-sm", className)}
            {...props}
        >
            {children}
        </table>
    </div>
)

const MarkdownTh = ({ className, children, ...props }: TableHeaderProps) => (
    <th
        className={cn(
            "border-b border-border px-3 py-2 text-left font-medium",
            className
        )}
        {...props}
    >
        {children}
    </th>
)

const MarkdownTd = ({ className, children, ...props }: TableCellProps) => (
    <td
        className={cn("border-b border-border px-3 py-2", className)}
        {...props}
    >
        {children}
    </td>
)

const markdownComponents: MarkdownComponents = {
    h1: MarkdownH1,
    h2: MarkdownH2,
    h3: MarkdownH3,
    p: MarkdownParagraph,
    a: MarkdownAnchor,
    ul: MarkdownUnorderedList,
    ol: MarkdownOrderedList,
    li: MarkdownListItem,
    blockquote: MarkdownBlockquote,
    code: MarkdownCode,
    table: MarkdownTable,
    th: MarkdownTh,
    td: MarkdownTd,
}

function createPreviewExcerpt(source: string, maxLength = 220) {
    const plain = source
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/[>#*_~`]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

    if (!plain) return ""
    if (plain.length <= maxLength) return plain
    return `${plain.slice(0, maxLength - 1)}…`
}

export function QuestionForm({
    mode = "create",
    initialQuestion = null,
    onSuccess,
}: QuestionFormProps = {}) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const imageInputRef = useRef<HTMLInputElement | null>(null)
    const documentInputRef = useRef<HTMLInputElement | null>(null)
    const { user } = useAuth()
    const router = useRouter()

    const displayName = user?.username ?? "Hồ sơ của bạn"
    const avatarFallback =
        displayName
            .split(" ")
            .filter(Boolean)
            .map((segment) => segment[0]?.toUpperCase())
            .join("")
            .slice(0, 2) || "LV"

    const [title, setTitle] = useState(initialQuestion?.title ?? "")
    const [body, setBody] = useState(initialQuestion?.body ?? "")
    const [tags, setTags] = useState<TagOption[]>([])
    const [selectedTags, setSelectedTags] = useState<TagOption[]>(
        initialQuestion?.tags?.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            description: t.description ?? undefined,
        })) ?? []
    )
    const [isLoadingTags, setIsLoadingTags] = useState(false)
    const [tagError, setTagError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
        null
    )
    const [activeTab, setActiveTab] = useState<"write" | "preview">("write")
    const [images, setImages] = useState<File[]>([])
    const [documents, setDocuments] = useState<File[]>([])
    const [attachmentError, setAttachmentError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true
        const controller = new AbortController()

        const fetchTags = async () => {
            try {
                setIsLoadingTags(true)
                setTagError(null)
                const response = await apiService.get<ApiResponse<TagOption[]>>(
                    "/tags/all",
                    {
                        signal: controller.signal,
                    }
                )
                if (!isMounted) return
                const payload = response.data?.data ?? []
                setTags(payload)
            } catch (error) {
                if (error instanceof CanceledError) {
                    return
                }
                if (!isMounted) return
                if (axios.isAxiosError(error)) {
                    const message =
                        (error.response?.data as ApiResponse<unknown>)
                            ?.message ??
                        "Không thể tải danh sách thẻ ngay lúc này."
                    setTagError(message)
                } else {
                    setTagError("Không thể tải danh sách thẻ ngay lúc này.")
                }
            } finally {
                if (isMounted) {
                    setIsLoadingTags(false)
                }
            }
        }

        fetchTags()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [])

    useEffect(() => {
        if (!initialQuestion) return
        setTitle(initialQuestion.title ?? "")
        setBody(initialQuestion.body ?? "")
        setSelectedTags(
            initialQuestion.tags?.map((t) => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                description: t.description ?? undefined,
            })) ?? []
        )
    }, [initialQuestion])

    const trimmedTitle = useMemo(() => title.trim(), [title])
    const titleLength = trimmedTitle.length
    const bodyLength = useMemo(() => body.trim().length, [body])
    const canSubmit =
        !isSubmitting &&
        titleLength >= MIN_TITLE_LENGTH &&
        bodyLength >= MIN_BODY_LENGTH &&
        bodyLength <= MAX_BODY_LENGTH &&
        selectedTags.length > 0

    const submitLabel = mode === "edit" ? "Cập nhật câu hỏi" : "Đăng câu hỏi"

    const previewQuestion = useMemo<QuestionSummary>(
        () => ({
            id: "preview-question",
            author: {
                id: user?.id ?? "preview-author",
                username: displayName,
                avatarUrl: undefined,
            },
            contentType: "QUESTION",
            title: trimmedTitle || "Câu hỏi chưa có tiêu đề",
            slug: "xem-truoc",
            excerpt: createPreviewExcerpt(body),
            commentCount: 0,
            bookmarkCount: 0,
            voteScore: 0,
            answerCount: 0,
            viewCount: 0,
            publishedAt: new Date().toISOString(),
            tags: selectedTags.map((tag) => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                description: tag.description ?? undefined,
            })),
        }),
        [body, displayName, selectedTags, trimmedTitle, user?.id]
    )

    const previewPublished = useMemo(
        () =>
            new Date(previewQuestion.publishedAt).toLocaleString("vi-VN", {
                hour12: false,
            }),
        [previewQuestion.publishedAt]
    )

    const previewMetrics = useMemo(
        () => [
            {
                icon: MessageSquare,
                label: "Trả lời",
                value: previewQuestion.answerCount,
                container: "border-emerald-200/60 bg-emerald-50",
                iconWrapper: "bg-emerald-100 text-emerald-600",
                valueClass: "text-emerald-700",
            },
            {
                icon: Eye,
                label: "Lượt xem",
                value: previewQuestion.viewCount,
                container: "border-sky-200/60 bg-sky-50",
                iconWrapper: "bg-sky-100 text-sky-600",
                valueClass: "text-sky-700",
            },
            {
                icon: ThumbsUp,
                label: "Đánh giá",
                value: previewQuestion.voteScore,
                container: "border-amber-200/60 bg-amber-50",
                iconWrapper: "bg-amber-100 text-amber-600",
                valueClass: "text-amber-700",
            },
            {
                icon: Bookmark,
                label: "Lưu trữ",
                value: previewQuestion.bookmarkCount,
                container: "border-purple-200/60 bg-purple-50",
                iconWrapper: "bg-purple-100 text-purple-600",
                valueClass: "text-purple-700",
            },
        ],
        [
            previewQuestion.answerCount,
            previewQuestion.bookmarkCount,
            previewQuestion.viewCount,
            previewQuestion.voteScore,
        ]
    )

    const imagePreviews = useMemo<PreviewFile[]>(
        () =>
            images.map((file) => ({
                name: file.name,
                url: URL.createObjectURL(file),
            })),
        [images]
    )

    const documentPreviews = useMemo<PreviewFile[]>(
        () =>
            documents.map((file) => ({
                name: file.name,
                url: URL.createObjectURL(file),
            })),
        [documents]
    )

    useEffect(() => {
        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        }
    }, [imagePreviews])

    useEffect(() => {
        return () => {
            documentPreviews.forEach((preview) =>
                URL.revokeObjectURL(preview.url)
            )
        }
    }, [documentPreviews])

    const applyWrapFormatting = (
        before: string,
        after: string,
        placeholder: string
    ) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const { selectionStart, selectionEnd, value } = textarea
        const selectedText = value.slice(selectionStart, selectionEnd)
        const textToInsert = selectedText || placeholder
        const nextValue = `${value.slice(
            0,
            selectionStart
        )}${before}${textToInsert}${after}${value.slice(selectionEnd)}`

        setBody(nextValue)

        requestAnimationFrame(() => {
            const node = textareaRef.current
            if (!node) return
            const start = selectionStart + before.length
            const end = start + textToInsert.length
            node.focus()
            node.setSelectionRange(start, end)
        })
    }

    const applyLineFormatting = (
        formatter: (line: string, index: number) => string,
        placeholder: string
    ) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const { selectionStart, selectionEnd, value } = textarea
        const selectedText =
            value.slice(selectionStart, selectionEnd) || placeholder
        const lines = selectedText.split("\n")
        const formatted = lines
            .map((line, index) => formatter(line.trim() || placeholder, index))
            .join("\n")
        const nextValue = `${value.slice(
            0,
            selectionStart
        )}${formatted}${value.slice(selectionEnd)}`

        setBody(nextValue)

        requestAnimationFrame(() => {
            const node = textareaRef.current
            if (!node) return
            const start = selectionStart
            const end = start + formatted.length
            node.focus()
            node.setSelectionRange(start, end)
        })
    }

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        type: "image" | "document"
    ) => {
        setAttachmentError(null)
        const file = event.target.files?.[0]
        if (!file) return

        if (type === "image") {
            if (images.length >= MAX_IMAGE_COUNT) {
                setAttachmentError(
                    `Bạn chỉ có thể đính kèm tối đa ${MAX_IMAGE_COUNT} ảnh.`
                )
                event.target.value = ""
                return
            }
            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                setAttachmentError(
                    `Ảnh vượt quá ${MAX_IMAGE_SIZE_MB}MB. Vui lòng chọn ảnh nhẹ hơn.`
                )
                event.target.value = ""
                return
            }
            if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
                setAttachmentError("Chỉ hỗ trợ ảnh PNG hoặc JPG.")
                event.target.value = ""
                return
            }
            setImages((prev) => [...prev, file])
        }

        if (type === "document") {
            if (documents.length >= MAX_DOCUMENT_COUNT) {
                setAttachmentError(
                    `Bạn chỉ có thể đính kèm tối đa ${MAX_DOCUMENT_COUNT} tài liệu.`
                )
                event.target.value = ""
                return
            }
            if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
                setAttachmentError(
                    `Tài liệu vượt quá ${MAX_DOCUMENT_SIZE_MB}MB. Vui lòng chọn file nhẹ hơn.`
                )
                event.target.value = ""
                return
            }
            if (file.type !== "application/pdf") {
                setAttachmentError("Hiện chỉ hỗ trợ tài liệu định dạng PDF.")
                event.target.value = ""
                return
            }
            setDocuments((prev) => [...prev, file])
        }

        event.target.value = ""
    }

    const removeAttachment = (type: "image" | "document", index: number) => {
        setAttachmentError(null)
        if (type === "image") {
            setImages((prev) => prev.filter((_, idx) => idx !== index))
        } else {
            setDocuments((prev) => prev.filter((_, idx) => idx !== index))
        }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!canSubmit) return

        setIsSubmitting(true)
        setStatusMessage(null)

        try {
            const payload = {
                title: trimmedTitle,
                body: body.trim(),
                tagIds: selectedTags.map((tag) => tag.id),
            }

            if (mode === "edit" && initialQuestion?.id) {
                const updated = await questionService.update(
                    initialQuestion.id,
                    payload
                )
                const slug = updated?.slug ?? initialQuestion.slug
                if (slug) {
                    if (onSuccess) onSuccess(slug)
                    else router.push(`/questions/${slug}`)
                }
                return
            }

            const createdQuestion = await questionService.create(payload)
            const slug = createdQuestion?.slug ?? null
            setTitle("")
            setBody("")
            setSelectedTags([])
            setImages([])
            setDocuments([])
            setAttachmentError(null)

            if (slug) {
                if (onSuccess) onSuccess(slug)
                else router.push(`/questions/${slug}`)
                return
            }

            router.push("/questions")
        } catch (error) {
            let message =
                "Không thể đăng câu hỏi ngay lúc này. Vui lòng thử lại sau."
            if (axios.isAxiosError(error)) {
                const response = error.response?.data as ApiResponse<unknown>
                message = response?.message ?? message
            }
            setStatusMessage({ type: "error", message })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReset = () => {
        setTitle("")
        setBody("")
        setSelectedTags([])
        setStatusMessage(null)
        setImages([])
        setDocuments([])
        setAttachmentError(null)
    }

    const renderAttachmentBadges = () => (
        <div className="flex flex-wrap gap-2">
            {images.map((file, index) => (
                <Badge
                    key={`img-${file.name}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-700"
                >
                    <ImageIcon className="size-3" />
                    <span className="text-xs font-medium">{file.name}</span>
                    <button
                        type="button"
                        aria-label={`Xóa ảnh ${file.name}`}
                        onClick={() => removeAttachment("image", index)}
                        className="ml-1 text-xs text-emerald-700 hover:text-emerald-900"
                    >
                        ×
                    </button>
                </Badge>
            ))}
            {documents.map((file, index) => (
                <Badge
                    key={`doc-${file.name}-${index}`}
                    variant="secondary"
                    className="flex items-center gap-2 bg-violet-50 text-violet-700"
                >
                    <FileText className="size-3" />
                    <span className="text-xs font-medium">{file.name}</span>
                    <button
                        type="button"
                        aria-label={`Xóa tài liệu ${file.name}`}
                        onClick={() => removeAttachment("document", index)}
                        className="ml-1 text-xs text-violet-700 hover:text-violet-900"
                    >
                        ×
                    </button>
                </Badge>
            ))}
            {images.length === 0 && documents.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    Chưa có tệp nào được đính kèm.
                </p>
            )}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(event) => handleFileChange(event, "image")}
            />
            <input
                ref={documentInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => handleFileChange(event, "document")}
            />

            <Tabs
                value={activeTab}
                onValueChange={(value) =>
                    setActiveTab(value as "write" | "preview")
                }
                className="space-y-4"
            >
                <TabsList>
                    <TabsTrigger value="write">Soạn thảo</TabsTrigger>
                    <TabsTrigger value="preview">Xem trước</TabsTrigger>
                </TabsList>

                <TabsContent value="write">
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-11 w-11">
                                        <AvatarFallback className="bg-[#f97362] text-sm font-semibold uppercase leading-none tracking-wide text-white">
                                            {avatarFallback}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Hãy mô tả vấn đề mà bạn muốn cộng
                                            đồng Learniverse hỗ trợ.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 text-sm"
                                    disabled
                                >
                                    <Globe2 className="size-4" />
                                    Chia sẻ tới mọi người
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="question-title"
                                        className="text-sm font-medium"
                                    >
                                        Tiêu đề
                                    </label>
                                    <span
                                        className={cn(
                                            "text-xs",
                                            titleLength > 0 &&
                                                titleLength < MIN_TITLE_LENGTH
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {titleLength}/{TITLE_LIMIT}
                                    </span>
                                </div>
                                <Input
                                    id="question-title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value.slice(
                                                0,
                                                TITLE_LIMIT
                                            )
                                        )
                                    }
                                    placeholder="Tóm tắt câu hỏi của bạn trong một câu"
                                    maxLength={TITLE_LIMIT}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Hãy ngắn gọn, mô tả đúng trọng tâm vấn đề
                                    bạn đang gặp phải.
                                </p>
                                {titleLength > 0 &&
                                titleLength < MIN_TITLE_LENGTH ? (
                                    <p className="text-xs text-destructive">
                                        Tiêu đề cần tối thiểu {MIN_TITLE_LENGTH}{" "}
                                        ký tự.
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="question-body"
                                        className="text-sm font-medium"
                                    >
                                        Nội dung chi tiết
                                    </label>
                                    <span
                                        className={cn(
                                            "text-xs",
                                            bodyLength < MIN_BODY_LENGTH
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {bodyLength}/{MAX_BODY_LENGTH}
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-lg border bg-white">
                                    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-3 py-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyWrapFormatting(
                                                    "**",
                                                    "**",
                                                    "in đậm"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                In đậm
                                            </span>
                                            <Bold className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyWrapFormatting(
                                                    "*",
                                                    "*",
                                                    "in nghiêng"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                In nghiêng
                                            </span>
                                            <Italic className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyLineFormatting(
                                                    (line) =>
                                                        `# ${line.replace(
                                                            /^#+\s+/,
                                                            ""
                                                        )}`,
                                                    "Tiêu đề"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                Tiêu đề
                                            </span>
                                            <Heading1Icon className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyLineFormatting(
                                                    (line) =>
                                                        `- ${line.replace(
                                                            /^[-*]\s+/,
                                                            ""
                                                        )}`,
                                                    "Mục danh sách"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                Danh sách
                                            </span>
                                            <List className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyLineFormatting(
                                                    (line, index) =>
                                                        `${
                                                            index + 1
                                                        }. ${line.replace(
                                                            /^\d+\.\s+/,
                                                            ""
                                                        )}`,
                                                    "Mục danh sách"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                Danh sách số
                                            </span>
                                            <ListOrdered className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyWrapFormatting(
                                                    "[",
                                                    "](url)",
                                                    "liên kết"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                Liên kết
                                            </span>
                                            <LinkIcon className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyLineFormatting(
                                                    (line) =>
                                                        `> ${line.replace(
                                                            /^>\s?/,
                                                            ""
                                                        )}`,
                                                    "Trích dẫn"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                Trích dẫn
                                            </span>
                                            <Quote className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                applyWrapFormatting(
                                                    "`",
                                                    "`",
                                                    "đoạn mã"
                                                )
                                            }
                                        >
                                            <span className="sr-only">
                                                Đoạn mã
                                            </span>
                                            <Code className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                imageInputRef.current?.click()
                                            }
                                        >
                                            <span className="sr-only">
                                                Thêm ảnh
                                            </span>
                                            <ImageIcon className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                documentInputRef.current?.click()
                                            }
                                        >
                                            <span className="sr-only">
                                                Thêm tài liệu
                                            </span>
                                            <FileText className="size-4" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        id="question-body"
                                        ref={textareaRef}
                                        value={body}
                                        onChange={(event) =>
                                            setBody(
                                                event.target.value.slice(
                                                    0,
                                                    MAX_BODY_LENGTH
                                                )
                                            )
                                        }
                                        placeholder="Trình bày vấn đề bạn gặp phải, các bước đã thử và điều bạn kỳ vọng."
                                        rows={14}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Tệp đính kèm (tùy chọn)
                                    </p>
                                    {renderAttachmentBadges()}
                                    <p className="text-xs text-muted-foreground">
                                        Hỗ trợ ảnh PNG/JPG (≤{" "}
                                        {MAX_IMAGE_SIZE_MB}MB) và tài liệu PDF
                                        (≤ {MAX_DOCUMENT_SIZE_MB}MB).
                                    </p>
                                    {attachmentError && (
                                        <p className="text-xs text-destructive">
                                            {attachmentError}
                                        </p>
                                    )}
                                </div>

                                {bodyLength < MIN_BODY_LENGTH && (
                                    <p className="text-xs text-destructive">
                                        Vui lòng bổ sung chi tiết để mọi người
                                        hiểu rõ ngữ cảnh (tối thiểu{" "}
                                        {MIN_BODY_LENGTH} ký tự).
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Thẻ
                                </Label>
                                <TagMultiSelect
                                    options={tags}
                                    value={selectedTags}
                                    onChange={setSelectedTags}
                                    isLoading={isLoadingTags}
                                    error={tagError}
                                    maxSelections={MAX_TAGS}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Thêm thẻ để mô tả chủ đề hoặc lĩnh vực liên
                                    quan. Bạn có thể chọn tối đa {MAX_TAGS} thẻ.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={!canSubmit}>
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    {submitLabel}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveTab("preview")}
                                    disabled={!canSubmit}
                                >
                                    Xem trước
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleReset}
                                    disabled={isSubmitting}
                                >
                                    Làm mới
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="preview">
                    <Card>
                        <CardContent className="space-y-5 pt-6">
                            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                                <div className="border-b px-5 py-4">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                                            Xem trước
                                        </span>
                                        <span>
                                            Hiển thị tương tự trang chi tiết
                                        </span>
                                    </div>
                                    <h2 className="mt-3 text-xl font-semibold text-foreground">
                                        {previewQuestion.title}
                                    </h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-[#f97362] text-[10px] font-semibold uppercase leading-none tracking-wide text-white">
                                                    {avatarFallback}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">
                                                {
                                                    previewQuestion.author
                                                        .username
                                                }
                                            </span>
                                        </div>
                                        <span
                                            className="h-1 w-1 rounded-full bg-border"
                                            aria-hidden
                                        />
                                        <span>{previewPublished}</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {previewQuestion.tags.length > 0 ? (
                                            previewQuestion.tags.map((tag) => (
                                                <Badge
                                                    key={tag.id}
                                                    variant="secondary"
                                                    className="rounded-full bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20"
                                                >
                                                    {tag.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Thẻ sẽ xuất hiện ở đây.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3 border-b bg-muted/40 px-5 py-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {previewMetrics.map((metric) => (
                                        <div
                                            key={metric.label}
                                            className={cn(
                                                "flex min-w-[120px] flex-col items-center gap-1 rounded-lg border px-3 py-2 text-center shadow-sm",
                                                metric.container
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex size-7 items-center justify-center rounded-full",
                                                    metric.iconWrapper
                                                )}
                                            >
                                                <metric.icon className="size-3.5" />
                                            </div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {metric.label}
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    metric.valueClass
                                                )}
                                            >
                                                {metric.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-5 py-4 text-sm leading-6">
                                    {body.trim() ? (
                                        <div className="space-y-4 pb-4">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={markdownComponents}
                                            >
                                                {body}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground pb-2">
                                            Nội dung chi tiết sẽ hiển thị tại
                                            đây khi bạn hoàn thành phần mô tả.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {(imagePreviews.length > 0 ||
                                documentPreviews.length > 0) && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-foreground">
                                        Tệp đính kèm
                                    </p>
                                    {imagePreviews.length > 0 && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {imagePreviews.map(
                                                (preview, index) => (
                                                    <div
                                                        key={`preview-image-${preview.name}-${index}`}
                                                        className="overflow-hidden rounded-lg border"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={preview.url}
                                                            alt={`Ảnh đính kèm ${
                                                                index + 1
                                                            }`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                    {documentPreviews.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            {documentPreviews.map(
                                                (preview, index) => (
                                                    <a
                                                        key={`preview-doc-${preview.name}-${index}`}
                                                        href={preview.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-primary hover:bg-accent"
                                                    >
                                                        <FileText className="size-4" />
                                                        {preview.name}
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={!canSubmit}>
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    {submitLabel}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveTab("write")}
                                    disabled={isSubmitting}
                                >
                                    Quay lại chỉnh sửa
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            {statusMessage && (
                <Alert
                    variant={
                        statusMessage.type === "error"
                            ? "destructive"
                            : "default"
                    }
                >
                    <AlertTitle>
                        {statusMessage.type === "error"
                            ? "Có lỗi xảy ra"
                            : "Thành công"}
                    </AlertTitle>
                    <AlertDescription>{statusMessage.message}</AlertDescription>
                </Alert>
            )}
        </form>
    )
}
