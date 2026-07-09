export interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  searchName: string;
  email?: string;
  phone?: string;
  shirtSize?: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  qrToken?: string;
  registrationData?: Record<string, any>;
}

export interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
}
