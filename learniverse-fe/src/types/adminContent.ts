import { PageResponse } from "./api";
import { PostAttachment } from "./post";

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";

export interface AdminContentFilter {
  status?: ContentStatus;
  ownerId?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface AdminQuestionDto {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  contentType: "QUESTION";
  title: string;
  bodyExcerpt?: string;
  slug: string;
  viewCount: number;
  commentCount: number;
  bookmarkCount: number;
  voteScore: number;
  answerCount: number;
  isAnswered: boolean;
  acceptedAnswerId?: string;
  publishedAt: string;
  status?: ContentStatus;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  bookmarkedByCurrentUser: boolean;
  currentUserReaction?: string;
  currentUserVote?: string;
  body?: string;
}

export interface AdminPostDto {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  contentType: "POST";
  title: string;
  bodyExcerpt?: string;
  body?: string;
  slug: string;
  commentCount: number;
  reactionCount: number;
  bookmarkCount: number;
  voteScore: number;
  publishedAt: string;
  status?: ContentStatus;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
  bookmarkedByCurrentUser: boolean;
  currentUserReaction?: string;
  groupId?: string;
  groupName?: string;
  groupSlug?: string;
  groupAvatarUrl?: string;
  originalPost?: string;
  attachments?: PostAttachment[];
}
