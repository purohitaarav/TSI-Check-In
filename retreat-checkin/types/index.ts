export interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  checkedIn: boolean;
  checkInTime?: string;
  // We can add more fields as we go (e.g. ticketType, etc.)
}

export interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
}
