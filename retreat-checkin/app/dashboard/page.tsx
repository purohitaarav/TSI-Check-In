"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Percent, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.displayName?.split(' ')[0] || "Volunteer"}. Here's what's happening today.
        </p>
      </div>

      {/* Statistics Grid - Responsive with hover lifts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">Registered for the event</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">Currently on site</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">0</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting arrival</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-in Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">0%</div>
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
              placeholder="Search attendees..." 
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex h-9 px-4 rounded-lg items-center justify-center text-sm font-medium">Filter</Badge>
        </div>

        <Card className="min-h-[400px]">
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium">No attendees imported yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
