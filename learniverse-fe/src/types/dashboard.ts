export interface DashboardStatsResponse {
    totalUsers: number;
    newUsersToday: number;
    totalPosts: number;
    totalQuestions: number;
}

export interface GrowthDataPoint {
    label: string;
    count: number;
}

export interface UserGrowthResponse {
    period: string;
    data: GrowthDataPoint[];
}

export interface ComparisonDataPoint {
    label: string;
    postCount: number;
    questionCount: number;
}

export interface ContentComparisonResponse {
    period: string;
    data: ComparisonDataPoint[];
}

export interface TopTagResponse {
    id: string;
    name: string;
    slug: string;
    usageCount: number;
}

export interface NewUserResponse {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    status: string;
}
