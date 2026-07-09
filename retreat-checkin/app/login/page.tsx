"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setIsSigningIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
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
