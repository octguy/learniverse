import { CreatePostTrigger } from "@/components/post/CreatePostTrigger";
import { PostCard } from "@/components/post/PostCard";
import type { Post } from "@/types/post";

const mockPost: Post = {
  id: "post_1",
  author: {
    id: "user_1",
    username: "Lê Bùi Quốc Huy",
    avatarUrl: "https://github.com/shadcn.png",
  },
  contentType: "POST",
  status: "PUBLISHED",
  title: "Giới thiệu về LaTeX và Markdown",
  body: `
Bài viết mẫu hỗ trợ **Markdown**.

## Công thức Toán học (LaTeX)

Bạn có thể viết công thức inline như $E=mc^2$.

Hoặc viết ở chế độ display (block):

$$
\\int_a^b f(x) \\, dx = F(b) - F(a)
$$

## Định dạng Code

\`\`\`tsx
import React from "react";

function HelloWorld() {
  return <div>Hello, World!</div>;
}
\`\`\`
  `,
  slug: "gioi-thieu-latex-markdown",
  viewCount: 102,
  commentCount: 5,
  reactionCount: 12,
  bookmarkCount: 3,
  shareCount: 1,
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  updatedAt: new Date().toISOString(),
  publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  lastEditedAt: new Date().toISOString(),
  tags: [
    { id: "tag_1", name: "Toán học", slug: "toan-hoc" },
    { id: "tag_2", name: "Markdown", slug: "markdown" },
  ],
  attachments: [
    {
      id: "att_1",
      fileName: "Demo-Image.jpg",
      fileType: "IMAGE",
      mimeType: "image/jpeg",
      storageUrl: "/login-banner.jpg",
    },
    {
      id: "att_2",
      fileName: "Demo-Document.pdf",
      fileType: "PDF",
      mimeType: "application/pdf",
      storageUrl: "#",
    },
  ],
  bookmarkedByCurrentUser: false,
  currentUserReaction: null,
};

export default function MainPage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <CreatePostTrigger />
      <PostCard post={mockPost} />
    </div>
  );
}