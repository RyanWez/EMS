
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import type { SessionUser } from '@/actions/auth'; // Assuming SessionUser is exported from auth actions
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
  refetchSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const sessionData = await response.json();
        setUser(sessionData.user || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = async () => {
    try {
      // Call the server action or API route to clear the cookie
      // Option 1: Call API route
      await fetch('/api/auth/logout', { method: 'POST' });
      // Option 2: Directly call server action (if preferred and works with your setup)
      // const { logoutUserAction } = await import('@/actions/auth');
      // await logoutUserAction();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if server logout fails, clear client state and redirect
    } finally {
      setUser(null);
      router.push('/login'); // Redirect to login page
    }
  };

  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permissionId);
  }, [user]);


  return (
    <AuthContext.Provider value={{ user, isLoading, logout, hasPermission, refetchSession: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}
