"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"

import { questionService } from "@/lib/api/questionService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { QuestionForm } from "@/components/question/question-form"
import type { QuestionDetail } from "@/types/question"

export default function EditQuestionPage() {
    const params = useParams<{ slug: string }>()
    const router = useRouter()
    const slug = params?.slug

    const [question, setQuestion] = useState<QuestionDetail | null>(null)
    const [status, setStatus] = useState<"loading" | "ready" | "error">(
        "loading"
    )
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            if (!slug) return
            setStatus("loading")
            setError(null)
            try {
                const detail = await questionService.getBySlug(slug)
                if (cancelled) return
                setQuestion(detail)
                setStatus("ready")
            } catch (err) {
                if (cancelled) return
                setError("Không thể tải câu hỏi để chỉnh sửa.")
                setStatus("error")
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [slug])

    if (status === "loading") {
        return (
            <div className="mx-auto w-full max-w-5xl space-y-4 pb-12">
                <Button variant="ghost" size="sm" disabled className="gap-2">
                    <Loader2 className="size-4 animate-spin" /> Đang tải dữ
                    liệu…
                </Button>
                <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                        Đang chuẩn bị biểu mẫu chỉnh sửa…
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (status === "error" || !question) {
        return (
            <div className="mx-auto w-full max-w-5xl space-y-4 pb-12">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => router.push("/questions")}
                >
                    <ArrowLeft className="size-4" /> Quay lại danh sách
                </Button>
                <Alert variant="destructive">
                    <AlertTitle>Không thể tải câu hỏi</AlertTitle>
                    <AlertDescription>
                        {error ?? "Đã xảy ra lỗi."}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => router.push(`/questions/${question.slug}`)}
                >
                    <ArrowLeft className="size-4" /> Quay lại chi tiết
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chỉnh sửa câu hỏi</CardTitle>
                    <CardDescription>
                        Cập nhật tiêu đề, nội dung, thẻ và tệp đính kèm cho câu hỏi của bạn.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <QuestionForm
                        mode="edit"
                        initialQuestion={question}
                        onSuccess={(nextSlug) =>
                            router.push(`/questions/${nextSlug}`)
                        }
                    />
                </CardContent>
            </Card>
        </div>
    )
}
