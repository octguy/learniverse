"use client";

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext, AuthContextType, UserProfile } from './AuthContext';
import { authService } from '@/lib/api/authService';
import { userProfileService } from '@/lib/api/userProfileService';
import type { AuthResponse, RegisterRequest } from '@/types/api';
import { parseJwt } from '@/lib/utils';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserStr = localStorage.getItem('user');
            const storedToken = localStorage.getItem('accessToken');

            if (storedUserStr) {
                try {
                    const storedUser = JSON.parse(storedUserStr);

                    if ((!storedUser.role && !storedUser.roles) && storedToken) {
                        const decoded = parseJwt(storedToken);
                        if (decoded) {
                            const extractedRoles = decoded.roles || decoded.authorities || (decoded.scope ? decoded.scope.split(' ') : []);
                            if (Array.isArray(extractedRoles) && extractedRoles.length > 0) {
                                storedUser.roles = extractedRoles;
                                storedUser.role = extractedRoles.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : extractedRoles[0];
                                localStorage.setItem('user', JSON.stringify(storedUser));
                            } else if (typeof extractedRoles === 'string') {
                                storedUser.roles = [extractedRoles];
                                storedUser.role = extractedRoles;
                                localStorage.setItem('user', JSON.stringify(storedUser));
                            }
                        }
                    }

                    setUser(storedUser);
                } catch (e) {
                    console.error("Error parsing user from local", e);
                }
            }
        }
    }, []);

    const refreshAuth = useCallback(async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedAccessToken = localStorage.getItem('accessToken');

        if (!storedRefreshToken) {
            setLoading(false);
            return;
        }

        if (storedAccessToken) {
            const decoded = parseJwt(storedAccessToken);
            const currentTime = Date.now();
            if (decoded && decoded.exp * 1000 > currentTime + (2 * 60 * 1000)) {
                if (!accessToken) setAccessToken(storedAccessToken);
                setLoading(false);
                return;
            }
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
    }, [accessToken]);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

    useEffect(() => {
        if (!accessToken) return;

        const decoded = parseJwt(accessToken);
        if (!decoded || !decoded.exp) return;

        const expTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpire = expTime - currentTime;

        const bufferTime = 2 * 60 * 1000;
        const delay = timeUntilExpire - bufferTime;

        const timeoutId = setTimeout(() => {
            console.log("Auto refreshing token...");
            refreshAuth();
        }, Math.max(0, delay));

        return () => clearTimeout(timeoutId);
    }, [accessToken, refreshAuth]);


    const login = async (data: AuthResponse) => {
        const { id, username, email, accessToken, refreshToken, isOnboarded } = data;
        let { role, roles } = data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        if ((!role && !roles) && accessToken) {
            const decoded = parseJwt(accessToken);
            if (decoded) {
                const extractedRoles = decoded.roles || decoded.authorities || (decoded.scope ? decoded.scope.split(' ') : []);
                if (Array.isArray(extractedRoles) && extractedRoles.length > 0) {
                    roles = extractedRoles;
                    role = roles.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : extractedRoles[0];
                } else if (typeof extractedRoles === 'string') {
                    roles = [extractedRoles];
                    role = extractedRoles;
                }
            }
        }

        let avatarUrl: string | undefined;
        try {
            const profile = await userProfileService.getMyProfile();
            avatarUrl = profile.avatarUrl;

            if (profile.role) {
                role = profile.role;
                if (!profile.roles || profile.roles.length === 0) {
                    roles = [profile.role];
                } else {
                    roles = profile.roles;
                }
            }
        } catch (error) {
            console.error("Error fetching profile during login:", error);
        }

        const userProfile: UserProfile = {
            id,
            username,
            email,
            isOnboarded: isOnboarded ?? false,
            avatarUrl,
            role,
            roles
        };

        setUser(userProfile);
        setAccessToken(accessToken);

        localStorage.setItem('user', JSON.stringify(userProfile));

        return userProfile;
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

    useEffect(() => {
        const fetchLatestProfile = async () => {
            if (!accessToken) return;

            try {
                const profile = await userProfileService.getMyProfile();
                setUser(prev => {
                    if (!prev) return null;
                    const updated = {
                        ...prev,
                        avatarUrl: profile.avatarUrl,
                        username: profile.user?.username || prev.username,
                        email: profile.user?.email || prev.email,
                        role: profile.role || prev.role,
                        roles: profile.roles || prev.roles || prev.roles
                    };
                    localStorage.setItem('user', JSON.stringify(updated));
                    return updated;
                });
            } catch (error) {
                console.error("Background profile sync failed:", error);
            }
        };

        fetchLatestProfile();
    }, [accessToken]);

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