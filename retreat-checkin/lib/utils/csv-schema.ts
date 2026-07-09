import { z } from "zod";

export const csvAttendeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  shirtSize: z.string().optional(),
}).catchall(z.any());

export type CsvAttendee = z.infer<typeof csvAttendeeSchema>;

export function generateSearchName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}
