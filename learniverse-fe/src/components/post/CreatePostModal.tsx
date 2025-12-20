"use client"

import React, { useState, useRef, useEffect } from "react"
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
} from "@/components/ui/card"
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
    Quote,
    Sigma,
} from "lucide-react"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { postService } from "@/lib/api/postService"
import { Tag, Post, PostAttachment } from "@/types/post"
import { useAuth } from "@/context/AuthContext"
import { TagMultiSelect, type TagOption } from "@/components/question/tag-multi-select"

const MAX_IMAGE_SIZE_MB = 5
const MAX_PDF_SIZE_MB = 15
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024

export default function CreatePostModalContent({
    setOpen,
    onSuccess,
    initialData
}: {
    setOpen: (open: boolean) => void
    onSuccess: () => void
    initialData?: Post
}) {
    const { user } = useAuth()
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [availableTags, setAvailableTags] = useState<TagOption[]>([])
    const [selectedTags, setSelectedTags] = useState<TagOption[]>([])
    const [images, setImages] = useState<File[]>([])
    const [pdfs, setPdfs] = useState<File[]>([])
    const [existingAttachments, setExistingAttachments] = useState<PostAttachment[]>([])
    const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([])
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("edit")

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title)
            setContent(initialData.body)
            setSelectedTags(initialData.tags.map(t => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                description: null
            })))
            setExistingAttachments(initialData.attachments || [])
        }
    }, [initialData])

    //Lấy tags
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await postService.getAllTags();
                if (res.data) {
                    setAvailableTags(res.data.map((t: Tag) => ({
                        id: t.id,
                        name: t.name,
                        slug: t.slug,
                        description: t.description || null
                    })));
                }
            } catch (err) {
                console.error("Lỗi tải tags:", err);
            }
        };
        fetchTags();
    }, []);

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

        setContent(nextValue)

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

        setContent(nextValue)

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
        if (!title.trim()) return setError("Tiêu đề không được để trống.")
        const bodyContent = content.trim();
        if (!bodyContent) return setError("Nội dung không được để trống.");
        if (bodyContent.length < 10) return setError("Nội dung bài viết phải có ít nhất 10 ký tự.");
        if (selectedTags.length === 0) return setError("Vui lòng chọn ít nhất 1 tag.")

        setIsLoading(true)

        try {
            const payload = {
                title: title,
                body: content,
                tagIds: selectedTags.map(tag => tag.id),
                status: "PUBLISHED" 
            };
            const filesToUpload = [...images, ...pdfs];

            if (initialData) {
                const updatePayload = {
                    ...payload,
                    deletedAttachmentIds
                }
                await postService.updatePost(initialData.id, updatePayload, filesToUpload);
            } else {
                await postService.createPost(payload, filesToUpload);
            }
            
            setOpen(false)
            setTitle("")
            setContent("")
            setSelectedTags([])
            setImages([])
            setPdfs([])
            setExistingAttachments([])
            setDeletedAttachmentIds([])

            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            console.error("Lỗi đăng bài:", err);
            const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra khi xử lý bài viết.";
            setError(errorMessage);
        } finally {
            setIsLoading(false)
        }
    }

    const removeFile = (type: "image" | "pdf", indexToRemove: number) => {
        if (type === "image") {
            setImages(images.filter((_, index) => index !== indexToRemove));
        }
        if (type === "pdf") {
            setPdfs(pdfs.filter((_, index) => index !== indexToRemove));
        }
    };

    const removeExistingFile = (attachmentId: string) => {
        setDeletedAttachmentIds([...deletedAttachmentIds, attachmentId])
        setExistingAttachments(existingAttachments.filter(a => a.id !== attachmentId))
    }


    return (
        <DialogContent className="max-w-5xl p-0">
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
                            <AvatarImage src={user?.avatarUrl} />
                            <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{user?.username}</span>
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
                            <div className="flex items-center gap-1 p-1 border-b bg-gray-50 rounded-t-md flex-wrap">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyWrapFormatting("**", "**", "in đậm")}><Bold className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyWrapFormatting("*", "*", "in nghiêng")}><Italic className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyWrapFormatting("`", "`", "code")}><Code className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyWrapFormatting("[", "](url)", "liên kết")}><Link2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyLineFormatting((line) => `- ${line.replace(/^[-*]\s+/, "")}`, "Mục danh sách")}><List className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyLineFormatting((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s+/, "")}`, "Mục danh sách")}><ListOrdered className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyLineFormatting((line) => `> ${line.replace(/^>\s?/, "")}`, "Trích dẫn")}><Quote className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyWrapFormatting("$$", "$$", "latex")}><Sigma className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => pdfInputRef.current?.click()}><FileText className="h-4 w-4" /></Button>
                            </div>
                            <Textarea
                                ref={textareaRef}
                                id="post-content"
                                placeholder="Share your in-depth knowledge and include images or LaTeX formulas."
                                className="min-h-[150px] w-full max-w-full border-none rounded-t-none px-2 shadow-none focus-visible:ring-0 resize-y whitespace-pre-wrap break-all"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="post-tags" className="font-semibold">
                            Tags
                        </Label>
                        <TagMultiSelect
                            options={availableTags}
                            value={selectedTags}
                            onChange={setSelectedTags}
                            maxSelections={5}
                            error={error && selectedTags.length === 0 ? "Vui lòng chọn tag" : undefined}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="font-semibold">Đã đính kèm</Label>
                        <div className="flex flex-col gap-2">
                            {existingAttachments.map((file) => (
                                <Badge key={file.id} variant="outline" className="flex items-center justify-between w-full max-w-[300px] gap-2 p-2">
                                    <div className="flex items-center gap-2 truncate">
                                        {file.fileType === "IMAGE" ? (
                                            <ImageIcon className="h-4 w-4 text-green-500 shrink-0" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                        )}
                                        <span className="truncate" title={file.fileName}>{file.fileName}</span>
                                    </div>
                                    <button type="button" onClick={() => removeExistingFile(file.id)} className="shrink-0">
                                        <X className="h-4 w-4 cursor-pointer hover:text-red-500" />
                                    </button>
                                </Badge>
                            ))}
                            {images.map((file, index) => (
                                <Badge key={`new-img-${index}`} variant="outline" className="flex items-center justify-between w-full max-w-[300px] gap-2 p-2">
                                    <div className="flex items-center gap-2 truncate">
                                        <ImageIcon className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="truncate" title={file.name}>{file.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removeFile("image", index)} className="shrink-0">
                                        <X className="h-4 w-4 cursor-pointer hover:text-red-500" />
                                    </button>
                                </Badge>
                            ))}
                            {pdfs.map((file, index) => (
                                <Badge key={`new-pdf-${index}`} variant="outline" className="flex items-center justify-between w-full max-w-[300px] gap-2 p-2">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="truncate" title={file.name}>{file.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removeFile("pdf", index)} className="shrink-0">
                                        <X className="h-4 w-4 cursor-pointer hover:text-red-500" />
                                    </button>
                                </Badge>
                            ))}
                            {existingAttachments.length === 0 && images.length === 0 && pdfs.length === 0 && (
                                <p className="text-xs text-muted-foreground">Chưa có file nào.</p>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="p-6 pt-0 space-y-4 max-h-[70vh] overflow-y-auto">
                    <Card className="w-full shadow-none border">
                        <CardHeader className="flex-row items-start gap-3 space-y-0">
                            <Avatar>
                                <AvatarImage src={user?.avatarUrl} />
                                <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{user?.username}</p>
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
                            
                            {/* Preview Images */}
                            {(existingAttachments.some(a => a.fileType === "IMAGE") || images.length > 0) && (
                                <div className="mt-4 space-y-4">
                                    {existingAttachments.filter(a => a.fileType === "IMAGE").map(img => (
                                        <img
                                            key={img.id}
                                            src={img.storageUrl}
                                            alt={img.fileName}
                                            className="max-h-96 w-full rounded-md border object-contain"
                                        />
                                    ))}
                                    {images.map((img, idx) => (
                                        <img
                                            key={`preview-new-img-${idx}`}
                                            src={URL.createObjectURL(img)}
                                            alt="Preview"
                                            className="max-h-96 w-full rounded-md border object-contain"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Preview PDFs */}
                            {(existingAttachments.some(a => a.fileType === "PDF") || pdfs.length > 0) && (
                                <div className="mt-4 flex flex-col gap-2">
                                    {existingAttachments.filter(a => a.fileType === "PDF").map(pdf => (
                                        <a
                                            key={pdf.id}
                                            href={pdf.storageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-md border p-2 text-sm text-blue-600 hover:bg-accent w-fit"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {pdf.fileName}
                                        </a>
                                    ))}
                                    {pdfs.map((pdf, idx) => (
                                        <a
                                            key={`preview-new-pdf-${idx}`}
                                            href={URL.createObjectURL(pdf)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-md border p-2 text-sm text-blue-600 hover:bg-accent w-fit"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {pdf.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>

                        {selectedTags.length > 0 && (
                            <CardFooter className="flex-col items-start gap-4">
                                <div className="w-full border-t pt-4 flex flex-wrap gap-2">
                                    {selectedTags.map((tag) => (
                                        <Badge key={tag.id} variant="outline">
                                            {tag.name}
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
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Lưu thay đổi" : "Đăng bài"}
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