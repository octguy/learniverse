"use client";

import { createContext, useContext } from 'react';
import type { AuthResponse, RegisterRequest } from '@/types/api';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
}

export interface AuthContextType {
    user: UserProfile | null;
    accessToken: string | null;
    loading: boolean;
    login: (data: AuthResponse) => Promise<void>;
    logout: () => void;
    register: (data: RegisterRequest) => Promise<AuthResponse>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};