
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfileResponse } from "@/types/userProfile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, FileText, MessageCircleQuestion, UserPlus, UserCheck, UserX, Loader2, Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { FriendStatus } from "@/types/friend";
import { friendService } from "@/lib/api/friendService";
import { chatService } from "@/lib/api/chatService";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileHeaderProps {
    profile: UserProfileResponse;
    isOwnProfile: boolean;
    onEditClick?: () => void;
    onRefresh: () => void;
    customPostCount?: number;
    customAnswerCount?: number;
    friendStatus?: FriendStatus;
    isReceivedRequest?: boolean;
    userId?: string;
}

export default function ProfileHeader({
    profile,
    isOwnProfile,
    onEditClick,
    onRefresh,
    customPostCount,
    customAnswerCount,
    friendStatus = FriendStatus.NONE,
    isReceivedRequest = false,
    userId
}: ProfileHeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isMessageLoading, setIsMessageLoading] = useState(false);

    const displayTags = profile.interestTags || [];
    const displayUsername = profile.user?.username || user?.username || profile.user?.email?.split('@')[0] || "user";

    const finalPostCount = customPostCount !== undefined ? customPostCount : (profile.postCount || 0);
    const finalAnswerCount = customAnswerCount !== undefined ? customAnswerCount : (profile.answeredQuestionCount || 0);

    const targetUserId = userId || profile.userId || profile.user?.id;

    console.log("ProfileHeader Debug:", { profile, targetUserId });

    const handleFriendAction = async (action: 'ADD' | 'CANCEL' | 'ACCEPT' | 'REJECT' | 'UNFRIEND') => {
        console.log("handleFriendAction:", action, targetUserId);
        if (!targetUserId) {
            toast.error("Không tìm thấy ID người dùng");
            return;
        }
        setIsLoading(true);
        try {
            switch (action) {
                case 'ADD':
                    await friendService.sendRequest(targetUserId);
                    toast.success("Đã gửi lời mời kết bạn");
                    break;
                case 'CANCEL':
                    await friendService.cancelRequest(targetUserId);
                    toast.success("Đã hủy lời mời");
                    break;
                case 'ACCEPT':
                    await friendService.acceptRequest(targetUserId);
                    toast.success("Đã chấp nhận lời mời");
                    break;
                case 'REJECT':
                    await friendService.rejectRequest(targetUserId);
                    toast.success("Đã từ chối lời mời");
                    break;
                case 'UNFRIEND':
                    await friendService.unfriend(targetUserId);
                    toast.success("Đã hủy kết bạn");
                    break;
            }
            onRefresh();
        } catch (error) {
            console.error("Lỗi thao tác bạn bè:", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMessage = () => {
        if (!targetUserId) return;
        router.push(`/chat?userId=${targetUserId}`);
    };

    const renderFriendButton = () => {
        if (isOwnProfile) return null;

        if (isLoading) {
            return (
                <Button disabled variant="outline" className="w-[120px]">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Xử lý...
                </Button>
            );
        }

        switch (friendStatus) {
            case FriendStatus.NONE:
                return (
                    <Button onClick={() => handleFriendAction('ADD')} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Kết bạn
                    </Button>
                );
            case FriendStatus.PENDING:
                if (isReceivedRequest) {
                    return (
                        <div className="flex gap-2">
                            <Button onClick={() => handleFriendAction('ACCEPT')} className="bg-green-600 hover:bg-green-700">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Chấp nhận
                            </Button>
                            <Button onClick={() => handleFriendAction('REJECT')} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                <UserX className="w-4 h-4 mr-2" />
                                Từ chối
                            </Button>
                        </div>
                    );
                }
                return (
                    <Button onClick={() => handleFriendAction('CANCEL')} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                        <Send className="w-4 h-4 mr-2" />
                        Đã gửi
                    </Button>
                );
            case FriendStatus.ACCEPTED:
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Bạn bè
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFriendAction('UNFRIEND')} className="text-red-600">
                                <UserX className="w-4 h-4 mr-2" />
                                Hủy kết bạn
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            case FriendStatus.REJECTED:

                return (
                    <Button onClick={() => handleFriendAction('ADD')} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Kết bạn
                    </Button>
                );
            default:
                return (
                    <Button variant="secondary" disabled className="w-[120px]">
                        Đang chờ...
                    </Button>
                );
        }
    };

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
                                    <>
                                        {renderFriendButton()}
                                        <Button onClick={handleMessage} variant="outline" disabled={isMessageLoading}>
                                            {isMessageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                                            Nhắn tin
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {profile.bio && (
                            <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm md:text-base max-w-2xl leading-relaxed whitespace-pre-wrap">
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