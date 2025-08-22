
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react'; // Added useState
import Header from '@/components/common/Header';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// This new component will handle the conditional rendering based on auth state
function AppLayoutContent({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false); // New state

  useEffect(() => {
    if (!isLoading) { // Only act when auth state is resolved
      if (!user) {
        // This layout is for authenticated routes.
        // If no user and auth is resolved, redirect to login.
        setIsRedirecting(true); // Indicate that a redirect is being initiated
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page.",
          variant: "default",
        });
        router.replace('/login');
      } else {
        setIsRedirecting(false); // User is present, no redirect needed
      }
    }
  }, [user, isLoading, router, toast]);

  if (isLoading || isRedirecting) { // Show loader if actively loading session OR if redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="sr-only">{isLoading ? "Loading application..." : "Redirecting..."}</p>
      </div>
    );
  }

  // If !isLoading, !isRedirecting, and still no user:
  // This state should ideally be very transient or not reached if the redirect logic works correctly.
  // Returning null ensures that protected content is not flashed.
  if (!user) {
    return null;
  }

  // User is authenticated, and not currently redirecting, render the main app layout
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  // AuthProvider wraps AppLayoutContent so useAuth can be used within AppLayoutContent
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
