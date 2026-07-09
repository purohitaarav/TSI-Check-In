"use client";

import { Attendee } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2 } from "lucide-react";

interface AttendeeListProps {
  attendees: Attendee[];
  searchQuery: string;
}

export function AttendeeList({ attendees, searchQuery }: AttendeeListProps) {
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

  return (
    <div className="flex flex-col gap-3">
      {filtered.map(attendee => (
        <Card key={attendee.id} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {attendee.firstName[0]}{attendee.lastName[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                  {attendee.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {attendee.email || "No email provided"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {attendee.checkedIn ? (
                <Badge variant="success" className="gap-1.5 hidden sm:inline-flex">
                  <CheckCircle2 className="h-3 w-3" />
                  Checked In
                </Badge>
              ) : (
                <Badge variant="secondary" className="hidden sm:inline-flex">Pending</Badge>
              )}
              
              <div className="sm:hidden">
                {attendee.checkedIn ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
