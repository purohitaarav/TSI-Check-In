"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background selection:bg-indigo-500/30">
        {/* Sticky Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <span className="font-bold text-sm">R</span>
            </div>
            <h1 className="text-lg font-medium tracking-tight">Check-In</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {user?.displayName || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
