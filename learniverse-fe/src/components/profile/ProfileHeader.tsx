"use client";

import { UserProfileResponse } from "@/types/userProfile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Calendar, Star, FileText, MessageCircleQuestion } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

interface ProfileHeaderProps {
    profile: UserProfileResponse;
    isOwnProfile: boolean;
    onEditClick?: () => void;
    onRefresh: () => void;
    customPostCount?: number;
    customAnswerCount?: number;
}

export default function ProfileHeader({ profile, isOwnProfile, onEditClick, customPostCount, customAnswerCount }: ProfileHeaderProps) {
    const { user } = useAuth();
    const displayTags = profile.interestTags || [];
    
    const displayUsername = profile.user?.username || user?.username || profile.user?.email?.split('@')[0] || "user";
    
    const finalPostCount = customPostCount !== undefined ? customPostCount : (profile.postCount || 0);
    const finalAnswerCount = customAnswerCount !== undefined ? customAnswerCount : (profile.answeredQuestionCount || 0);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden mb-6">
            <div className="relative w-full h-48 md:h-64 bg-gray-200 dark:bg-zinc-800">
                {profile.coverUrl ? (
                    <img
                        src={profile.coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80" />
                )}
            </div>

            <div className="px-4 md:px-8 pb-6">
                <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">

                    <div className="-mt-12 md:-mt-16 z-10 shrink-0">
                        <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-white dark:border-zinc-900 bg-white shadow-md">
                            <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
                            <AvatarFallback className="text-4xl font-bold text-gray-400">
                                {profile.displayName?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="flex-1 w-full md:mt-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {profile.displayName}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    @{displayUsername}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                {isOwnProfile ? (
                                    <Button onClick={onEditClick} variant="outline" className="gap-2 shadow-sm">
                                        <Edit className="w-4 h-4" />
                                        <span className="hidden sm:inline">Chỉnh sửa hồ sơ</span>
                                        <span className="sm:hidden">Sửa</span>
                                    </Button>
                                ) : (
                                    <Button className="bg-blue-600 hover:bg-blue-700">Theo dõi</Button>
                                )}
                            </div>
                        </div>

                        {profile.bio && (
                            <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm md:text-base max-w-2xl leading-relaxed">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5" title="Số bài viết đã đăng">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {finalPostCount}
                                </span>
                                <span className="hidden sm:inline">bài viết</span>
                            </div>

                            <div className="flex items-center gap-1.5" title="Số câu trả lời đã đóng góp">
                                <MessageCircleQuestion className="w-4 h-4 text-green-500" />
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {finalAnswerCount}
                                </span>
                                <span className="hidden sm:inline">đã trả lời</span>
                            </div>

                            {displayTags.length > 0 && (
                                <div className="flex items-center gap-2 ml-auto">
                                    {displayTags.slice(0, 3).map(tag => (
                                        <span key={tag.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                                #{tag.name}
                            </span>
                                    ))}
                                    {displayTags.length > 3 && <span className="text-xs">+{displayTags.length - 3}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}