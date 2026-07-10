"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEvent } from "@/components/providers/EventProvider";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Percent, Search, Download, Pencil, Check, X, Trash2, Settings, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { firestoreService } from "@/lib/services/firestore";
import { Attendee, RegistrationGroup } from "@/types";
import { AttendeeList } from "@/components/AttendeeList";
import { ImportAttendeesModal } from "@/components/ImportAttendeesModal";
import { AttendeeModal } from "@/components/AttendeeModal";
import { FieldCustomizationModal } from "@/components/FieldCustomizationModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedEvent, events, loadingEvents, selectEvent } = useEvent();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [groups, setGroups] = useState<RegistrationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"needs_check_in" | "checked_in" | "all">("needs_check_in");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldModalGroup, setFieldModalGroup] = useState<RegistrationGroup | null>(null);

  const fetchData = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const [fetchedAttendees, fetchedGroups] = await Promise.all([
        firestoreService.getAttendeesForEvent(selectedEvent.id),
        firestoreService.getRegistrationGroups(selectedEvent.id)
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
    if (selectedEvent) {
      fetchData();
    } else {
      setAttendees([]);
      setGroups([]);
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    const handleOpenModal = () => setIsImportModalOpen(true);
    window.addEventListener("open-import-modal", handleOpenModal);
    return () => window.removeEventListener("open-import-modal", handleOpenModal);
  }, []);

  const tabFilteredAttendees = useMemo(() => {
    let filtered = attendees;
    
    if (activeTab !== "all") {
      filtered = filtered.filter(a => a.registrationGroupId === activeTab);
    }
    
    if (statusFilter === "needs_check_in") {
      filtered = filtered.filter(a => !a.checkedIn);
    } else if (statusFilter === "checked_in") {
      filtered = filtered.filter(a => a.checkedIn);
    }
    
    return filtered;
  }, [attendees, activeTab, statusFilter]);

  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach(g => map.set(g.id, g.name));
    return map;
  }, [groups]);

  const groupFilteredAttendees = useMemo(() => {
    return activeTab === "all" 
      ? attendees 
      : attendees.filter(a => a.registrationGroupId === activeTab);
  }, [attendees, activeTab]);

  const totalAttendees = groupFilteredAttendees.length;
  const checkedInCount = groupFilteredAttendees.filter(a => a.checkedIn).length;
  const pendingCount = totalAttendees - checkedInCount;
  const checkinRate = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;

  const handleRenameGroup = async (groupId: string) => {
    if (!editingGroupName.trim() || !selectedEvent) return;
    try {
      await firestoreService.renameRegistrationGroup(selectedEvent.id, groupId, editingGroupName.trim());
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: editingGroupName.trim() } : g));
      setEditingGroupId(null);
    } catch (error) {
      console.error("Failed to rename group", error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!selectedEvent) return;
    if (!confirm("Are you sure you want to delete this group? All attendees in this group will be deleted as well.")) {
      return;
    }
    
    try {
      await firestoreService.deleteRegistrationGroup(selectedEvent.id, groupId);
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
    if (!user || !selectedEvent) return;
    setIsCheckingIn(true);
    const identifier = user.email || user.uid;
    try {
      await firestoreService.checkInAttendee(selectedEvent.id, attendeeId, identifier);
      setAttendees(prev => prev.map(a => 
        a.id === attendeeId ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString(), checkedInBy: identifier } : a
      ));
      
      if (selectedAttendee?.id === attendeeId) {
        setSelectedAttendee(prev => prev ? {
          ...prev,
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
          checkedInBy: identifier
        } : null);
      }
      
      const attendee = attendees.find(a => a.id === attendeeId);
      if (attendee) {
        toast.success(`${attendee.name} checked in`, {
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => handleUndoCheckIn(attendeeId),
          },
        });
      }
      
    } catch (error) {
      console.error("Failed to check in attendee:", error);
      toast.error("Failed to check in attendee");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleUndoCheckIn = async (attendeeId: string) => {
    if (!user || !selectedEvent) return;
    setIsCheckingIn(true);
    const identifier = user.email || user.uid;
    try {
      await firestoreService.undoCheckInAttendee(selectedEvent.id, attendeeId, identifier);
      setAttendees(prev => prev.map(a => 
        a.id === attendeeId ? { ...a, checkedIn: false, checkedInAt: null, checkedInBy: null } : a
      ));
      
      if (selectedAttendee?.id === attendeeId) {
        setSelectedAttendee(prev => prev ? {
          ...prev,
          checkedIn: false,
          checkedInAt: null,
          checkedInBy: null
        } : null);
      }
      
      const attendee = attendees.find(a => a.id === attendeeId);
      if (attendee) {
        toast.info(`Undid check-in for ${attendee.name}`);
      }
    } catch (error) {
      console.error("Failed to undo check-in:", error);
      toast.error("Failed to undo check-in");
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
    if (!fieldModalGroup || !selectedEvent) return;
    try {
      await firestoreService.updateRegistrationGroupFields(selectedEvent.id, fieldModalGroup.id, fields);
      setGroups(prev => prev.map(g => g.id === fieldModalGroup.id ? { ...g, visibleFields: fields } : g));
      setIsFieldModalOpen(false);
    } catch (error) {
      console.error("Failed to update fields:", error);
    }
  };

  if (loadingEvents) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-8">
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/20 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome to TSI Check-In</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          To get started, select an active event or connect a new Google Spreadsheet to automatically create an event and import attendees.
        </p>
        
        <Button onClick={() => window.dispatchEvent(new Event('open-settings-modal'))} className="mb-8" size="lg">
          <LinkIcon className="h-4 w-4 mr-2" />
          Connect Spreadsheet
        </Button>
        </div>
        
        {events.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full">
              <Settings className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-medium">No Events Found</h3>
            <p className="text-muted-foreground max-w-md">
              There are no events currently available. Please contact an administrator to create one.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group overflow-hidden"
                onClick={() => selectEvent(event)}
              >
                <div className="h-2 w-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors" />
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium tracking-tight mb-2">{event.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="bg-secondary px-2 py-1 rounded-md text-xs font-mono">{event.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">{selectedEvent.name}</h2>
        <p className="text-muted-foreground">Manage your attendees, check-ins, and event configuration.</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-2">
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

        <div className="flex flex-col flex-1 bg-muted/10 p-4 sm:p-6 rounded-b-2xl border-x border-b border-border min-h-[500px]">
        
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search attendees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border self-start lg:self-auto shrink-0">
            <button
              onClick={() => setStatusFilter("needs_check_in")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === "needs_check_in" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Needs Check-In
            </button>
            <button
              onClick={() => setStatusFilter("checked_in")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === "checked_in" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Checked In
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
          </div>
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
      </div>

      <ImportAttendeesModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={fetchData} 
        eventId={selectedEvent.id}
      />

      <AttendeeModal 
        isOpen={!!selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
        attendee={selectedAttendee}
        groupName={selectedAttendee ? (groupMap.get(selectedAttendee.registrationGroupId) || "Unknown Group") : ""}
        onCheckIn={handleCheckIn}
        onUndoCheckIn={handleUndoCheckIn}
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
