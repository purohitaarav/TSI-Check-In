"use client";

import { useAuth } from "./providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authStatus, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // Loading
  if (authStatus === "loading") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
      </div>
    );
  }

  // Unauthorized — show Access Denied
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
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Unauthenticated — render nothing (redirect in effect)
  if (authStatus === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
