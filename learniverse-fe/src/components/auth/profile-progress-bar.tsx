"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ProfileProgressBarProps {
    value: number // phần trăm hoàn thiện hồ sơ (0–100)
    className?: string
}

export function ProfileProgressBar({ value, className }: ProfileProgressBarProps) {
    const safeValue = Math.min(Math.max(value, 0), 100)

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex justify-between items-center">
                <Label>Hoàn thiện hồ sơ</Label>
                <span className="text-sm text-muted-foreground">{safeValue}%</span>
            </div>
            <Progress value={safeValue} className="h-3 bg-muted" />
        </div>
    )
}
