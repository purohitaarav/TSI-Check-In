"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, ShieldOff } from "lucide-react";

export default function LoginPage() {
  const { user, loading, authStatus, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (authStatus === "authorized") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      // AuthProvider will handle the result — if unauthorized, authStatus becomes "unauthorized"
    } catch (error) {
      console.error(error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || authStatus === "loading" || authStatus === "authorized") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
      </div>
    );
  }

  // Show Access Denied on the login page if sign-in was attempted but failed authorization
  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-4 dark:bg-slate-950/50">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-center flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <ShieldOff className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Access Denied
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Your Google account is not authorized to access this application.
              If you believe this is an error, please contact an administrator.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? "Trying..." : "Try a different account"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-4 dark:bg-slate-950/50">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Retreat Check-In</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Secure volunteer access portal
          </p>
        </div>
        
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-lg font-medium">Welcome back</CardTitle>
            <CardDescription className="text-sm">Sign in with your Google account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSignIn} 
              disabled={isSigningIn}
              className="w-full py-6 text-sm font-medium shadow-sm transition-all"
              size="lg"
            >
              {isSigningIn ? "Signing in..." : "Sign in with Google"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
