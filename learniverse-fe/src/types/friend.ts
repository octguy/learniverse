import { UserProfile } from "./userProfile";

export enum FriendStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED", 
    NONE = "NONE"
}


export type Friend = UserProfile;