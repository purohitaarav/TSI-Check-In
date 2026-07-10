"use client";

import { Attendee } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2 } from "lucide-react";

interface QuickCheckInButtonProps {
  attendee: Attendee;
  onCheckIn: (attendeeId: string) => void;
  isCheckingIn: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function QuickCheckInButton({ attendee, onCheckIn, isCheckingIn, className = "", size = "sm" }: QuickCheckInButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attendee.checkedIn && !isCheckingIn) {
      onCheckIn(attendee.id);
    }
  };

  if (attendee.checkedIn) {
    return (
      <div className={`flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 ${className}`}>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">Checked In</span>
        {attendee.checkedInAt && (
          <span className="text-xs opacity-70 ml-1 hidden lg:inline-block whitespace-nowrap">
            {new Date(attendee.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    );
  }

  return (
    <Button
      size={size}
      onClick={handleClick}
      disabled={isCheckingIn}
      className={`gap-1.5 ${className}`}
    >
      <Check className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">Check In</span>
    </Button>
  );
}
