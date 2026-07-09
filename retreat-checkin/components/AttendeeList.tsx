"use client";

import { Attendee } from "@/types";
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
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Group</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(attendee => (
                <tr 
                  key={attendee.id} 
                  className="hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => onSelectAttendee?.(attendee)}
                >
                  <td className="px-5 py-3 font-medium text-foreground">{attendee.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{groupMap.get(attendee.registrationGroupId) || "Unknown Group"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <div className="flex flex-col">
                      {attendee.email && <span>{attendee.email}</span>}
                      {attendee.phone && <span className="opacity-70">{attendee.phone}</span>}
                      {!attendee.email && !attendee.phone && <span className="opacity-40">-</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end">
                      <QuickCheckInButton 
                        attendee={attendee} 
                        onCheckIn={onCheckIn} 
                        isCheckingIn={isCheckingIn} 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map(attendee => (
          <Card key={attendee.id} className="overflow-hidden cursor-pointer" onClick={() => onSelectAttendee?.(attendee)}>
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex flex-col">
                <p className="font-semibold text-base">{attendee.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{groupMap.get(attendee.registrationGroupId)}</p>
                
                {(attendee.email || attendee.phone) && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {attendee.email && <div>{attendee.email}</div>}
                    {attendee.phone && <div>{attendee.phone}</div>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
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
