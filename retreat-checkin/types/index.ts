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
}

export interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
}
