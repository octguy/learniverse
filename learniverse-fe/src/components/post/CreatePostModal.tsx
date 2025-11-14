"use client"

import React, { useState, useRef } from "react"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card" // <-- Import Card
import {
    X,
    Image as ImageIcon,
    FileText,
    Loader2,
    Bold,
    Italic,
    Code,
    Link2,
    List,
    ListOrdered,
} from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"

const mockUser = {
    id: "user_mock_id",
    username: "Huy Lê",
    avatarUrl: "https://github.com/shadcn.png",
}

const MAX_IMAGE_SIZE_MB = 5
const MAX_PDF_SIZE_MB = 15
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

export default function CreatePostModalContent({
    setOpen,
}: {
    setOpen: (open: boolean) => void
}) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [images, setImages] = useState<File[]>([])
    const [pdfs, setPdfs] = useState<File[]>([])
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("edit")

    const imageInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault()
            if (tags.length < 5 && !tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()])
            }
            setTagInput("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove))
    }

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "image" | "pdf"
    ) => {
        setError("") 
        const file = e.target.files?.[0]
        if (!file) return
        if (type === "image") {
            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                setError(
                    `Kích thước ảnh vượt quá ${MAX_IMAGE_SIZE_MB}MB. Vui lòng chọn file nhỏ hơn.`
                )
                return
            }
            if (!["image/png", "image/jpeg"].includes(file.type)) {
                setError("Chỉ cho phép file ảnh PNG hoặc JPEG.")
                return
            }
            setImages([file]) 
        }
        if (type === "pdf") {
            if (file.size > MAX_PDF_SIZE_BYTES) {
                setError(
                    `Kích thước PDF vượt quá ${MAX_PDF_SIZE_MB}MB. Vui lòng chọn file nhỏ hơn.`
                )
                return
            }
            if (file.type !== "application/pdf") {
                setError("Chỉ cho phép file PDF.")
                return
            }
            setPdfs([file]) 
        }
        e.target.value = ""
    }

    const handleSubmit = async () => {
        setError("")
        if (!title.trim()) {
            setError("Tiêu đề (Title) không được để trống.")
            return
        }
        if (!content.trim()) {
            setError("Nội dung (Detail) không được để trống.")
            return
        }
        if (tags.length === 0) {
            setError("Bạn phải thêm ít nhất một tag cho bài viết.")
            return
        }

        setIsLoading(true)
        console.log("Đang gửi bài đăng:", { title, content, tags, images, pdfs })

        await new Promise((resolve) => setTimeout(resolve, 1500))

        setIsLoading(false)
        setOpen(false)
        setTitle("")
        setContent("")
        setTags([])
        setImages([])
        setPdfs([])
    }

    const removeFile = (type: "image" | "pdf", indexToRemove: number) => {
        if (type === "image") {
            setImages(images.filter((_, index) => index !== indexToRemove));
        }
        if (type === "pdf") {
            setPdfs(pdfs.filter((_, index) => index !== indexToRemove));
        }
    };


    return (
        <DialogContent className="max-w-3xl p-0">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-center text-xl font-bold">
                    Tạo bài đăng mới
                </DialogTitle>
            </DialogHeader>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="hidden">
                    <TabsTrigger value="edit">Soạn thảo</TabsTrigger>
                    <TabsTrigger value="preview">Xem trước</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="p-6 pt-0 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={mockUser.avatarUrl} />
                            <AvatarFallback>{mockUser.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{mockUser.username}</span>
                            <Select defaultValue="anyone">
                                <SelectTrigger className="h-7 px-2 py-1 text-xs w-fit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="anyone">Mọi người</SelectItem>
                                    <SelectItem value="connections">Bạn bè</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="post-title" className="font-semibold">
                            Title
                        </Label>
                        <Input
                            id="post-title"
                            placeholder="Summarize your post's topic."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="post-content" className="font-semibold">
                            Detail
                        </Label>
                        <div className="border rounded-md">
                            <div className="flex items-center gap-1 p-1 border-b bg-gray-50 rounded-t-md">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Bold className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Italic className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Code className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Link2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><List className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ListOrdered className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => pdfInputRef.current?.click()}><FileText className="h-4 w-4" /></Button>
                            </div>
                            <Textarea
                                id="post-content"
                                placeholder="Share your in-depth knowledge and include images or LaTeX formulas."
                                className="min-h-[150px] w-full border-none rounded-t-none px-2 shadow-none focus-visible:ring-0"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="post-tags" className="font-semibold">
                            Tags
                        </Label>
                        <Input
                            id="post-tags"
                            placeholder="Add up to 5 tags to describes what your post is about."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                        />
                        <div className="mt-2 flex flex-wrap gap-2 min-h-[24px]">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="font-semibold">Đã đính kèm</Label>
                        <div className="flex flex-col gap-2">
                            {images.map((file, index) => (
                                <Badge key={index} variant="outline" className="flex items-center justify-between w-fit gap-2">
                                    <div className="flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3 text-green-500" />
                                        {file.name}
                                    </div>
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile("image", index)} />
                                </Badge>
                            ))}
                            {pdfs.map((file, index) => (
                                <Badge key={index} variant="outline" className="flex items-center justify-between w-fit gap-2">
                                    <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3 text-blue-500" />
                                        {file.name}
                                    </div>
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile("pdf", index)} />
                                </Badge>
                            ))}
                            {images.length === 0 && pdfs.length === 0 && (
                                <p className="text-xs text-muted-foreground">Chưa có file nào.</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="p-6 pt-0 space-y-4 max-h-[70vh] overflow-y-auto">
                    <Card className="w-full shadow-none border">
                        <CardHeader className="flex-row items-start gap-3 space-y-0">
                            <Avatar>
                                <AvatarImage src={mockUser.avatarUrl} />
                                <AvatarFallback>{mockUser.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{mockUser.username}</p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>Vừa xong</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h2 className="text-xl font-semibold mb-2">{title || "(Chưa có tiêu đề)"}</h2>
                            <div className="mb-4">
                                {content.trim() ? (
                                    <MarkdownRenderer content={content} />
                                ) : (
                                    <p className="text-muted-foreground">
                                        Nội dung xem trước sẽ xuất hiện ở đây.
                                    </p>
                                )}
                            </div>
                            {images.length > 0 && (
                                <div className="mt-4">
                                    <img
                                        src={URL.createObjectURL(images[0])}
                                        alt="Preview"
                                        className="max-h-96 w-full rounded-md border object-contain"
                                    />
                                </div>
                            )}
                            {pdfs.length > 0 && (
                                <div className="mt-4 flex flex-col gap-2">
                                    <a
                                        href={URL.createObjectURL(pdfs[0])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-md border p-2 text-sm text-blue-600 hover:bg-accent w-fit"
                                    >
                                        <FileText className="h-4 w-4" />
                                        {pdfs[0].name}
                                    </a>
                                </div>
                            )}
                        </CardContent>

                        {tags.length > 0 && (
                            <CardFooter className="flex-col items-start gap-4">
                                <div className="w-full border-t pt-4 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
            {error && (
                <p className="px-6 pb-4 text-center text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2 border-t p-4">
                <Button
                    variant="outline"
                    onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
                >
                    {activeTab === "edit" ? "Xem trước" : "Chỉnh sửa"}
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={
                        isLoading ||
                        !content.trim() ||
                        !title.trim() ||
                        tags.length === 0
                    }
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đăng bài
                </Button>
            </div>
            <input
                type="file"
                ref={imageInputRef}
                accept="image/png, image/jpeg"
                onChange={(e) => handleFileChange(e, "image")}
                className="hidden"
            />
            <input
                type="file"
                ref={pdfInputRef}
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, "pdf")}
                className="hidden"
            />
        </DialogContent>
    )
}