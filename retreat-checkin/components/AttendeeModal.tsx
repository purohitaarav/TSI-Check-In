"use client";

import { Attendee } from "@/types";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, User, Mail, Phone, Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface AttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendee: Attendee | null;
  groupName: string;
  onCheckIn: (attendeeId: string) => void;
  onUndoCheckIn?: (attendeeId: string) => void;
  isCheckingIn: boolean;
  visibleFields?: string[] | null;
}

export function AttendeeModal({ isOpen, onClose, attendee, groupName, onCheckIn, onUndoCheckIn, isCheckingIn, visibleFields }: AttendeeModalProps) {
  const [isConfirmingUndo, setIsConfirmingUndo] = useState(false);
  
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirmingUndo(false);
    }
  }, [isOpen]);

  if (!isOpen || !attendee) return null;

  let regDataEntries = attendee.registrationData 
    ? Object.entries(attendee.registrationData).filter(([k, v]) => v !== null && v !== undefined && v !== "")
    : [];

  if (visibleFields && visibleFields.length > 0) {
    regDataEntries = regDataEntries.filter(([k]) => visibleFields.includes(k));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-background sm:rounded-xl rounded-t-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Attendee Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          
          {/* Primary Info Card */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start p-4 sm:p-5 rounded-xl border border-border bg-card">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
              {attendee.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div>
                <h3 className="text-lg font-semibold">{attendee.name}</h3>
                <p className="text-sm text-muted-foreground font-medium">{groupName}</p>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-2">
                {attendee.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{attendee.email}</span>
                  </div>
                )}
                {attendee.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{attendee.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-2 sm:mt-0">
              {attendee.checkedIn ? (
                <Badge variant="success" className="gap-1.5 px-3 py-1 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Checked In
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">Pending</Badge>
              )}
            </div>
          </div>

          {/* Registration Data */}
          {regDataEntries.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Registration Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regDataEntries.map(([key, value]) => {
                  // Skip displaying standard fields here if they are already in the top card, 
                  // but for the sake of completeness as requested ("dynamically display every field stored"), 
                  // we'll render all of them unless they explicitly match our main structured fields.
                  const lowerKey = key.toLowerCase();
                  if (
                    lowerKey === "name" || lowerKey === "full name" || 
                    lowerKey === "email" || lowerKey === "phone"
                  ) {
                    return null;
                  }
                  
                  return (
                    <div key={key} className="flex flex-col p-3 rounded-lg border border-border bg-muted/30">
                      <span className="text-xs text-muted-foreground mb-1">{key}</span>
                      <span className="text-sm font-medium break-words">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Details (if checked in) */}
          {attendee.checkedIn && attendee.checkedInAt && (
             <div className="flex flex-col gap-3 mt-2">
               <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Check-in Details</h4>
               <div className="flex flex-col gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Checked in at:</span>
                    <span>{new Date(attendee.checkedInAt).toLocaleString()}</span>
                  </div>
                  {attendee.checkedInBy && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Processed by:</span>
                      <span className="font-mono text-xs opacity-80 truncate">{attendee.checkedInBy}</span>
                    </div>
                  )}
               </div>
             </div>
          )}
          
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-border bg-muted/20">
          {!attendee.checkedIn ? (
            <Button 
              className="w-full sm:w-auto sm:float-right h-12 sm:h-10 text-base sm:text-sm font-semibold gap-2" 
              size="lg"
              onClick={() => onCheckIn(attendee.id)}
              disabled={isCheckingIn}
            >
              <Check className="h-5 w-5" />
              {isCheckingIn ? "Processing..." : "Check In Attendee"}
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:float-right">
              {onUndoCheckIn && (
                isConfirmingUndo ? (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="destructive"
                      className="flex-1 sm:flex-none h-12 sm:h-10 font-medium" 
                      onClick={() => {
                        onUndoCheckIn(attendee.id);
                        setIsConfirmingUndo(false);
                      }}
                      disabled={isCheckingIn}
                    >
                      Confirm Undo
                    </Button>
                    <Button 
                      variant="ghost"
                      className="flex-1 sm:flex-none h-12 sm:h-10 font-medium" 
                      onClick={() => setIsConfirmingUndo(false)}
                      disabled={isCheckingIn}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-10 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" 
                    onClick={() => setIsConfirmingUndo(true)}
                    disabled={isCheckingIn}
                  >
                    Undo Check-In
                  </Button>
                )
              )}
              {!isConfirmingUndo && (
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto h-12 sm:h-10 font-medium" 
                  onClick={onClose}
                >
                  Close
                </Button>
              )}
            </div>
          )}
          <div className="clear-both"></div>
        </div>

      </div>
    </div>
  );
}
