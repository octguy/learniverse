"use client";

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext, AuthContextType, UserProfile } from './AuthContext';
import { authService } from '@/lib/api/authService';
import { userProfileService } from '@/lib/api/userProfileService';
import type { AuthResponse, RegisterRequest } from '@/types/api';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserProfile | null>(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            try {
                return storedUser ? JSON.parse(storedUser) : null;
            } catch (e) {
                console.error("Error parsing user from local", e);
                return null;
            }
        }
        return null;
    });
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await authService.refreshToken({ refreshToken: storedRefreshToken });
            await login(response.data);
        } catch (error) {
            console.error("Refresh token failed, logging out:", error);
            await logout();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);


    const login = async (data: AuthResponse) => {
        const { id, username, email, accessToken, refreshToken, isOnboarded } = data;

        let avatarUrl: string | undefined;
        try {
            sessionStorage.setItem('accessToken', accessToken);
            const profile = await userProfileService.getMyProfile();
            avatarUrl = profile.avatarUrl;
        } catch (error) {
            console.error("Error fetching profile during login:", error);
        }

        const userProfile: UserProfile = {
            id,
            username,
            email,
            isOnboarded: isOnboarded ?? false,
            avatarUrl
        };

        setUser(userProfile);
        setAccessToken(accessToken);

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userProfile));
    };

    const completeOnboarding = () => {
        if (user) {
            const updatedUser = { ...user, isOnboarded: true };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const logout = async () => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            try {
                await authService.logout();
            } catch (error) {
                console.error("Logout API call failed:", error);
            }
        }

        setUser(null);
        setAccessToken(null);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        window.location.href = '/login';
    };

    const register = async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await authService.register(data);
        return response.data;
    };

    const value: AuthContextType = {
        user,
        accessToken,
        loading,
        login,
        logout,
        register,
        completeOnboarding
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};