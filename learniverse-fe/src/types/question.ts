export interface QuestionAuthor {
    id: string
    username: string
    avatarUrl?: string | null
}

export interface QuestionTag {
    id: string
    name: string
    slug: string
    description?: string | null
}

export interface QuestionAttachment {
    id: string
    fileName: string
    fileType: "IMAGE" | "PDF" | "OTHER"
    mimeType: string
    storageUrl: string
    fileSize: number
    createdAt: string
}

export type QuestionVoteType = "UPVOTE" | "DOWNVOTE" | null

export interface QuestionAnswer {
    id: string
    questionId: string
    author: QuestionAuthor
    body: string
    attachments?: QuestionAttachment[]
    voteScore?: number | null
    upvoteCount?: number | null
    downvoteCount?: number | null
    isAccepted?: boolean | null
    createdAt: string
    updatedAt: string
    commentCount?: number | null
    reactionCount?: number | null
    currentUserVote?: QuestionVoteType
    currentUserReaction?: string | null
}

export interface QuestionSummary {
    id: string
    author: QuestionAuthor
    contentType: "QUESTION"
    title: string
    slug: string
    body?: string | null
    viewCount?: number | null
    commentCount?: number | null
    bookmarkCount?: number | null
    voteScore?: number | null
    answerCount?: number | null
    isAnswered?: boolean | null
    acceptedAnswerId?: string | null
    publishedAt?: string | null
    tags: QuestionTag[]
    excerpt?: string | null
    currentUserVote?: QuestionVoteType | null
}

export interface QuestionDetail extends QuestionSummary {
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    body: string
    createdAt: string
    updatedAt: string
    lastEditedAt?: string | null
    attachments: QuestionAttachment[]
    answers: QuestionAnswer[]
    bookmarkedByCurrentUser: boolean
    currentUserVote: QuestionVoteType
    currentUserReaction: string | null
}

export type QuestionResponse = QuestionDetail
