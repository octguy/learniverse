"use client";

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext, AuthContextType, UserProfile } from './AuthContext';
import { authService } from '@/lib/api/authService';
import type { AuthResponse, RegisterRequest } from '@/types/api';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        const storedRefreshToken = sessionStorage.getItem('refreshToken');

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
    // eslint-disable-line react-hooks/exhaustive-deps


    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);


    const login = async (data: AuthResponse) => {
        const { id, username, email, accessToken, refreshToken } = data;

        const userProfile: UserProfile = { id, username, email };

        setUser(userProfile);
        setAccessToken(accessToken);

        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
        sessionStorage.setItem('user', JSON.stringify(userProfile));
    };

    const logout = async () => {
        const token = sessionStorage.getItem('accessToken');

        if (token) {
            try {
                await authService.logout();
            } catch (error) {
                console.error("Logout API call failed:", error);
            }
        }

        setUser(null);
        setAccessToken(null);

        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');

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
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};