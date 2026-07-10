"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvent } from "@/components/providers/EventProvider";
import { firestoreService } from "@/lib/services/firestore";
import { RegistrationGroup, Event } from "@/types";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon, Database, Check, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EventSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventSettingsModal({ isOpen, onClose }: EventSettingsModalProps) {
  const { selectedEvent, refreshEvents, selectEvent } = useEvent();
  
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<{ id: string; title: string; tabs: string[] } | null>(null);
  
  // Mapping of tabName -> categoryId (registrationGroupId or "__NEW__")
  const [tabMappings, setTabMappings] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<RegistrationGroup[]>([]);
  const [existingEvent, setExistingEvent] = useState<Event | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);

  // Load existing config if modal opens with a selected event
  useEffect(() => {
    if (isOpen && selectedEvent) {
      setExistingEvent(selectedEvent);
      setIsNewEvent(false);
      firestoreService.getRegistrationGroups(selectedEvent.id)
        .then(setGroups)
        .catch(console.error);
        
      if (selectedEvent.googleSheetId) {
        setSpreadsheetInfo({
          id: selectedEvent.googleSheetId,
          title: selectedEvent.name,
          tabs: selectedEvent.googleSheets?.map(s => s.tabName) || []
        });
        
        const existingMappings: Record<string, string> = {};
        selectedEvent.googleSheets?.forEach(s => {
          existingMappings[s.tabName] = s.category;
        });
        setTabMappings(existingMappings);
        setUrl(`https://docs.google.com/spreadsheets/d/${selectedEvent.googleSheetId}/edit`);
      } else {
        setSpreadsheetInfo(null);
        setTabMappings({});
        setUrl("");
      }
    } else if (isOpen && !selectedEvent) {
      // Reset state for "Connect Spreadsheet" from empty state
      setExistingEvent(null);
      setIsNewEvent(true);
      setSpreadsheetInfo(null);
      setTabMappings({});
      setUrl("");
      setGroups([]);
    }
  }, [isOpen, selectedEvent]);

  const handleConnect = async () => {
    if (!url.trim()) {
      toast.error("Please enter a Google Sheets URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/google-sheets/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to inspect spreadsheet");
      }

      const spreadsheetId = data.spreadsheetId;
      
      // Check if event already exists
      const foundEvent = await firestoreService.getEventByGoogleSheetId(spreadsheetId);
      
      setSpreadsheetInfo({
        id: spreadsheetId,
        title: data.title,
        tabs: data.tabNames,
      });

      if (foundEvent) {
        setExistingEvent(foundEvent);
        setIsNewEvent(false);
        const fetchedGroups = await firestoreService.getRegistrationGroups(foundEvent.id);
        setGroups(fetchedGroups);
        
        const existingMappings: Record<string, string> = {};
        foundEvent.googleSheets?.forEach(s => {
          existingMappings[s.tabName] = s.category;
        });
        setTabMappings(existingMappings);
        toast.success("Found existing event for this spreadsheet!");
      } else {
        setExistingEvent(null);
        setIsNewEvent(true);
        setGroups([]);
        // Auto-map all tabs to "__NEW__" for new events
        const newMappings: Record<string, string> = {};
        data.tabNames.forEach((tab: string) => {
          newMappings[tab] = "__NEW__";
        });
        setTabMappings(newMappings);
        toast.success("Spreadsheet connected! Will create a new event.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!spreadsheetInfo) return;

    setIsSaving(true);
    let targetEventId = existingEvent?.id;

    try {
      // 1. Create event if it's new
      if (isNewEvent) {
        targetEventId = await firestoreService.createEvent({
          name: spreadsheetInfo.title,
          googleSheetId: spreadsheetInfo.id,
        });
      }

      if (!targetEventId) throw new Error("Could not determine event ID");

      // 2. Resolve Tab Mappings (Create new groups if needed)
      const finalTabConfigs: { tabName: string, category: string }[] = [];
      
      for (const [tabName, category] of Object.entries(tabMappings)) {
        if (category === "") continue; // Ignored tab

        if (category === "__NEW__") {
          // Create a new registration group
          const newGroupId = await firestoreService.createRegistrationGroup(targetEventId, tabName);
          finalTabConfigs.push({ tabName, category: newGroupId });
        } else {
          // It's an existing group, update its name to match the tab name in case it changed
          await firestoreService.renameRegistrationGroup(targetEventId, category, tabName);
          finalTabConfigs.push({ tabName, category });
        }
      }

      // 3. Update Event Config (and Event Name)
      await firestoreService.updateEventGoogleSheetConfig(targetEventId, {
        name: spreadsheetInfo.title,
        googleSheetId: spreadsheetInfo.id,
        googleSheets: finalTabConfigs
      });

      toast.success(isNewEvent ? "Event created! Syncing attendees..." : "Settings saved! Syncing attendees...");

      // 4. Trigger Attendee Sync
      const syncResponse = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googleSheetId: spreadsheetInfo.id,
          tabs: finalTabConfigs
        }),
      });

      const syncData = await syncResponse.json();
      
      if (!syncResponse.ok) {
        throw new Error(syncData.error || "Failed to fetch attendees from Google Sheets");
      }

      // 5. Upsert Attendees to Firestore
      if (syncData.attendees && syncData.attendees.length > 0) {
        await firestoreService.batchUpsertAttendees(targetEventId, syncData.attendees);
        toast.success(`Successfully synced ${syncData.attendees.length} attendees!`);
      } else {
        toast.success("Sync completed, but no attendees found.");
      }

      // Refresh and switch to this event
      await refreshEvents();
      const updatedEvent = await firestoreService.getEvent(targetEventId);
      if (updatedEvent) {
        selectEvent(updatedEvent);
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to save and sync:", error);
      toast.error(error.message || "Failed to save and sync");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingEvent ? `Settings: ${existingEvent.name}` : "Connect Google Spreadsheet"}
          </DialogTitle>
          <DialogDescription>
            {existingEvent 
              ? "Configure integrations and settings for this event."
              : "Connect a spreadsheet to create a new event and import attendees."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              Google Sheets Sync
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect a Google Spreadsheet to automatically sync attendee registration data.
            </p>
          </div>

          {/* Connection Step */}
          <div className="flex flex-col gap-3">
            <Label htmlFor="sheetUrl">Google Sheets URL</Label>
            <div className="flex gap-2">
              <Input
                id="sheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                autoComplete="off"
              />
              <Button onClick={handleConnect} disabled={isLoading || !url.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                Connect
              </Button>
            </div>
          </div>

          {/* Configuration Step */}
          {spreadsheetInfo && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <Card className="border-indigo-100 dark:border-indigo-900/50">
                <CardContent className="p-4 flex items-start gap-3 bg-indigo-50/50 dark:bg-indigo-900/20">
                  <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <p className="font-medium text-sm text-indigo-900 dark:text-indigo-100">
                      {isNewEvent ? "New Event to be Created: " : "Connected to: "} {spreadsheetInfo.title}
                    </p>
                    <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 truncate max-w-[400px]">
                      ID: {spreadsheetInfo.id}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 mt-2">
                <Label>Map Spreadsheet Tabs to Registration Groups</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select which registration group each tab belongs to. Tabs left unassigned will be ignored during sync.
                </p>
                
                <div className="flex flex-col gap-3">
                  {spreadsheetInfo.tabs.map((tab) => (
                    <div key={tab} className="flex items-center gap-3 bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <div className="flex-1 font-medium text-sm">{tab}</div>
                      <select 
                        className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={tabMappings[tab] || ""}
                        onChange={(e) => setTabMappings(prev => ({ ...prev, [tab]: e.target.value }))}
                      >
                        <option value="">-- Ignore this tab --</option>
                        <option value="__NEW__" className="font-medium text-indigo-600">
                          + Create Group: "{tab}"
                        </option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  
                  {spreadsheetInfo.tabs.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <p>No tabs found in this spreadsheet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!spreadsheetInfo || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (isNewEvent ? "Create & Sync" : "Save & Sync")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
