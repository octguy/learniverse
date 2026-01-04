"use client";

import { createContext, useContext } from 'react';
import type { AuthResponse, RegisterRequest } from '@/types/api';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    isOnboarded: boolean;
    avatarUrl?: string;
    role?: string;
    roles?: string[];
}

export interface AuthContextType {
    user: UserProfile | null;
    accessToken: string | null;
    loading: boolean;
    login: (data: AuthResponse) => Promise<UserProfile>;
    logout: () => void;
    register: (data: RegisterRequest) => Promise<AuthResponse>;
    completeOnboarding: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};