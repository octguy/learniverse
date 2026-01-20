"use client";

import { useEffect, useState, memo } from "react";

interface EmojiPickerProps {
    onEmojiSelect: (emoji: { native: string }) => void;
}

function LoadingPlaceholder() {
    return (
        <div className="w-[352px] h-[435px] bg-popover rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Đang tải emoji...</span>
            </div>
        </div>
    );
}

let cachedPicker: any = null;
let cachedData: any = null;
let loadingPromise: Promise<void> | null = null;

async function loadPickerAndData() {
    if (cachedPicker && cachedData) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = Promise.all([
        import("@emoji-mart/react"),
        import("@emoji-mart/data")
    ]).then(([pickerModule, dataModule]) => {
        cachedPicker = pickerModule.default;
        cachedData = dataModule.default;
    });

    return loadingPromise;
}

export const EmojiPicker = memo(function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    const [isReady, setIsReady] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        if (cachedPicker && cachedData) {
            setIsReady(true);
        } else {
            loadPickerAndData().then(() => {
                setIsReady(true);
            });
        }
    }, [isMounted]);
    if (!isMounted) {
        return <LoadingPlaceholder />;
    }

    if (!isReady || !cachedPicker || !cachedData) {
        return <LoadingPlaceholder />;
    }

    const Picker = cachedPicker;

    return (
        <Picker
            data={cachedData}
            onEmojiSelect={onEmojiSelect}
            theme="auto"
            locale="vi"
            previewPosition="none"
            skinTonePosition="none"
        />
    );
});
