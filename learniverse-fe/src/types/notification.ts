export enum NotificationType {
  LIKE_POST = "LIKE_POST",
  COMMENT_POST = "COMMENT_POST",
  FRIEND_REQUEST = "FRIEND_REQUEST",
  ACCEPT_FRIEND_REQUEST = "ACCEPT_FRIEND_REQUEST",
}

export interface Notification {
  id: string;
  content: string;
  notificationType: NotificationType | string;
  isRead: boolean;
  relatedEntityId: string;
  relatedEntityType: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
}