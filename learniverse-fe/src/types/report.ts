import { PageResponse } from "./api";

export type ReportType = 'POST' | 'QUESTION' | 'ANSWER' | 'COMMENT';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type ReportReason = 'OTHER' | 'INAPPROPRIATE' | 'HARASSMENT' | 'TOXIC' | 'SPAM' | 'DUPLICATE' | 'OFF_TOPIC' | 'COPYRIGHT';

export interface Reporter {
    id: string;
    username: string;
    avatarUrl: string;
}

export interface ReportDTO {
    id: string;
    reporter: Reporter;
    reportableType: ReportType;
    reportableId: string;
    reason: string;
    description: string;
    status: ReportStatus;
    actionTaken: string;
    moderatorNote?: string;
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: Reporter;
    
    // Detail fields (may be undefined in list view)
    targetTitle?: string;
    targetBody?: string;
    targetAuthor?: Reporter;
    targetCreatedAt?: string;
    previousReportCount?: number;
}

export interface CreateReportRequest {
    reportableType: ReportType;
    reportableId: string;
    reason: string;
    description: string;
}

export interface ResolveReportRequest {
    status: ReportStatus;
    actionTaken: string;
    moderatorNote: string;
}

export type ReportResponse = PageResponse<ReportDTO>;
