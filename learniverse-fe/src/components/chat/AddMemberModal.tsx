import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserSelector } from "./UserSelector";
import { chatService, ParticipantDTO } from "@/lib/api/chatService";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used as it was in list_dir

interface AddMemberModalProps {
    chatId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMemberAdded: () => void;
}

export function AddMemberModal({
    chatId,
    open,
    onOpenChange,
    onMemberAdded,
}: AddMemberModalProps) {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);
    const [existingParticipants, setExistingParticipants] = useState<string[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        if (open && chatId) {
            const fetchParticipants = async () => {
                try {
                    setLoadingParticipants(true);
                    const response = await chatService.getChatParticipants(chatId);
                    if (response.data?.status === "success") {
                        // Assuming response.data.data is ParticipantDTO[] based on chatService
                        const participants = response.data.data;
                        setExistingParticipants(participants.map((p) => p.participantId));
                    }
                } catch (error) {
                    console.error("Failed to fetch participants", error);
                } finally {
                    setLoadingParticipants(false);
                }
            };
            fetchParticipants();
        } else {
            setSelectedUserIds([]);
        }
    }, [chatId, open]);

    const handleToggleUser = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAdd = async () => {
        if (selectedUserIds.length === 0) return;

        try {
            setAdding(true);
            await chatService.addParticipants(chatId, selectedUserIds);

            onMemberAdded();
            onOpenChange(false);
            setSelectedUserIds([]);
            toast.success("Đã thêm thành viên vào nhóm");
        } catch (error) {
            console.error("Failed to add members", error);
            toast.error("Thêm thành viên thất bại");
        } finally {
            setAdding(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm thành viên</DialogTitle>
                    <DialogDescription>
                        Chọn bạn bè để thêm vào nhóm này.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        {loadingParticipants ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <UserSelector
                                selectedUserIds={selectedUserIds}
                                onToggleUser={handleToggleUser}
                                excludedUserIds={existingParticipants}
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={adding || selectedUserIds.length === 0}
                    >
                        {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Thêm ({selectedUserIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
