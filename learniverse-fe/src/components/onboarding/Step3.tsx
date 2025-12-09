"use client"

import { useState, useEffect } from "react"
import { TagSelector } from "../auth/tag-selector"
import { userProfileService } from "@/lib/api/userProfileService"
import { UserTag } from "@/types/userProfile"

interface Step3Props {
    onNext?: () => void
    onPrev?: () => void
}

export default function Step3({ onNext, onPrev }: Step3Props) {
    const [mockSelected, setMockSelected] = useState<string[]>([])
    const [allTags, setAllTags] = useState<UserTag[]>([])

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const tags = await userProfileService.getAllUserTags();
                setAllTags(tags);
            } catch (e) {
                console.error("Step3 fetch tags failed", e);
            }
        };
        fetchTags();
    }, []);

    return (
        <div>
            <TagSelector
                mode="onboarding"
                selectedTags={mockSelected}
                onChange={setMockSelected}
                onNext={onNext}
                onPrev={onPrev}
                availableTags={allTags}
            />
        </div>
    )
}