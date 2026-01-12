"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PostCardSkeleton() {
    return (
        <Card className="overflow-hidden border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                {/* Avatar skeleton */}
                <Skeleton className="h-12 w-12 rounded-full" />

                <div className="flex-1 space-y-2">
                    {/* Author name and badge */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    {/* Timestamp */}
                    <Skeleton className="h-3 w-24" />
                </div>

                {/* Menu button */}
                <Skeleton className="h-8 w-8 rounded-md" />
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
                {/* Title */}
                <Skeleton className="h-6 w-3/4" />

                {/* Content lines */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                </div>
            </CardContent>

            <CardFooter className="border-t border-border/40 pt-4">
                <div className="flex w-full items-center justify-between">
                    {/* Action buttons */}
                    <div className="flex gap-4">
                        <Skeleton className="h-9 w-20 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-20 rounded-md" />
                    </div>

                    {/* Bookmark button */}
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </CardFooter>
        </Card>
    )
}

export function PostCardSkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    )
}
