export interface GoogleSheetTabConfig {
  tabName: string;
  category: string;
}

export type UserRole = "admin" | "staff" | "readOnly";

export interface AuthorizedUser {
  email: string;
}

export interface Event {
  id: string;
  name: string;
  googleSheetId?: string;
  googleSheets?: GoogleSheetTabConfig[];
}

export interface RegistrationGroup {
  id: string;
  name: string;
  visibleFields?: string[];
}

export interface Attendee {
  id: string;
  name: string;
  searchName: string;
  email?: string | null;
  phone?: string | null;
  checkedIn: boolean;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  qrToken?: string;
  registrationGroupId: string; // The ID of the group, so renaming is easy
  registrationData?: Record<string, any>;
  
  // Import metadata
  source?: "google_sheet" | "csv" | "manual";
  externalId?: string;
  importedAt?: string;
  lastSyncedAt?: string;
}

export interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface CheckInLog {
  id?: string;
  attendeeId: string;
  action: "check_in" | "undo_check_in";
  timestamp: string;
  userId: string;
}
