import { PostAuthor } from "./post";

export interface Comment {
  id: string;
  body: string;
  author: PostAuthor;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  parentId?: string;
  isEdited: boolean;
  reactionCount: number;
  currentUserReaction: string | null;
  commentableId?: string;
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  INSIGHTFUL = 'INSIGHTFUL',
  HELPFUL = 'HELPFUL',
  CURIOUS = 'CURIOUS'
}