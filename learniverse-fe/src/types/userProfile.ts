export interface UserTag {
    id: string;
    name: string;
}

export interface UserProfileResponse {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    coverUrl?: string;
    postCount: number;
    answeredQuestionCount: number;
    tags: UserTag[];
}

export interface UpdateProfileRequest {
    displayName?: string;
    bio?: string;
    avatar?: File;
    coverImage?: File;
    userTags?: string[];
}