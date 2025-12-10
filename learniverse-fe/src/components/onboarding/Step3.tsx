"use client"

import { TagSelector } from "../auth/tag-selector"
import { UserTag } from "@/types/userTag"

interface Step3Props {
    onNext?: () => void
    onPrev?: () => void
    selectedTags: string[]
    onChange: (tags: string[]) => void
    availableTags: UserTag[]
}

export default function Step3({
                                  onNext,
                                  onPrev,
                                  selectedTags,
                                  onChange,
                                  availableTags
                              }: Step3Props) {
    return (
        <div>
            <TagSelector
                mode="onboarding"
                selectedTags={selectedTags}
                onChange={onChange}
                onNext={onNext}
                onPrev={onPrev}
                availableTags={availableTags}
            />
        </div>
    )
}