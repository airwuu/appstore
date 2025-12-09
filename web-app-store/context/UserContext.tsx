"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the User type matching our DB
export interface User {
    user_id: number;
    username: string;
    app_ids: number[];
}

interface UserContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    installApp: (appId: number) => void;
    uninstallApp: (appId: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('appstore_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('appstore_user');
            }
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('appstore_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('appstore_user');
    };

    const installApp = (appId: number) => {
        if (!user) return;
        const updatedUser = { ...user, app_ids: [...(user.app_ids || []), appId] };
        setUser(updatedUser);
        localStorage.setItem('appstore_user', JSON.stringify(updatedUser));
    };

    const uninstallApp = (appId: number) => {
        if (!user) return;
        const updatedUser = { ...user, app_ids: (user.app_ids || []).filter(id => id !== appId) };
        setUser(updatedUser);
        localStorage.setItem('appstore_user', JSON.stringify(updatedUser));
    };

    return (
        <UserContext.Provider value={{ user, login, logout, installApp, uninstallApp }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
