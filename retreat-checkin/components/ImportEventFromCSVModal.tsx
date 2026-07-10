"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { csvAttendeeSchema, generateSearchName } from "@/lib/utils/csv-schema";
import { firestoreService } from "@/lib/services/firestore";
import { Attendee } from "@/types/index";
import { useEvent } from "@/components/providers/EventProvider";

interface ImportEventFromCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportEventFromCSVModal({ isOpen, onClose }: ImportEventFromCSVModalProps) {
  const [eventName, setEventName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectEvent, refreshEvents } = useEvent();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setError(null);
      setSuccessCount(0);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const findColumnKey = (row: any, ...possibleNames: string[]) => {
    const keys = Object.keys(row);
    for (const possible of possibleNames) {
      const match = keys.find(k => k.trim().toLowerCase() === possible.toLowerCase());
      if (match) return match;
    }
    return null;
  };

  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  };

  const handleImport = async () => {
    if (!eventName.trim()) {
      setError("Please enter an event name");
      return;
    }
    if (files.length === 0) {
      setError("Please select at least one CSV file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Create the new event
      const eventId = await firestoreService.createEvent({
        name: eventName.trim()
      });

      let totalImported = 0;

      for (const file of files) {
        const groupName = file.name.replace(/\.csv$/i, "");
        const data = await parseFile(file);

        // 2. Create the Registration Group tab and get its ID
        const groupId = await firestoreService.createRegistrationGroup(eventId, groupName);

        const validAttendees: Omit<Attendee, "id">[] = [];

        for (const row of data) {
          const nameKey = findColumnKey(row, "name", "fullname", "full name", "primary guest name");

          if (!nameKey || !row[nameKey]) {
            console.warn(`Skipping row without a Name in ${file.name}:`, row);
            continue;
          }

          const rawName = row[nameKey];
          const emailKey = findColumnKey(row, "email", "e-mail", "primary email");
          const phoneKey = findColumnKey(row, "phone", "phone number", "mobile");

          const email = emailKey && row[emailKey] ? row[emailKey] : null;
          const phone = phoneKey && row[phoneKey] ? row[phoneKey] : null;

          const parsed = csvAttendeeSchema.safeParse({ Name: rawName });

          if (parsed.success) {
            validAttendees.push({
              name: rawName,
              searchName: generateSearchName(rawName),
              email: email,
              phone: phone,
              checkedIn: false,
              checkedInAt: null,
              checkedInBy: null,
              registrationGroupId: groupId,
              registrationData: row,
              source: "csv",
              importedAt: new Date().toISOString()
            });
          } else {
            console.warn(`Skipping invalid row in ${file.name}:`, row, parsed.error);
          }
        }

        if (validAttendees.length > 0) {
          // 3. Batch write attendees
          await firestoreService.batchWriteAttendees(eventId, validAttendees);
          totalImported += validAttendees.length;
        } else {
          console.warn(`No valid attendees found in ${file.name}`);
        }
      }

      if (totalImported === 0) {
        throw new Error("No valid attendees found in any of the uploaded files. Ensure they all have a 'Name' column.");
      }

      setSuccessCount(totalImported);

      // 4. Refresh events and select the new event
      await refreshEvents();
      const newEvent = await firestoreService.getEvent(eventId);
      if (newEvent) {
        selectEvent(newEvent);
      }

      setTimeout(() => {
        onClose();
        setEventName("");
        setFiles([]);
        setSuccessCount(0);
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Failed to create event and import attendees");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 border-border">
        <CardHeader className="relative p-4 sm:p-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 sm:right-4 top-3 sm:top-4 rounded-full"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <CardTitle className="text-lg sm:text-xl">Import Event from CSV</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Create a new event and import attendees from CSV files.</CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name" className="text-sm">Event Name</Label>
              <Input
                id="event-name"
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                disabled={isUploading}
              />
            </div>

            {!successCount && (
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-6 sm:py-8 transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm font-medium">Click to select CSV files</p>
                <p className="text-xs text-muted-foreground mt-1 text-center px-4">Each filename will be a registration group. Must include a 'Name' column.</p>
              </div>
            )}

            {files.length > 0 && !successCount && (
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-2 sm:p-2.5 bg-muted/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(i)} disabled={isUploading}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {successCount > 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-emerald-500/10 p-4 sm:p-6 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12" />
                <p className="text-sm font-medium">Successfully created event and imported {successCount} attendees!</p>
              </div>
            )}

            <input
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t bg-muted/20 px-4 sm:px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={isUploading} className="text-sm sm:text-base">Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!eventName.trim() || files.length === 0 || isUploading || successCount > 0}
            className="text-sm sm:text-base"
          >
            {isUploading ? "Creating Event..." : "Create Event & Import"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
