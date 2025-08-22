
'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loginUser, type LoginState } from '@/actions/auth';
import { getUserProfileImage } from '@/ai/flows/userProfileFlows';
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

const DEFAULT_USER_ID = 'default_user';

const initialState: LoginState = {
  success: false,
  message: '',
};

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full text-base py-3" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
      Login
    </Button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'EMS';
  const [showPassword, setShowPassword] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  const [state, formAction] = useActionState(loginUser, initialState);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Login Successful',
        description: 'Preparing your dashboard...',
        variant: 'success',
      });
      setShowLoadingScreen(true);

      const preloadData = async () => {
        try {
          console.log('[LoginPage] Preloading profile image...');
          // Use the actual user ID from the successful login state if available
          const userIdForImage = state.user?.id || DEFAULT_USER_ID;
          await getUserProfileImage({ userId: userIdForImage });
          console.log('[LoginPage] Profile image preloading attempted for user:', userIdForImage);
        } catch (error) {
          console.error('[LoginPage] Error preloading profile image:', error);
        }
      };

      preloadData();

      const timer = setTimeout(() => {
        if (state.redirectTo) {
          router.push(state.redirectTo);
        } else {
          router.push('/dashboard');
        }
      }, 800);

      return () => clearTimeout(timer);
    } else if (!state?.success && state?.message && state.message !== '' && state.message !== initialState.message) {
      // General errors or specific 'Invalid username or password'
      toast({
        title: 'Login Failed',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, router, toast]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (showLoadingScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-50 p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-2xl font-semibold text-foreground">Loading Data...</p>
        <p className="text-md text-muted-foreground mt-2">Please wait while we prepare your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl rounded-lg">
        <CardHeader className="text-center relative pt-6 pb-4">
          <div className="absolute top-2 right-2">
            <ThemeToggleButton />
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Login to {appName}</CardTitle>
          <CardDescription className="mt-2 text-sm sm:text-base text-muted-foreground">
            Enter your credentials to access the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="text-base"
                aria-describedby="username-error"
              />
              {state?.errors?.username && (
                <p id="username-error" className="text-sm font-medium text-destructive">
                  {state.errors.username.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="text-base pr-10"
                  aria-describedby="password-error"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {state?.errors?.password && (
                <p id="password-error" className="text-sm font-medium text-destructive">
                  {state.errors.password.join(', ')}
                </p>
              )}
            </div>

            {state?.errors?.general && (
              <p className="text-sm font-medium text-destructive text-center">
                {state.errors.general.join(', ')}
              </p>
            )}

            {!state?.success &&
              state?.message &&
              state.message !== initialState.message &&
              !state?.errors?.general &&
              !state?.errors?.username &&
              !state?.errors?.password && (
                <p className="text-sm font-medium text-destructive text-center">{state.message}</p>
              )}
            <LoginButton />
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 w-full max-w-md">
        <Card className="bg-muted/50 border-dashed">
            <CardHeader className="p-4">
                <CardTitle className="text-base text-center">Default Credentials</CardTitle>
            </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="text-center">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-background/50 rounded px-3 py-2">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono font-medium">User</span>
                </div>
                <div className="flex justify-between items-center bg-background/50 rounded px-3 py-2">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-mono font-medium">User123</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">The 'Admin' user is auto-created on first Admin login.</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
