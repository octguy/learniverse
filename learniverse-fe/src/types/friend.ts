import { UserProfile } from "./userProfile";

export enum FriendStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED", 
    NONE = "NONE"
}


export type Friend = UserProfile;

export interface Tag {
  id: string;
  name: string;
  slug?: string;
}

export interface SuggestedFriend {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  postCount: number;
  answeredQuestionCount: number;
  interestTags: Tag[] | null;
  skillTags: Tag[] | null;
  role: "USER" | "ADMIN" | null;
}