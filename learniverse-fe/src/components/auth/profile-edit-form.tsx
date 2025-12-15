"use client";

import React, { useState, useEffect } from "react";
import { AvatarUploader } from "./avatar-uploader";
import { BackgroundUploader } from "./background-uploader";
import { TagSelector } from "@/components/auth/tag-selector";
import { UserProfileResponse, UpdateProfileRequest } from "@/types/userProfile";
import { UserTag } from "@/types/userTag";
import { userProfileService } from "@/lib/api/userProfileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
    Save,
    User,
    Sparkles,
    Mail,
    AtSign,
    TrendingUp,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

interface ProfileEditFormProps {
    user: UserProfileResponse | null;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function ProfileEditForm({ user, onCancel, onSuccess }: ProfileEditFormProps) {
    const { user: authUser } = useAuth();

    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");

    const [allSystemTags, setAllSystemTags] = useState<UserTag[]>([]);
    const [interestTagIds, setInterestTagIds] = useState<string[]>([]);
    const [improveTagIds, setImproveTagIds] = useState<string[]>([]);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState("");

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const fallbackName = user.user?.username || authUser?.username || "Người dùng";
            setDisplayName(user.displayName || fallbackName);

            setBio(user.bio || "");

            setAvatarPreview(user.avatarUrl || "");
            setCoverPreview(user.coverUrl || "");
            const interests = user.interestTags ? user.interestTags.map((t) => t.id) : [];
            const skills = user.skillTags ? user.skillTags.map((t) => t.id) : [];

            setInterestTagIds(interests);
            setImproveTagIds(skills);
        }
    }, [user, authUser]);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const tags = await userProfileService.getAllUserTags();
                setAllSystemTags(tags);
            } catch (e) {
                console.error("Failed to load tags", e);
            }
        };
        loadTags();
    }, []);

    const handleAvatarSelect = (url: string, file: File) => {
        setAvatarFile(file);
        setAvatarPreview(url);
    };

    const handleCoverSelect = (url: string, file: File) => {
        setCoverFile(file);
        setCoverPreview(url);
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            toast.error("Tên hiển thị không được để trống");
            return;
        }

        setLoading(true);
        try {
            const payload: UpdateProfileRequest = {
                displayName,
                bio,
                avatar: avatarFile || undefined,
                cover: coverFile || undefined,
                interestTagIds: interestTagIds,
                skillTagIds: improveTagIds
            };

            await userProfileService.updateMyProfile(payload);
            toast.success("Cập nhật hồ sơ thành công!");
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra khi cập nhật.");
        } finally {
            setLoading(false);
        }
    };

    const displayUsername = user?.user?.username || authUser?.username || "N/A";
    const displayEmail = user?.user?.email || authUser?.email || "Chưa cập nhật";

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b bg-white dark:bg-zinc-900 sticky top-0 z-20 shadow-sm shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        Chỉnh sửa trang cá nhân
                    </h2>
                    <p className="text-base text-gray-500 mt-1 ml-1">Cập nhật thông tin hiển thị và sở thích học tập</p>
                </div>
                <div className="flex gap-4">
                    {onCancel && (
                        <Button variant="outline" onClick={onCancel} disabled={loading} className="px-8 h-11 text-base">
                            Hủy
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 text-base min-w-[140px]">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        Lưu
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                    <div className="lg:col-span-5 space-y-8">
                        <Card className="p-0 overflow-hidden border-none shadow-md bg-white dark:bg-zinc-900">
                            <div className="relative">
                                <BackgroundUploader
                                    imageUrl={coverPreview}
                                    onUpload={handleCoverSelect}
                                    className="h-56 w-full"
                                />

                                <div className="absolute -bottom-16 left-8 z-20">
                                    {/* AvatarUploader đã có sẵn style border/shadow */}
                                    <AvatarUploader
                                        imageUrl={avatarPreview}
                                        onUpload={handleAvatarSelect}
                                        className="w-32 h-32"
                                    />
                                </div>
                            </div>

                            <div className="pt-20 pb-8 px-8 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Tên hiển thị <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Tên hiển thị của bạn"
                                        className="h-12 text-lg px-4 bg-gray-50 dark:bg-zinc-800 border-gray-200"
                                    />
                                    <p className="text-xs text-gray-400">Đây là tên sẽ xuất hiện trên bài viết và bình luận của bạn.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 pt-2 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-100 dark:border-zinc-800">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên đăng nhập</Label>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                            <AtSign className="w-4 h-4 text-blue-500" />
                                            {displayUsername}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</Label>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                            <Mail className="w-4 h-4 text-blue-500" />
                                            {displayEmail}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-base font-semibold flex justify-between">
                                        Giới thiệu
                                        <span className="text-xs font-normal text-gray-400">{bio.length}/500</span>
                                    </Label>
                                    <Textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Viết đôi dòng về bản thân..."
                                        rows={5}
                                        className="resize-none text-base leading-relaxed bg-gray-50 dark:bg-zinc-800 border-gray-200 p-4"
                                        maxLength={500}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-7 h-full flex flex-col gap-6">
                        <Card className="p-6 border-none shadow-md bg-white dark:bg-zinc-900 flex-1 flex flex-col">
                            <div className="mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    Sở thích & Môn học yêu thích
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Chọn các chủ đề bạn quan tâm.
                                </p>
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-zinc-800/30 rounded-xl p-4 border border-dashed border-gray-300 dark:border-zinc-700 overflow-y-auto max-h-[350px]">
                                <TagSelector
                                    mode="profile"
                                    selectedTags={interestTagIds}
                                    onChange={setInterestTagIds}
                                    availableTags={allSystemTags}
                                />
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-md bg-white dark:bg-zinc-900 flex-1 flex flex-col">
                            <div className="mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                    Môn học cần cải thiện
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Chọn các môn bạn muốn tập trung học tập thêm.
                                </p>
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-zinc-800/30 rounded-xl p-4 border border-dashed border-gray-300 dark:border-zinc-700 overflow-y-auto max-h-[350px]">
                                <TagSelector
                                    mode="profile"
                                    selectedTags={improveTagIds}
                                    onChange={setImproveTagIds}
                                    availableTags={allSystemTags}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}