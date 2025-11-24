import { QuestionForm } from "@/components/question/question-form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, ListChecks, ShieldAlert } from "lucide-react"

const tips = [
    {
        icon: Lightbulb,
        title: "Chia sẻ bối cảnh",
        description:
            "Hãy giải thích bạn đang làm gì, kết quả mong muốn và hành vi thực tế đang gặp phải.",
    },
    {
        icon: ListChecks,
        title: "Cho biết bạn đã thử gì",
        description:
            "Liệt kê những nghiên cứu, bước thực hành hoặc thử nghiệm bạn đã thực hiện để mọi người có thể hỗ trợ thêm.",
    },
    {
        icon: ShieldAlert,
        title: "Bảo vệ dữ liệu nhạy cảm",
        description:
            "Loại bỏ thông tin cá nhân, thông tin đăng nhập hoặc dữ liệu riêng tư trước khi đăng câu hỏi.",
    },
]

export default function AskQuestionPage() {
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Đặt câu hỏi công khai
                </h1>
                <p className="text-sm text-muted-foreground">
                    Hãy mô tả rõ ràng vấn đề của bạn để cộng đồng có thể hiểu,
                    tái hiện và hỗ trợ giải quyết nhanh chóng.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <QuestionForm />

                <aside className="flex flex-col gap-4">
                    <Card className="gap-2 py-4">
                        <CardHeader className="pb-0">
                            <CardTitle>Gợi ý viết câu hỏi</CardTitle>
                            <CardDescription>
                                Ghi nhớ các lưu ý này để câu hỏi rõ ràng và dễ hiểu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                            {tips.map((tip) => (
                                <div
                                    key={tip.title}
                                    className="flex items-start gap-3"
                                >
                                    <tip.icon className="mt-1 size-5 text-primary" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {tip.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {tip.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-4">
                        <CardHeader className="pb-0">
                            <CardTitle>Tiêu chuẩn cộng đồng</CardTitle>
                            <CardDescription>
                                Giữ cho Learniverse thân thiện và an toàn với mọi người.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
                            <p>
                                Hãy giao tiếp tôn trọng, tập trung vào vấn đề và trích nguồn khi sử dụng tài liệu bên ngoài.
                            </p>
                            <p>
                                Câu hỏi yêu cầu dữ liệu cá nhân hoặc vi phạm chính sách sử dụng có thể bị kiểm duyệt.
                            </p>
                            <Badge variant="secondary" className="font-normal">
                                Gặp khó khăn? Liên hệ ban quản trị qua trung tâm trợ giúp.
                            </Badge>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
