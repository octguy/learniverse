export type PostResponse = Post;

export interface BookmarkResponse {
  id: string;
  userId: string;
  postSummary?: Post;
  questionSummary?: Record<string, any>;
  collectionName?: string;
  notes?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
export enum ContentVisibility {
  PUBLIC = "PUBLIC",
  FRIENDS_ONLY = "FRIENDS_ONLY",
  PRIVATE = "PRIVATE",
  GROUP = "GROUP"
}

export interface CreatePostRequest {
  title: string;
  body: string;
  tagIds: string[];
  status?: "DRAFT" | "PUBLISHED";
  visibility?: ContentVisibility;
  groupId?: string;
}

export interface UpdatePostRequest extends CreatePostRequest {
  attachmentsToDelete?: string[];
  visibility?: ContentVisibility;
  editReason?: string;
}
export type PostAuthor = {
  id: string;
  username: string;
  avatarUrl: string;
  avatar?: string;
};

export type PostTag = {
  id: string;
  name: string;
  slug: string;
};

export type AttachmentType = "IMAGE" | "PDF" | "OTHER";

export type PostAttachment = {
  id: string;
  fileName: string;
  fileType: AttachmentType;
  mimeType: string;
  storageUrl: string;
};

export type Post = {
  id: string;
  author: PostAuthor;
  contentType: "POST" | "QUESTION" | "SHARED_POST";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  body: string;
  slug: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  bookmarkCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  lastEditedAt?: string;
  tags: PostTag[];
  attachments: PostAttachment[];
  bookmarkedByCurrentUser: boolean;
  currentUserReaction: string | null;
  visibility: ContentVisibility;
  groupId?: string;
  groupName?: string;
  groupSlug?: string;
  originalPost?: Post;
  groupAvatarUrl?: string;
};