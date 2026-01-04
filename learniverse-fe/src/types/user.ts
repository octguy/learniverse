export interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    status: "PENDING_VERIFICATION" | "ACTIVE" | string;
    enabled: boolean;
    lastLoginAt: string | null;
    onboarded: boolean;
}
