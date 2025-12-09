"use client"

import React, { useState, useEffect } from "react";
import { AvatarUploader } from "./avatar-uploader";
import { BackgroundUploader } from "./background-uploader";
import { TagSelector } from "@/components/auth/tag-selector";
import { UserProfileResponse, UpdateProfileRequest, UserTag } from "@/types/userProfile";
import { userProfileService } from "@/lib/api/userProfileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, BookOpen, TrendingUp, User } from "lucide-react";

interface ProfileEditFormProps {
    initialData: UserProfileResponse | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export function ProfileEditForm({ initialData, onCancel, onSuccess }: ProfileEditFormProps) {
    const [allTags, setAllTags] = useState<UserTag[]>([]);
    const [loading, setLoading] = useState(false);

    const [displayName, setDisplayName] = useState(initialData?.displayName || "");
    const [bio, setBio] = useState(initialData?.bio || "");

    const [favoriteTags, setFavoriteTags] = useState<string[]>(
        initialData?.tags?.map((t) => t.id) || []
    );
    const [improveTags, setImproveTags] = useState<string[]>([]);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(initialData?.avatarUrl || "");

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState(initialData?.coverUrl || "");

    useEffect(() => {
        const loadTags = async () => {
            try {
                const tags = await userProfileService.getAllUserTags();
                setAllTags(tags);
            } catch(e) { console.error(e); }
        }
        loadTags();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            console.log("Saving profile...", { displayName, bio, avatarFile, coverFile });

            const mergedTags = Array.from(new Set([...favoriteTags, ...improveTags]));

            const payload: UpdateProfileRequest = {
                displayName: displayName,
                bio: bio,
                userTags: mergedTags,
                avatar: avatarFile || undefined,
                coverImage: coverFile || undefined,
            };

            await userProfileService.updateMyProfile(payload);
            onSuccess();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Cập nhật thất bại. Vui lòng kiểm tra lại kết nối.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Chỉnh sửa hồ sơ
                </h2>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} disabled={loading}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Left Column: Images & Basic Info --- */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-visible border-none shadow-md pt-0">
                        <div className="relative">
                            {/* Cover Image */}
                            <BackgroundUploader
                                imageUrl={coverPreview}
                                onUpload={(url, file) => {
                                    setCoverPreview(url);
                                    setCoverFile(file);
                                }}
                            />

                            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-10">
                                <AvatarUploader
                                    imageUrl={avatarPreview}
                                    onUpload={(url, file) => {
                                        setAvatarPreview(url);
                                        setAvatarFile(file);
                                    }}
                                    className="w-32 h-32 border-4 border-white bg-white shadow-lg"
                                />
                            </div>
                        </div>

                        <div className="pt-20 pb-6 px-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Nhấn vào biểu tượng máy ảnh để thay đổi ảnh đại diện hoặc ảnh bìa.
                            </p>
                        </div>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="display-name">Tên hiển thị</Label>
                                <Input
                                    id="display-name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="VD: Nguyễn Văn A"
                                    className="font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Giới thiệu bản thân</Label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={6}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    placeholder="Chia sẻ một chút về sở thích, mục tiêu học tập của bạn..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Right Column: Tags --- */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                                <BookOpen className="w-5 h-5" />
                                Sở thích học tập
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Những môn học bạn yêu thích hoặc có thế mạnh.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <TagSelector
                                    mode="profile"
                                    selectedTags={favoriteTags}
                                    onChange={setFavoriteTags}
                                    availableTags={allTags}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                                <TrendingUp className="w-5 h-5" />
                                Mục tiêu cải thiện
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Những môn học bạn muốn trau dồi thêm kiến thức.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                                <TagSelector
                                    mode="profile"
                                    selectedTags={improveTags}
                                    onChange={setImproveTags}
                                    availableTags={allTags}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}