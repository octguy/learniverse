"use client"

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type HTMLAttributes,
    type LiHTMLAttributes,
    type OlHTMLAttributes,
} from "react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { isAxiosError } from "axios"
import {
    ArrowLeft,
    Download,
    Edit2,
    Eye,
    FileText,
    Loader2,
    MessageCircle,
    Share2,
    Bookmark,
    ThumbsDown,
    ThumbsUp,
} from "lucide-react"

import { questionService } from "@/lib/api/questionService"
import { answerService } from "@/lib/api/answerService"
import { interactionService } from "../../../../lib/api/interactionService"
import { useAuth } from "@/context/AuthContext"
import type { QuestionAttachment, QuestionDetail } from "@/types/question"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DetailState {
    status: "loading" | "ready" | "error"
    question: QuestionDetail | null
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

const ANSWER_MIN_LENGTH = 10
const ANSWER_MAX_LENGTH = 5000
const ANSWER_EDIT_LIMIT_MINUTES = 60 // UC 3.8: Edit allowed within 1 hour

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
    <p className={cn("mt-3 leading-7 text-foreground", className)} {...props}>
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

function splitAttachments(attachments: QuestionAttachment[]) {
    const images: QuestionAttachment[] = []
    const documents: QuestionAttachment[] = []

    attachments.forEach((attachment) => {
        if (attachment.fileType === "IMAGE") {
            images.push(attachment)
        } else {
            documents.push(attachment)
        }
    })

    return { images, documents }
}

/**
 * Downloads a file from a cross-origin URL with the correct filename.
 * Fetches the file as a blob and triggers a download with the proper name.
 */
async function downloadFile(url: string, fileName: string) {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Cleanup blob URL
        window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
        console.error("Failed to download file:", error)
        // Fallback: open in new tab
        window.open(url, "_blank")
    }
}

export default function QuestionDetailPage() {
    const params = useParams<{ slug: string }>()
    const router = useRouter()
    const { user } = useAuth()
    const slug = params?.slug

    const [state, setState] = useState<DetailState>({
        status: "loading",
        question: null,
        error: null,
    })
    const [answerBody, setAnswerBody] = useState("")
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
    const [answerError, setAnswerError] = useState<string | null>(null)
    const [answerSuccess, setAnswerSuccess] = useState<string | null>(null)
    const [isAnswerFormOpen, setIsAnswerFormOpen] = useState(false)
    const [isVotingQuestion, setIsVotingQuestion] = useState(false)
    const [isBookmarking, setIsBookmarking] = useState(false)
    const [isReacting, setIsReacting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [answerVoteLoading, setAnswerVoteLoading] = useState<
        Record<string, boolean>
    >({})
    const [acceptLoading, setAcceptLoading] = useState<Record<string, boolean>>(
        {}
    )
    const [voteError, setVoteError] = useState<string | null>(null)
    // Edit/Delete answer states
    const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
    const [editAnswerBody, setEditAnswerBody] = useState("")
    const [isUpdatingAnswer, setIsUpdatingAnswer] = useState(false)
    const [isDeletingAnswer, setIsDeletingAnswer] = useState<Record<string, boolean>>({})
    const [showDeleteAnswerDialog, setShowDeleteAnswerDialog] = useState<string | null>(null)

    const answerFormRef = useRef<HTMLDivElement | null>(null)
    const answerTextareaRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        if (!slug) return

        let cancelled = false
        const run = async () => {
            setState({ status: "loading", question: null, error: null })
            try {
                const data = await questionService.getBySlug(slug)
                if (cancelled) return

                if (!data) {
                    setState({
                        status: "error",
                        question: null,
                        error: "Không tìm thấy câu hỏi này.",
                    })
                    return
                }

                const normalized: QuestionDetail = {
                    ...data,
                    attachments: data.attachments ?? [],
                    answers: data.answers ?? [],
                }

                setState({ status: "ready", question: normalized, error: null })
            } catch (error) {
                if (cancelled) return
                const message = isAxiosError(error)
                    ? error.response?.data?.message ??
                      "Không thể tải chi tiết câu hỏi lúc này."
                    : "Không thể tải chi tiết câu hỏi lúc này."
                setState({ status: "error", question: null, error: message })
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [slug])

    const publishedLabel = useMemo(() => {
        if (!state.question?.publishedAt) return "Vừa đăng"
        return formatDistanceToNow(new Date(state.question.publishedAt), {
            addSuffix: true,
            locale: vi,
        })
    }, [state.question?.publishedAt])

    const attachments = useMemo(() => {
        if (!state.question?.attachments?.length) {
            return { images: [], documents: [] }
        }
        return splitAttachments(state.question.attachments)
    }, [state.question?.attachments])

    const metrics = useMemo(() => {
        if (!state.question) {
            return []
        }
        return [
            {
                icon: MessageCircle,
                label: "Trả lời",
                value: formatMetric(state.question.answerCount ?? 0),
                container: "border-emerald-200/60 bg-emerald-50",
                iconWrapper: "bg-emerald-100 text-emerald-600",
                valueClass: "text-emerald-700",
            },
            {
                icon: Eye,
                label: "Lượt xem",
                value: formatMetric(state.question.viewCount ?? 0),
                container: "border-sky-200/60 bg-sky-50",
                iconWrapper: "bg-sky-100 text-sky-600",
                valueClass: "text-sky-700",
            },
        ]
    }, [state.question])

    const answerLength = answerBody.trim().length
    const canSubmitAnswer =
        Boolean(user) &&
        !isSubmittingAnswer &&
        answerLength >= ANSWER_MIN_LENGTH &&
        answerLength <= ANSWER_MAX_LENGTH

    const scrollToAnswerForm = (ensureOpen = false) => {
        if (ensureOpen) {
            setIsAnswerFormOpen(true)
        }

        window.requestAnimationFrame(() => {
            if (!answerFormRef.current) return
            answerFormRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            })
            window.setTimeout(() => {
                answerTextareaRef.current?.focus()
            }, 300)
        })
    }

    const handleOpenAnswerForm = () => {
        if (!user) {
            router.push("/login")
            return
        }
        setAnswerError(null)
        scrollToAnswerForm(true)
    }

    // Helper to check if answer is still editable (within 1 hour)
    const isAnswerEditable = (createdAt: string) => {
        const created = new Date(createdAt)
        const now = new Date()
        const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
        return diffMinutes <= ANSWER_EDIT_LIMIT_MINUTES
    }

    const handleStartEditAnswer = (answer: { id: string; body: string; createdAt: string }) => {
        if (!isAnswerEditable(answer.createdAt)) {
            setVoteError("Bạn chỉ có thể chỉnh sửa câu trả lời trong vòng 1 giờ sau khi đăng.")
            return
        }
        setEditingAnswerId(answer.id)
        setEditAnswerBody(answer.body)
    }

    const handleCancelEditAnswer = () => {
        setEditingAnswerId(null)
        setEditAnswerBody("")
    }

    const handleUpdateAnswer = async (answerId: string) => {
        if (!user || isUpdatingAnswer) return
        if (editAnswerBody.trim().length < ANSWER_MIN_LENGTH) {
            setVoteError(`Câu trả lời phải có ít nhất ${ANSWER_MIN_LENGTH} ký tự.`)
            return
        }

        setIsUpdatingAnswer(true)
        setVoteError(null)
        try {
            const updatedAnswer = await answerService.update(answerId, {
                body: editAnswerBody.trim(),
            })

            setState((prev) => {
                if (!prev.question) return prev
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        answers: prev.question.answers.map((a) =>
                            a.id === answerId ? { ...a, body: updatedAnswer.body, updatedAt: updatedAnswer.updatedAt } : a
                        ),
                    },
                }
            })
            setEditingAnswerId(null)
            setEditAnswerBody("")
        } catch (error) {
            const message = isAxiosError(error)
                ? error.response?.data?.message ?? "Không thể cập nhật câu trả lời."
                : "Không thể cập nhật câu trả lời."
            setVoteError(message)
        } finally {
            setIsUpdatingAnswer(false)
        }
    }

    const handleDeleteAnswer = async (answerId: string) => {
        if (!user) return
        setIsDeletingAnswer((prev) => ({ ...prev, [answerId]: true }))
        try {
            await answerService.remove(answerId)
            setState((prev) => {
                if (!prev.question) return prev
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        answers: prev.question.answers.filter((a) => a.id !== answerId),
                        answerCount: Math.max(0, (prev.question.answerCount ?? 1) - 1),
                    },
                }
            })
            setShowDeleteAnswerDialog(null)
        } catch (error) {
            const message = isAxiosError(error)
                ? error.response?.data?.message ?? "Không thể xóa câu trả lời."
                : "Không thể xóa câu trả lời."
            setVoteError(message)
        } finally {
            setIsDeletingAnswer((prev) => {
                const { [answerId]: _removed, ...rest } = prev
                return rest
            })
        }
    }

    const handleQuestionVote = async (voteType: "UPVOTE" | "DOWNVOTE") => {
        if (!user) {
            router.push("/login")
            return
        }
        if (!state.question || isVotingQuestion) {
            return
        }

        setVoteError(null)
        setIsVotingQuestion(true)

        try {
            const newScore = await interactionService.vote({
                votableType: "CONTENT",
                votableId: state.question.id,
                voteType,
            })

            setState((prev) => {
                if (!prev.question) return prev
                const currentVote = prev.question.currentUserVote
                const toggled = currentVote === voteType

                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        voteScore: newScore,
                        currentUserVote: toggled ? null : voteType,
                    },
                }
            })
        } catch (error) {
            let message =
                "Không thể thực hiện bình chọn ngay lúc này. Vui lòng thử lại sau."
            if (isAxiosError(error)) {
                message = error.response?.data?.message ?? message
            }
            setVoteError(message)
        } finally {
            setIsVotingQuestion(false)
        }
    }

    const handleAnswerVote = async (
        answerId: string,
        voteType: "UPVOTE" | "DOWNVOTE"
    ) => {
        if (!user) {
            router.push("/login")
            return
        }
        if (!state.question) {
            return
        }

        setVoteError(null)
        setAnswerVoteLoading((prev) => ({ ...prev, [answerId]: true }))

        try {
            const newScore = await interactionService.vote({
                votableType: "ANSWER",
                votableId: answerId,
                voteType,
            })

            setState((prev) => {
                if (!prev.question) return prev
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        answers: prev.question.answers.map((answer) => {
                            if (answer.id !== answerId) {
                                return answer
                            }
                            const currentVote = answer.currentUserVote
                            const toggled = currentVote === voteType
                            return {
                                ...answer,
                                voteScore: newScore,
                                currentUserVote: toggled ? null : voteType,
                            }
                        }),
                    },
                }
            })
        } catch (error) {
            let message =
                "Không thể thực hiện bình chọn ngay lúc này. Vui lòng thử lại sau."
            if (isAxiosError(error)) {
                message = error.response?.data?.message ?? message
            }
            setVoteError(message)
        } finally {
            setAnswerVoteLoading((prev) => {
                const { [answerId]: _removed, ...rest } = prev
                return rest
            })
        }
    }

    const handleAnswerSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!state.question) return
        if (!user) {
            setAnswerError("Bạn cần đăng nhập để trả lời câu hỏi.")
            return
        }
        if (!canSubmitAnswer) return

        setIsSubmittingAnswer(true)
        setAnswerError(null)
        setAnswerSuccess(null)

        try {
            const createdAnswer = await answerService.create({
                questionId: state.question.id,
                body: answerBody.trim(),
            })

            setState((prev) => {
                if (!prev.question) return prev
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        answers: [
                            createdAnswer,
                            ...(prev.question.answers ?? []),
                        ],
                        answerCount: (prev.question.answerCount ?? 0) + 1,
                    },
                }
            })
            setAnswerBody("")
            setIsAnswerFormOpen(false)
            setAnswerSuccess("Câu trả lời của bạn đã được đăng.")
            window.setTimeout(() => setAnswerSuccess(null), 4000)
        } catch (error) {
            const message = isAxiosError(error)
                ? error.response?.data?.message ??
                  "Không thể gửi câu trả lời ngay lúc này."
                : "Không thể gửi câu trả lời ngay lúc này."
            setAnswerError(message)
        } finally {
            setIsSubmittingAnswer(false)
        }
    }

    const handleBookmarkToggle = async () => {
        if (!user || !state.question) {
            router.push("/login")
            return
        }
        if (isBookmarking) return

        setIsBookmarking(true)
        const currentlyBookmarked = state.question.bookmarkedByCurrentUser
        try {
            if (currentlyBookmarked) {
                await interactionService.unbookmark(state.question.id)
            } else {
                await interactionService.bookmark(state.question.id)
            }

            setState((prev) => {
                if (!prev.question) return prev
                const nextBookmarked = !currentlyBookmarked
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        bookmarkedByCurrentUser: nextBookmarked,
                        bookmarkCount:
                            (prev.question.bookmarkCount ?? 0) +
                            (nextBookmarked ? 1 : -1),
                    },
                }
            })
        } finally {
            setIsBookmarking(false)
        }
    }

    const handleReactionToggle = async () => {
        if (!user || !state.question) {
            router.push("/login")
            return
        }
        if (isReacting) return

        setIsReacting(true)
        const current = state.question.currentUserReaction
        const nextReaction = current ? null : "LIKE"

        try {
            if (nextReaction) {
                await interactionService.react({
                    reactableType: "CONTENT",
                    reactableId: state.question.id,
                    reactionType: nextReaction,
                })
            } else {
                // Send empty to remove reaction (backend may ignore but keeps UI consistent)
                await interactionService.react({
                    reactableType: "CONTENT",
                    reactableId: state.question.id,
                    reactionType: "LIKE",
                })
            }

            setState((prev) => {
                if (!prev.question) return prev
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        currentUserReaction: nextReaction,
                    },
                }
            })
        } finally {
            setIsReacting(false)
        }
    }

    const handleDeleteQuestion = async () => {
        if (!state.question || !user) {
            router.push("/login")
            return
        }
        if (isDeleting) return

        setIsDeleting(true)
        try {
            await questionService.remove(state.question.id)
            setShowDeleteDialog(false)
            router.push("/questions")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleToggleAccepted = async (
        answerId: string,
        nextState: boolean
    ) => {
        if (!state.question) return
        if (!user) {
            router.push("/login")
            return
        }
        setAcceptLoading((prev) => ({ ...prev, [answerId]: true }))
        try {
            if (nextState) {
                await questionService.acceptAnswer(state.question.id, answerId)
            } else {
                await questionService.unacceptAnswer(
                    state.question.id,
                    answerId
                )
            }

            setState((prev) => {
                if (!prev.question) return prev
                return {
                    ...prev,
                    question: {
                        ...prev.question,
                        acceptedAnswerId: nextState ? answerId : null,
                        isAnswered: nextState,
                        answers: prev.question.answers.map((a) => ({
                            ...a,
                            isAccepted: a.id === answerId ? nextState : false,
                        })),
                    },
                }
            })
        } finally {
            setAcceptLoading((prev) => {
                const { [answerId]: _removed, ...rest } = prev
                return rest
            })
        }
    }

    if (state.status === "loading") {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
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
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
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

    const question = state.question!
    const authorName = question.author?.username ?? "Ẩn danh"
    const isAuthor = user?.id === question.author?.id
    const statusLabel =
        question.status === "PUBLISHED"
            ? "Đang hiển thị"
            : question.status === "DRAFT"
            ? "Bản nháp"
            : "Đã lưu trữ"
    const answers = question.answers ?? []
    const questionVote = question.currentUserVote
    const formattedVoteScore = formatMetric(question.voteScore ?? 0)

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-16">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/questions")}
                    className="gap-2"
                >
                    <ArrowLeft className="size-4" />
                    Quay lại
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-9 w-9 border border-transparent transition-colors",
                            question.bookmarkedByCurrentUser &&
                                "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                        )}
                        disabled={isBookmarking}
                        onClick={handleBookmarkToggle}
                        title={
                            question.bookmarkedByCurrentUser
                                ? "Bỏ lưu câu hỏi"
                                : "Lưu câu hỏi"
                        }
                        aria-pressed={question.bookmarkedByCurrentUser}
                    >
                        <Bookmark
                            className={cn(
                                "size-4",
                                question.bookmarkedByCurrentUser &&
                                    "fill-current"
                            )}
                        />
                    </Button>
                    {isAuthor && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() =>
                                    router.push(
                                        `/questions/${question.slug}/edit`
                                    )
                                }
                            >
                                Chỉnh sửa
                            </Button>
                            <AlertDialog
                                open={showDeleteDialog}
                                onOpenChange={setShowDeleteDialog}
                            >
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1"
                                        disabled={isDeleting}
                                    >
                                        Xóa
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Xóa câu hỏi này?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Hành động này sẽ xóa câu hỏi và các tương tác liên quan. Bạn không thể hoàn tác.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            disabled={isDeleting}
                                        >
                                            Hủy
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteQuestion}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting && (
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                            )}
                                            Xóa câu hỏi
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>

            <article className="rounded-2xl border bg-card p-8 shadow-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="space-y-3">
                            <Badge
                                variant="secondary"
                                className="w-fit text-xs uppercase tracking-wide"
                            >
                                {statusLabel}
                            </Badge>
                            <h1 className="text-2xl font-semibold leading-tight text-foreground">
                                {question.title || "Câu hỏi chưa có tiêu đề"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span>Đăng {publishedLabel}</span>
                                <span aria-hidden="true">•</span>
                                <span>
                                    Cập nhật lần cuối{" "}
                                    {formatDistanceToNow(
                                        new Date(
                                            question.updatedAt ??
                                                question.createdAt
                                        ),
                                        { addSuffix: true, locale: vi }
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div
                                className={cn(
                                    "flex min-h-[90px] min-w-[165px] flex-col items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-center shadow-sm"
                                )}
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Bình chọn
                                </p>
                                <div className="flex w-full items-center justify-between gap-3">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-8 w-8 border border-transparent text-amber-700",
                                            questionVote === "UPVOTE"
                                                ? "bg-amber-500 text-white hover:bg-amber-500"
                                                : "hover:bg-amber-100"
                                        )}
                                        aria-pressed={questionVote === "UPVOTE"}
                                        aria-label="Upvote câu hỏi"
                                        disabled={isVotingQuestion}
                                        onClick={() =>
                                            handleQuestionVote("UPVOTE")
                                        }
                                    >
                                        <ThumbsUp className="size-4" />
                                    </Button>
                                    <span className="text-md font-semibold text-muted-foreground">
                                        {formattedVoteScore}
                                    </span>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-8 w-8 border border-transparent text-slate-600",
                                            questionVote === "DOWNVOTE"
                                                ? "bg-slate-700 text-white hover:bg-slate-700"
                                                : "hover:bg-amber-100"
                                        )}
                                        aria-pressed={
                                            questionVote === "DOWNVOTE"
                                        }
                                        aria-label="Downvote câu hỏi"
                                        disabled={isVotingQuestion}
                                        onClick={() =>
                                            handleQuestionVote("DOWNVOTE")
                                        }
                                    >
                                        <ThumbsDown className="size-4" />
                                    </Button>
                                </div>
                            </div>
                            {metrics.map((metric) => (
                                <div
                                    key={metric.label}
                                    className={cn(
                                        "flex min-w-[110px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-center shadow-sm",
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
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                        <div className="flex flex-wrap gap-2">
                            {question.tags?.length ? (
                                question.tags.map((tag) => (
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
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={
                                        question.author?.avatarUrl ?? undefined
                                    }
                                    alt={authorName}
                                />
                                <AvatarFallback className="bg-[#f97362] text-[11px] font-semibold uppercase leading-none tracking-wide text-white">
                                    {getInitials(authorName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight text-left">
                                <p className="text-xs font-semibold text-foreground">
                                    {authorName}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Thành viên Learniverse
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {voteError ? (
                    <Alert variant="destructive" className="mt-6">
                        <AlertTitle>Không thể bình chọn</AlertTitle>
                        <AlertDescription>{voteError}</AlertDescription>
                    </Alert>
                ) : null}

                <div className="mt-8 space-y-6">
                    {question.body ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {question.body}
                        </ReactMarkdown>
                    ) : question.excerpt ? (
                        <p className="text-sm text-muted-foreground">
                            {question.excerpt}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nội dung chi tiết đang được cập nhật.
                        </p>
                    )}
                </div>

                {question.attachments?.length ? (
                    <div className="mt-8 space-y-4">
                        {attachments.images.length > 0 && (
                            <div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {attachments.images.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="overflow-hidden rounded-lg border"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={attachment.storageUrl}
                                                alt={attachment.fileName}
                                                className="h-52 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {attachments.documents.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-foreground">
                                    Tài liệu đính kèm
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {attachments.documents.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => downloadFile(attachment.storageUrl, attachment.fileName)}
                                        >
                                            <FileText className="size-5 text-primary" />
                                            <span className="text-sm font-medium text-foreground max-w-[200px] truncate">
                                                {attachment.fileName}
                                            </span>
                                            <Download className="size-4 ml-auto text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                <section className="mt-10 space-y-6 border-t pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-foreground">
                            Phản hồi từ cộng đồng
                        </h2>
                        {user ? (
                            !isAnswerFormOpen ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleOpenAnswerForm}
                                >
                                    Trả lời câu hỏi
                                </Button>
                            ) : null
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/login")}
                            >
                                Đăng nhập để trả lời
                            </Button>
                        )}
                    </div>

                    {answerSuccess ? (
                        <Alert>
                            <AlertTitle>Đã đăng</AlertTitle>
                            <AlertDescription>{answerSuccess}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div ref={answerFormRef}>
                        {user ? (
                            isAnswerFormOpen ? (
                                <Card>
                                    <form
                                        onSubmit={handleAnswerSubmit}
                                        className="space-y-0"
                                    >
                                        <CardHeader className="pb-0">
                                            <CardTitle className="text-base">
                                                Viết câu trả lời của bạn
                                            </CardTitle>
                                            <CardDescription>
                                                Chia sẻ giải pháp, dẫn chứng
                                                hoặc kinh nghiệm của bạn.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            <Textarea
                                                ref={answerTextareaRef}
                                                value={answerBody}
                                                onChange={(event) =>
                                                    setAnswerBody(
                                                        event.target.value.slice(
                                                            0,
                                                            ANSWER_MAX_LENGTH
                                                        )
                                                    )
                                                }
                                                placeholder="Trình bày rõ ràng lời giải hoặc hướng dẫn của bạn..."
                                                rows={6}
                                            />
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    Tối thiểu {ANSWER_MIN_LENGTH} ký tự. Hiện tại: {answerLength}
                                                </span>
                                                <span>
                                                    {answerLength}/{ANSWER_MAX_LENGTH}
                                                </span>
                                            </div>

                                            {answerError && (
                                                <p className="text-xs text-destructive">
                                                    {answerError}
                                                </p>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2 pt-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setAnswerBody("")
                                                    setAnswerError(null)
                                                    setIsAnswerFormOpen(false)
                                                }}
                                                disabled={isSubmittingAnswer}
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={!canSubmitAnswer}
                                            >
                                                {isSubmittingAnswer && (
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                )}
                                                Gửi câu trả lời
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            ) : null
                        ) : (
                            <Alert>
                                <AlertTitle>Bạn cần đăng nhập</AlertTitle>
                                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                                    <span>
                                        Hãy đăng nhập để chia sẻ câu trả lời của
                                        bạn.
                                    </span>
                                    <Button
                                        size="sm"
                                        onClick={() => router.push("/login")}
                                    >
                                        Đăng nhập
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {answers.length > 0 ? (
                        <div className="space-y-4">
                            {answers.map((answer) => {
                                const answerAuthor =
                                    answer.author?.username ?? "Ẩn danh"
                                const answeredLabel = answer.createdAt
                                    ? formatDistanceToNow(
                                          new Date(answer.createdAt),
                                          {
                                              addSuffix: true,
                                              locale: vi,
                                          }
                                      )
                                    : "Vừa trả lời"
                                const answerVote = answer.currentUserVote
                                const isAnswerVoting = Boolean(
                                    answerVoteLoading[answer.id]
                                )
                                const formattedAnswerScore = formatMetric(
                                    answer.voteScore ?? 0
                                )
                                const isAccepted =
                                    answer.isAccepted ||
                                    question.acceptedAnswerId === answer.id
                                const isAnswerAuthor = user?.id === answer.author?.id
                                const canEditAnswer = isAnswerAuthor && isAnswerEditable(answer.createdAt)
                                const isEditingThis = editingAnswerId === answer.id

                                return (
                                    <article
                                        key={answer.id}
                                        className={cn(
                                            "rounded-xl border bg-background p-5 shadow-sm",
                                            isAccepted &&
                                                "border-emerald-300 bg-emerald-50"
                                        )}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage
                                                        src={
                                                            answer.author
                                                                ?.avatarUrl ??
                                                            undefined
                                                        }
                                                        alt={answerAuthor}
                                                    />
                                                    <AvatarFallback className="bg-[#f97362] text-[11px] font-semibold uppercase text-white">
                                                        {getInitials(
                                                            answerAuthor
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="leading-tight">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {answerAuthor}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {answeredLabel}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn(
                                                        "h-8 w-8 border border-transparent",
                                                        answerVote === "UPVOTE"
                                                            ? "bg-amber-500 text-white hover:bg-amber-500"
                                                            : "hover:bg-muted"
                                                    )}
                                                    aria-label="Upvote câu trả lời"
                                                    aria-pressed={
                                                        answerVote === "UPVOTE"
                                                    }
                                                    disabled={isAnswerVoting}
                                                    onClick={() =>
                                                        handleAnswerVote(
                                                            answer.id,
                                                            "UPVOTE"
                                                        )
                                                    }
                                                >
                                                    <ThumbsUp className="size-4" />
                                                </Button>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {formattedAnswerScore}
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn(
                                                        "h-8 w-8 border border-transparent",
                                                        answerVote ===
                                                            "DOWNVOTE"
                                                            ? "bg-slate-700 text-white hover:bg-slate-700"
                                                            : "hover:bg-muted"
                                                    )}
                                                    aria-label="Downvote câu trả lời"
                                                    aria-pressed={
                                                        answerVote ===
                                                        "DOWNVOTE"
                                                    }
                                                    disabled={isAnswerVoting}
                                                    onClick={() =>
                                                        handleAnswerVote(
                                                            answer.id,
                                                            "DOWNVOTE"
                                                        )
                                                    }
                                                >
                                                    <ThumbsDown className="size-4" />
                                                </Button>
                                                {isAuthor && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            isAccepted
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                        disabled={Boolean(
                                                            acceptLoading[
                                                                answer.id
                                                            ]
                                                        )}
                                                        onClick={() =>
                                                            handleToggleAccepted(
                                                                answer.id,
                                                                !isAccepted
                                                            )
                                                        }
                                                    >
                                                        {acceptLoading[
                                                            answer.id
                                                        ] && (
                                                            <Loader2 className="mr-2 size-3 animate-spin" />
                                                        )}
                                                        {isAccepted
                                                            ? "Bỏ chấp nhận"
                                                            : "Chấp nhận"}
                                                    </Button>
                                                )}
                                                {/* Edit/Delete buttons for answer author */}
                                                {isAnswerAuthor && !isEditingThis && (
                                                    <>
                                                        {canEditAnswer && (
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={() => handleStartEditAnswer(answer)}
                                                                title="Chỉnh sửa câu trả lời"
                                                            >
                                                                <Edit2 className="size-4" />
                                                            </Button>
                                                        )}
                                                        <AlertDialog
                                                            open={showDeleteAnswerDialog === answer.id}
                                                            onOpenChange={(open) => setShowDeleteAnswerDialog(open ? answer.id : null)}
                                                        >
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    disabled={isDeletingAnswer[answer.id]}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Xóa câu trả lời này?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Hành động này sẽ xóa câu trả lời của bạn. Bạn không thể hoàn tác.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel disabled={isDeletingAnswer[answer.id]}>
                                                                        Hủy
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteAnswer(answer.id)}
                                                                        disabled={isDeletingAnswer[answer.id]}
                                                                    >
                                                                        {isDeletingAnswer[answer.id] && (
                                                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                                                        )}
                                                                        Xóa câu trả lời
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Edit mode or display mode */}
                                        {isEditingThis ? (
                                            <div className="mt-4 space-y-3">
                                                <Textarea
                                                    value={editAnswerBody}
                                                    onChange={(e) => setEditAnswerBody(e.target.value.slice(0, ANSWER_MAX_LENGTH))}
                                                    placeholder="Nhập nội dung câu trả lời..."
                                                    rows={5}
                                                />
                                                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <span>Tối thiểu {ANSWER_MIN_LENGTH} ký tự</span>
                                                    <span>{editAnswerBody.length}/{ANSWER_MAX_LENGTH}</span>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleCancelEditAnswer}
                                                        disabled={isUpdatingAnswer}
                                                    >
                                                        Hủy
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleUpdateAnswer(answer.id)}
                                                        disabled={isUpdatingAnswer || editAnswerBody.trim().length < ANSWER_MIN_LENGTH}
                                                    >
                                                        {isUpdatingAnswer && (
                                                            <Loader2 className="mr-2 size-3 animate-spin" />
                                                        )}
                                                        Lưu thay đổi
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 text-sm leading-relaxed text-foreground">
                                                {answer.body ? (
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={
                                                            markdownComponents
                                                        }
                                                    >
                                                        {answer.body}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <p className="text-muted-foreground">
                                                        Câu trả lời này chưa có nội
                                                        dung hiển thị.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                            Chưa có câu trả lời nào. Hãy là người đầu tiên chia
                            sẻ góc nhìn của bạn.
                        </div>
                    )}
                </section>
            </article>
        </div>
    )
}
