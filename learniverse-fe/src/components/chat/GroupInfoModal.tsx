
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Shield,
    UserMinus,
    LogOut,
    Loader2,
    UserPlus,
    MoreVertical,
} from "lucide-react";
import { chatService, ParticipantDTO } from "@/lib/api/chatService";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddMemberModal } from "./AddMemberModal";

interface Props {
    chatId: string;
    chatName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUserId: string;
    onLeaveGroup?: () => void;
}

export function GroupInfoModal({
    chatId,
    chatName,
    open,
    onOpenChange,
    currentUserId,
    onLeaveGroup,
}: Props) {
    const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const response = await chatService.getChatParticipants(chatId);
            if (response.data.status === "success") {
                setParticipants(response.data.data);
                const me = response.data.data.find((p) => p.participantId === currentUserId);
                setIsAdmin(me?.role === "ADMIN");
            }
        } catch (error) {
            console.error("Failed to fetch participants", error);
            toast.error("Không thể tải danh sách thành viên");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchParticipants();
        }
    }, [open, chatId]);

    const handleRemoveMember = async (userId: string) => {
        try {
            const response = await chatService.removeParticipant(chatId, userId);
            toast.success("Đã xóa thành viên");
            fetchParticipants(); // Refresh list
        } catch (error: any) {
            console.error("Failed to remove member", error);
            toast.error("Xóa thành viên thất bại");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            setLeaving(true);
            await chatService.leaveChat(chatId);
            toast.success("Đã rời nhóm");
            onOpenChange(false);
            if (onLeaveGroup) onLeaveGroup();
        } catch (error) {
            console.error("Failed to leave group", error);
            toast.error("Rời nhóm thất bại");
        } finally {
            setLeaving(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{chatName}</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            {participants.length} thành viên
                        </p>
                    </DialogHeader>

                    <div className="flex justify-between items-center my-2">
                        <h3 className="text-sm font-semibold">Thành viên</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddMemberOpen(true)}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Thêm thành viên
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {participants.map((p, index) => (
                                    <div
                                        key={`${p.participantId || "user"}-${index}`}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                <AvatarImage src={p.avatarUrl || undefined} />
                                                <AvatarFallback>
                                                    {(p.displayName || p.username || "?")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none">
                                                    {p.displayName || p.username}
                                                    {p.participantId === currentUserId && " (Bạn)"}
                                                </p>

                                                {p.role === "ADMIN" && (
                                                    <span className="flex items-center text-xs text-blue-600 mt-1">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Quản trị viên
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Menu */}
                                        {p.participantId !== currentUserId && isAdmin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleRemoveMember(p.participantId)}
                                                    >
                                                        <UserMinus className="mr-2 h-4 w-4" />
                                                        Xóa khỏi nhóm
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter className="sm:justify-between ">
                        {leaving ? (
                            <Button disabled variant="destructive" className="w-full sm:w-auto">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang rời...
                            </Button>
                        ) : showLeaveConfirm ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-sm text-red-600 mr-2">Bạn chắc chắn?</span>
                                <Button variant="outline" size="sm" onClick={() => setShowLeaveConfirm(false)}>Hủy</Button>
                                <Button variant="destructive" size="sm" onClick={handleLeaveGroup}>Rời nhóm</Button>
                            </div>
                        ) : (
                            <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setShowLeaveConfirm(true)}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Rời nhóm
                            </Button>
                        )}

                        <Button variant="secondary" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddMemberModal
                chatId={chatId}
                open={isAddMemberOpen}
                onOpenChange={setIsAddMemberOpen}
                onMemberAdded={fetchParticipants}
            />
        </>
    );
}
