"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { csvAttendeeSchema, generateSearchName } from "@/lib/utils/csv-schema";
import { firestoreService } from "@/lib/services/firestore";
import { Attendee } from "@/types";

interface ImportAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId?: string;
}

export function ImportAttendeesModal({ isOpen, onClose, onSuccess, eventId = "default-event" }: ImportAttendeesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessCount(0);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const validAttendees: Omit<Attendee, "id">[] = [];

          for (const row of results.data as any[]) {
            const parsed = csvAttendeeSchema.safeParse(row);

            if (parsed.success) {
              const data = parsed.data;
              validAttendees.push({
                Name: data.Name,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                searchName: generateSearchName(data.Name),
                email: data.email,
                phone: data.phone,
                shirtSize: data.shirtSize,
                checkedIn: false,
                checkedInAt: null,
                checkedInBy: null,
                registrationData: data
              });
            } else {
              console.warn("Skipping invalid row:", row, parsed.error);
            }
          }

          if (validAttendees.length === 0) {
            throw new Error("No valid attendees found in the CSV. Ensure headers include 'firstName' and 'lastName'.");
          }

          await firestoreService.batchWriteAttendees(eventId, validAttendees);
          setSuccessCount(validAttendees.length);

          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);

        } catch (err: any) {
          setError(err.message || "Failed to upload attendees");
        } finally {
          setIsUploading(false);
        }
      },
      error: (error: any) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 border-border">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <CardTitle>Import Attendees</CardTitle>
          <CardDescription>Upload a CSV file to add attendees to the roster.</CardDescription>
        </CardHeader>

        <CardContent>
          {!file && (
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1 text-center px-4">Must include firstName and lastName headers</p>
            </div>
          )}

          {file && !successCount && (
            <div className="flex items-center gap-4 rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isUploading}>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successCount > 0 && (
            <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-lg bg-emerald-500/10 p-6 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
              <p className="text-sm font-medium">Successfully imported {successCount} attendees!</p>
            </div>
          )}

          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!file || isUploading || successCount > 0}
          >
            {isUploading ? "Importing..." : "Import CSV"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
