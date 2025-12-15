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
}