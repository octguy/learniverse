"use client"

import { useState } from "react"
import { TagSelector } from "../auth/tag-selector"
import Image from "next/image"

interface WelcomeStepProps {
    onNext?: () => void
    onPrev?: () => void
}

export default function Step3({onNext, onPrev }: WelcomeStepProps) {
    const [mockSelected, setMockSelected] = useState<string[]>(["Toán học", "Vật lý"])
    return (
        <div>
            <TagSelector
                mode="onboarding"
                selectedTags={mockSelected}
                onChange={setMockSelected}
                onNext={onNext}
                onPrev={onPrev}
            />           
        </div>
    )
}