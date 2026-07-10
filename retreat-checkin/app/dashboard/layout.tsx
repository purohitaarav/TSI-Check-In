"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEvent } from "@/components/providers/EventProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EventSettingsModal } from "@/components/EventSettingsModal";
import { useState, useEffect } from "react";

import { Download, ArrowLeftRight, RefreshCw } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const { selectedEvent, clearEvent } = useEvent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings-modal', handleOpenSettings);
    return () => window.removeEventListener('open-settings-modal', handleOpenSettings);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background selection:bg-indigo-500/30">
        {/* Sticky Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <span className="font-bold text-sm">R</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-medium tracking-tight leading-tight">Check-In</h1>
              {selectedEvent && (
                <span className="text-xs text-muted-foreground">{selectedEvent.name}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedEvent && (
              <>
                <Button onClick={() => window.dispatchEvent(new Event('open-import-modal'))} variant="ghost" size="sm" className="hidden md:flex gap-2 h-9 text-muted-foreground hover:text-foreground">
                  <Download className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Import CSV</span>
                </Button>
                <Button onClick={clearEvent} variant="ghost" size="sm" className="hidden md:flex gap-2 h-9 text-muted-foreground hover:text-foreground">
                  <ArrowLeftRight className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Change Event</span>
                </Button>
                <div className="h-4 w-px bg-border hidden md:block mx-1" />
              </>
            )}
            <Button onClick={() => setIsSettingsOpen(true)} className="gap-2 h-9" size="sm">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Sync</span>
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <ThemeToggle />
            <div className="h-4 w-px bg-border hidden sm:block mx-1" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {user?.displayName || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-full mx-auto p-2 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
          {children}
        </main>
        
        <EventSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </div>
    </ProtectedRoute>
  );
}
