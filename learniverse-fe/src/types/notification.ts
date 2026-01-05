export enum NotificationType {
  COMMENT = "COMMENT",
  REPLY = "REPLY",
  MENTION = "MENTION",
  LIKE = "LIKE",
  BOOKMARK = "BOOKMARK",
  FRIEND_REQUEST = "FRIEND_REQUEST",
  FRIEND_ACCEPT = "FRIEND_ACCEPT",
  GROUP_INVITE = "GROUP_INVITE",
  GROUP_JOIN_ACCEPT = "GROUP_JOIN_ACCEPT",
  POST_SHARE = "POST_SHARE",
  REPORT = "REPORT",
  ANSWER = "ANSWER",
  ANSWER_ACCEPTED = "ANSWER_ACCEPTED",
  VOTE = "VOTE"
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