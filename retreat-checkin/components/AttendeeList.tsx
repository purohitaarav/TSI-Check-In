"use client";

import { Attendee } from "@/types/index";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { QuickCheckInButton } from "./QuickCheckInButton";

interface AttendeeListProps {
  attendees: Attendee[];
  searchQuery: string;
  groupMap: Map<string, string>;
  onSelectAttendee?: (attendee: Attendee) => void;
  onCheckIn: (attendeeId: string) => void;
  isCheckingIn: boolean;
}

export function AttendeeList({
  attendees,
  searchQuery,
  groupMap,
  onSelectAttendee,
  onCheckIn,
  isCheckingIn
}: AttendeeListProps) {

  const filtered = attendees.filter(a => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return a.searchName.includes(query) || (a.email && a.email.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    return (
      <Card className="min-h-[300px]">
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No attendees found.</p>
        </CardContent>
      </Card>
    );
  }

  const getFieldValue = (attendee: Attendee, field: string) => {
    const lField = field.toLowerCase();
    if (lField === "name" || lField === "full name" || lField === "primary guest name") return attendee.name;
    if (lField === "email" || lField === "e-mail") return attendee.email || "";
    if (lField === "phone" || lField === "mobile") return attendee.phone || "";
    return attendee.registrationData?.[field] || "";
  };

  return (
    <div className="flex flex-col">
      {/* Desktop Card View */}
      <div className="hidden md:flex md:flex-col gap-3 px-8">
        {filtered.map(attendee => (
          <Card key={attendee.id} className="overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all" onClick={() => onSelectAttendee?.(attendee)}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-6">
                <div className="flex flex-col">
                  <p className="font-semibold text-base">{attendee.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{groupMap.get(attendee.registrationGroupId)}</p>
                </div>

                {(attendee.email || attendee.phone) && (
                  <div className="text-sm text-muted-foreground">
                    {attendee.email && <div>{attendee.email}</div>}
                    {attendee.phone && <div>{attendee.phone}</div>}
                  </div>
                )}
              </div>

              <QuickCheckInButton
                attendee={attendee}
                onCheckIn={onCheckIn}
                isCheckingIn={isCheckingIn}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map(attendee => (
          <Card key={attendee.id} className="overflow-hidden cursor-pointer" onClick={() => onSelectAttendee?.(attendee)}>
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex flex-col">
                <p className="font-semibold text-base">{attendee.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{groupMap.get(attendee.registrationGroupId)}</p>

                {(attendee.email || attendee.phone) && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {attendee.email && <div>{attendee.email}</div>}
                    {attendee.phone && <div>{attendee.phone}</div>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                <QuickCheckInButton
                  attendee={attendee}
                  onCheckIn={onCheckIn}
                  isCheckingIn={isCheckingIn}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
