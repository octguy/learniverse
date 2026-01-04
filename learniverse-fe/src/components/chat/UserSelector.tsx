import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { friendService } from "@/lib/api/friendService";
import { SuggestedFriend } from "@/types/friend";
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
    const [friends, setFriends] = useState<SuggestedFriend[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setLoading(true);
                const response = await friendService.getFriends();
                if (response.data?.status === "success") {
                    const data = response.data.data;
                    if (Array.isArray(data)) {
                        setFriends(data);
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
        if (excludedUserIds.includes(friend.userId)) return false;
        if (searchTerm.trim() === "") return true;
        return (
            friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
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
                                onClick={() => onToggleUser(friend.userId)}
                            >
                                <Checkbox
                                    id={friend.userId}
                                    checked={selectedUserIds.includes(friend.userId)}
                                    onCheckedChange={() => onToggleUser(friend.userId)}
                                />
                                <label
                                    htmlFor={friend.userId}
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
                                            {friend.displayName || friend.username}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            @{friend.username}
                                        </span>
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
