import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserSelector } from "./UserSelector";
import { chatService } from "@/lib/api/chatService";
import { Loader2 } from "lucide-react";

interface CreateGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated: () => void;
}

export function CreateGroupModal({
    open,
    onOpenChange,
    onGroupCreated,
}: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    const handleToggleUser = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUserIds.length < 2) return;

        try {
            setCreating(true);
            await chatService.createGroupChat({
                name: groupName,
                participantIds: selectedUserIds,
            });
            onGroupCreated();
            onOpenChange(false);
            setGroupName("");
            setSelectedUserIds([]);
        } catch (error) {
            console.error("Failed to create group chat", error);
            // Ideally show toast error here
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tạo nhóm mới</DialogTitle>
                    <DialogDescription>
                        Đặt tên cho nhóm và thêm các thành viên vào cuộc trò chuyện.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Tên nhóm</Label>
                        <Input
                            id="name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nhập tên nhóm..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Thành viên ({selectedUserIds.length})</Label>
                        <UserSelector
                            selectedUserIds={selectedUserIds}
                            onToggleUser={handleToggleUser}
                        />
                        {selectedUserIds.length < 2 && (
                            <p className="text-xs text-red-500">
                                Chọn ít nhất 2 thành viên để tạo nhóm.
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={
                            creating || !groupName.trim() || selectedUserIds.length < 2
                        }
                    >
                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tạo nhóm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
