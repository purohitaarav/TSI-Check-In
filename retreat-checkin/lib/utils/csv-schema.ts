import { z } from "zod";

export const csvAttendeeSchema = z.object({
  Name: z.string().min(1, "Name is required"),
}).catchall(z.any());

export type CsvAttendee = z.infer<typeof csvAttendeeSchema>;

export function generateSearchName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}
