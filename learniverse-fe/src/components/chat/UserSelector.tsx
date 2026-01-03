import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { friendService } from "@/lib/api/friendService";
import { UserProfile } from "@/types/userProfile";
import { Search, Loader2 } from "lucide-react";

interface UserSelectorProps {
    selectedUserIds: string[];
    onToggleUser: (userId: string) => void;
    excludedUserIds?: string[];
}

export function UserSelector({
    selectedUserIds,
    onToggleUser,
    excludedUserIds = [],
}: UserSelectorProps) {
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setLoading(true);
                const response = await friendService.getFriends(0, 100);
                if (response.data?.status === "success") {
                    const pageData = response.data.data;
                    if (pageData && Array.isArray(pageData.content)) {
                        setFriends(pageData.content);
                    } else if (Array.isArray(pageData)) {
                        setFriends(pageData);
                    }
                }
            } catch (error) {
                console.error("Failed to load friends", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, []);

    const filteredFriends = friends.filter((friend) => {
        if (excludedUserIds.includes(friend.id)) return false;
        if (searchTerm.trim() === "") return true;
        return (
            friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            friend.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm bạn bè..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>

            <ScrollArea className="h-[200px] rounded-md border p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredFriends.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                        Không tìm thấy bạn bè nào.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {filteredFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="flex items-center space-x-4 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                onClick={() => onToggleUser(friend.id)}
                            >
                                <Checkbox
                                    id={friend.id}
                                    checked={selectedUserIds.includes(friend.id)}
                                    onCheckedChange={() => onToggleUser(friend.id)}
                                />
                                <label
                                    htmlFor={friend.id}
                                    className="flex items-center space-x-3 cursor-pointer w-full"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <Avatar>
                                        <AvatarImage src={friend.avatarUrl || undefined} />
                                        <AvatarFallback>
                                            {friend.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium leading-none">
                                            {friend.username}
                                        </span>
                                        {friend.fullName && (
                                            <span className="text-xs text-muted-foreground">
                                                {friend.fullName}
                                            </span>
                                        )}
                                    </div>
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
