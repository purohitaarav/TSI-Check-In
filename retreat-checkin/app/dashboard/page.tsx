"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Percent, Search, Download, Pencil, Check, X, Trash2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { firestoreService } from "@/lib/services/firestore";
import { Attendee, RegistrationGroup } from "@/types";
import { AttendeeList } from "@/components/AttendeeList";
import { ImportAttendeesModal } from "@/components/ImportAttendeesModal";
import { AttendeeModal } from "@/components/AttendeeModal";
import { FieldCustomizationModal } from "@/components/FieldCustomizationModal";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [groups, setGroups] = useState<RegistrationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldModalGroup, setFieldModalGroup] = useState<RegistrationGroup | null>(null);

  const EVENT_ID = "default-event";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedAttendees, fetchedGroups] = await Promise.all([
        firestoreService.getAttendeesForEvent(EVENT_ID),
        firestoreService.getRegistrationGroups(EVENT_ID)
      ]);
      setAttendees(fetchedAttendees);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabFilteredAttendees = useMemo(() => {
    if (activeTab === "all") return attendees;
    return attendees.filter(a => a.registrationGroupId === activeTab);
  }, [attendees, activeTab]);

  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach(g => map.set(g.id, g.name));
    return map;
  }, [groups]);

  const totalAttendees = tabFilteredAttendees.length;
  const checkedInCount = tabFilteredAttendees.filter(a => a.checkedIn).length;
  const pendingCount = totalAttendees - checkedInCount;
  const checkinRate = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  const handleRenameSubmit = async (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    try {
      await firestoreService.renameRegistrationGroup(EVENT_ID, groupId, editingGroupName.trim());
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: editingGroupName.trim() } : g));
      setEditingGroupId(null);
    } catch (error) {
      console.error("Failed to rename group", error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? All attendees in this group will be deleted as well.")) {
      return;
    }
    
    try {
      await firestoreService.deleteRegistrationGroup(EVENT_ID, groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setAttendees(prev => prev.filter(a => a.registrationGroupId !== groupId));
      setEditingGroupId(null);
      if (activeTab === groupId) {
        setActiveTab("all");
      }
    } catch (error) {
      console.error("Failed to delete group", error);
    }
  };

  const handleCheckIn = async (attendeeId: string) => {
    if (!user) return;
    setIsCheckingIn(true);
    try {
      await firestoreService.checkInAttendee(EVENT_ID, attendeeId, user.uid);
      setAttendees(prev => prev.map(a => {
        if (a.id === attendeeId) {
          return {
            ...a,
            checkedIn: true,
            checkedInAt: new Date().toISOString(),
            checkedInBy: user.uid
          };
        }
        return a;
      }));
      
      if (selectedAttendee?.id === attendeeId) {
        setSelectedAttendee(prev => prev ? {
          ...prev,
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
          checkedInBy: user.uid
        } : null);
      }
    } catch (error) {
      console.error("Failed to check in attendee:", error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getAvailableFieldsForGroup = (groupId: string) => {
    const groupAttendees = attendees.filter(a => a.registrationGroupId === groupId);
    const fields = new Set<string>();
    groupAttendees.forEach(a => {
      if (a.registrationData) {
        Object.keys(a.registrationData).forEach(k => fields.add(k));
      }
    });
    return Array.from(fields);
  };

  const handleOpenFieldModal = (group: RegistrationGroup) => {
    setFieldModalGroup(group);
    setIsFieldModalOpen(true);
  };

  const handleSaveFields = async (fields: string[]) => {
    if (!fieldModalGroup) return;
    try {
      await firestoreService.updateRegistrationGroupFields(EVENT_ID, fieldModalGroup.id, fields);
      setGroups(prev => prev.map(g => g.id === fieldModalGroup.id ? { ...g, visibleFields: fields } : g));
      setIsFieldModalOpen(false);
    } catch (error) {
      console.error("Failed to update fields:", error);
    }
  };

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

      {/* Tabs and Search Area */}
      <div className="flex flex-col gap-4 mt-4">
        {/* Dynamic Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === "all" 
                ? "bg-primary text-primary-foreground shadow" 
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            All Attendees
          </button>
          
          {groups.map(group => {
            const isActive = activeTab === group.id;
            const isEditing = editingGroupId === group.id;
            
            return (
              <div 
                key={group.id}
                className={cn(
                  "flex items-center rounded-full transition-colors group/tab",
                  isActive ? "bg-primary shadow" : "bg-muted hover:bg-muted/80",
                  isEditing ? "px-2 py-1" : "px-4 py-2 cursor-pointer"
                )}
                onClick={() => {
                  if (!isEditing) setActiveTab(group.id);
                }}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(group.id);
                        if (e.key === 'Escape') setEditingGroupId(null);
                      }}
                      className="bg-background text-foreground text-sm rounded px-2 py-1 w-32 outline-none focus:ring-2 focus:ring-ring"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRenameSubmit(group.id); }}
                      className="p-1 rounded hover:bg-primary/20 text-primary-foreground"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }}
                      className="p-1 rounded hover:bg-primary/20 text-primary-foreground"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-primary-foreground/30 mx-1"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                      className="p-1 rounded hover:bg-destructive/80 bg-destructive/50 text-destructive-foreground transition-colors"
                      title="Delete group and all attendees"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}>
                      {group.name}
                    </span>
                    {isActive && (
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroupId(group.id);
                            setEditingGroupName(group.name);
                          }}
                          className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors text-primary-foreground/70 hover:text-primary-foreground"
                          title="Rename group"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFieldModal(group);
                          }}
                          className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors text-primary-foreground/70 hover:text-primary-foreground"
                          title="Group Settings"
                        >
                          <Settings className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
          <AttendeeList 
            attendees={tabFilteredAttendees} 
            searchQuery={searchQuery} 
            groupMap={groupMap} 
            onSelectAttendee={(attendee) => setSelectedAttendee(attendee)}
            onCheckIn={handleCheckIn}
            isCheckingIn={isCheckingIn}
          />
        )}
      </div>

      <ImportAttendeesModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchData} 
        eventId={EVENT_ID}
      />

      <AttendeeModal 
        isOpen={!!selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
        attendee={selectedAttendee}
        groupName={selectedAttendee ? (groupMap.get(selectedAttendee.registrationGroupId) || "Unknown Group") : ""}
        onCheckIn={handleCheckIn}
        isCheckingIn={isCheckingIn}
        visibleFields={selectedAttendee ? groups.find(g => g.id === selectedAttendee.registrationGroupId)?.visibleFields : undefined}
      />

      {fieldModalGroup && (
        <FieldCustomizationModal
          isOpen={isFieldModalOpen}
          onClose={() => setIsFieldModalOpen(false)}
          groupName={fieldModalGroup.name}
          availableFields={getAvailableFieldsForGroup(fieldModalGroup.id)}
          initialSelectedFields={fieldModalGroup.visibleFields || []}
          onSave={handleSaveFields}
        />
      )}
    </div>
  );
}
