"use client";

import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Smile } from "lucide-react";
import { friendService } from "@/lib/api/friendService";
import { SuggestedFriend } from "@/types/friend";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";

interface CommentInputProps {
    placeholder?: string;
    initialValue?: string;
    initialMentions?: SuggestedFriend[];
    onSubmit: (text: string, mentionedUserIds: string[]) => Promise<void>;
    onCancel?: () => void;
    autoFocus?: boolean;
    submitLabel?: string;
}

const EMPTY_MENTIONS: SuggestedFriend[] = [];

export function CommentInput({
    placeholder = "Viết bình luận...",
    initialValue = "",
    initialMentions = EMPTY_MENTIONS,
    onSubmit,
    onCancel,
    autoFocus = false,
    submitLabel = "Gửi"
}: CommentInputProps) {
    const [text, setText] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(
        new Set(initialMentions.map(u => u.userId || u.id))
    );
    const [friendCache, setFriendCache] = useState<Map<string, string>>(new Map());
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await friendService.getFriends();
                // @ts-ignore
                const data: SuggestedFriend[] = response.data?.data || response.data || [];
                if (Array.isArray(data)) {
                    setFriendCache(prev => {
                        const newCache = new Map(prev);
                        data.forEach(f => {
                            if (f.username && (f.userId || f.id)) {
                                newCache.set(f.username, f.userId || f.id);
                            }
                            if (f.id && f.userId) {
                                newCache.set(f.id, f.userId);
                            }
                        });
                        return newCache;
                    });
                }
            } catch (err) {
                console.error("Failed to cache friends for mention resolution", err);
            }
        };
        fetchFriends();
    }, []);
    useEffect(() => {
        if (autoFocus && textareaRef.current && initialValue) {
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
            textareaRef.current.focus();
        }
    }, [autoFocus, initialValue]);

    useEffect(() => {
        setText(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (initialMentions && initialMentions.length > 0) {
            setFriendCache(prev => {
                const newCache = new Map(prev);
                initialMentions.forEach(u => {
                    const uid = u.userId || u.id;
                    if (u.username && uid) {
                        newCache.set(u.username, uid);
                    }
                });
                console.log("Updated friendCache from initialMentions:", newCache);
                return newCache;
            });
            setMentionedUserIds(new Set(initialMentions.map(u => u.userId || u.id)));
        }
    }, [initialMentions]);

    // Debounce search
    useEffect(() => {
        const searchFriends = async () => {
            try {
                let data: SuggestedFriend[] = [];
                if (!mentionQuery.trim()) {
                    const response = await friendService.getFriends();
                    // @ts-ignore
                    data = response.data?.data || response.data || [];
                } else {
                    const response = await friendService.searchFriends(mentionQuery);
                    // @ts-ignore
                    const rawData = response.data || response;
                    // @ts-ignore
                    data = rawData.content || rawData.data?.content || rawData.data || [];
                }

                if (Array.isArray(data)) {
                    setSuggestions(data);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error("Error searching friends:", error);
                setSuggestions([]);
            }
        };

        const delay = mentionQuery.trim() ? 300 : 0;
        const timeoutId = setTimeout(searchFriends, delay);
        return () => clearTimeout(timeoutId);
    }, [mentionQuery]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const newCursorPos = e.target.selectionStart;

        setText(newValue);
        setCursorPosition(newCursorPos);

        // Detect mention trigger
        const textBeforeCursor = newValue.slice(0, newCursorPos);
        const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

        if (lastAtSymbol !== -1) {
            // Ensure @ is at start or preceded by whitespace
            const charBeforeAt = lastAtSymbol > 0 ? textBeforeCursor[lastAtSymbol - 1] : " ";
            if (/\s/.test(charBeforeAt)) {
                const query = textBeforeCursor.slice(lastAtSymbol + 1);

                // Allow spaces but stop if newline or too long (e.g. > 50 chars probably not a name search)
                if (!query.includes("\n") && query.length < 50) {
                    setMentionQuery(query);
                    setShowSuggestions(true);
                    return;
                }
            }
        }

        setShowSuggestions(false);
    };

    const handleSelectUser = (user: SuggestedFriend) => {
        const textBeforeCursor = text.slice(0, cursorPosition);
        const lastAtSymbol = textBeforeCursor.lastIndexOf("@");
        const textAfterCursor = text.slice(cursorPosition);

        let idToSave: string | undefined = user.userId;

        if (!idToSave) {
            idToSave = friendCache.get(user.username);
        }
        if (!idToSave) {
            idToSave = friendCache.get(user.id);
        }
        // Fallback
        if (!idToSave) {
            idToSave = user.id;
        }

        const newText = textBeforeCursor.slice(0, lastAtSymbol) + `@${user.username} ` + textAfterCursor;
        setText(newText);
        setShowSuggestions(false);

        // Add to mentioned set
        if (idToSave) {
            setMentionedUserIds(prev => new Set(prev).add(idToSave!));
            setFriendCache(prev => {
                const newCache = new Map(prev);
                newCache.set(user.username, idToSave!);
                return newCache;
            });
            console.log("Saving to cache:", user.username, idToSave);
        }

        // Focus back
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleSubmit = async () => {
        if (!text.trim()) return;

        setIsSubmitting(true);
        try {
            let finalText = text;
            console.log("Submitting. Cache keys:", Array.from(friendCache.keys()));
            finalText = text.replace(/(@[\w._@]+)/g, (match) => {
                const username = match.slice(1); // remove @
                const id = friendCache.get(username);
                console.log(`Replacing: ${username}, Found ID: ${id}`);
                if (id) {
                    return `@[${username}](${id})`;
                }
                return match;
            });
            console.log("Final transformed text:", finalText);

            await onSubmit(finalText, Array.from(mentionedUserIds));
            setText("");
            setMentionedUserIds(new Set());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmojiSelect = (emoji: { native: string }) => {
        setText(prev => prev + emoji.native);
        // Không focus vào textarea để popover không tự đóng
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleInput}
                    placeholder={placeholder}
                    className="min-h-[60px] text-sm pr-12"
                    autoFocus={autoFocus}
                />

                {/* Emoji Picker Button */}
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-0 border-none"
                        side="top"
                        align="end"
                        sideOffset={5}
                    >
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </PopoverContent>
                </Popover>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full max-w-xs bg-popover border rounded-md shadow-md mb-2 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-1">
                            <div className="text-xs text-muted-foreground px-2 py-1">Đề xuất</div>
                            {suggestions.map(user => (
                                <button
                                    key={user.id}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-sm rounded-sm transition-colors text-left"
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={user.avatarUrl ?? undefined} />
                                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium truncate">{user.displayName || user.username}</span>
                                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
                {onCancel && (
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
                        Hủy
                    </Button>
                )}
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!text.trim() || isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : submitLabel}
                </Button>
            </div>
        </div>
    );
}
