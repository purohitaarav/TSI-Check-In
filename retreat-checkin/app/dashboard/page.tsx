"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Percent, Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { firestoreService } from "@/lib/services/firestore";
import { Attendee } from "@/types";
import { AttendeeList } from "@/components/AttendeeList";
import { ImportAttendeesModal } from "@/components/ImportAttendeesModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // We are assuming a single "default-event" for MVP
  const EVENT_ID = "default-event";

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const data = await firestoreService.getAttendeesForEvent(EVENT_ID);
      setAttendees(data);
    } catch (error) {
      console.error("Failed to fetch attendees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

  const totalAttendees = attendees.length;
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const pendingCount = totalAttendees - checkedInCount;
  const checkinRate = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.displayName?.split(' ')[0] || "Volunteer"}. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsImportModalOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{loading ? "-" : totalAttendees}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered for the event</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{loading ? "-" : checkedInCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently on site</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{loading ? "-" : pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting arrival</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-in Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{loading ? "-" : `${checkinRate}%`}</div>
            <p className="text-xs text-muted-foreground mt-1">Of total registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Search & Attendee List Area */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="sticky top-[80px] z-20 flex items-center gap-4 bg-background/95 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendees..." 
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex h-9 px-4 rounded-lg items-center justify-center text-sm font-medium">Filter</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          </div>
        ) : (
          <AttendeeList attendees={attendees} searchQuery={searchQuery} />
        )}
      </div>

      <ImportAttendeesModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchAttendees} 
        eventId={EVENT_ID}
      />
    </div>
  );
}
