import { Event, GoogleSheetTabConfig } from "@/types";

/**
 * Checks if an event has a Google Sheet ID and at least one configured tab.
 */
export function hasGoogleSheetsConfig(event: Event | null): boolean {
  if (!event) return false;
  return !!(
    event.googleSheetId && 
    event.googleSheets && 
    event.googleSheets.length > 0
  );
}

/**
 * Returns the Google Spreadsheet ID for an event, or null if not configured.
 */
export function getSpreadsheetIdForEvent(event: Event | null): string | null {
  if (!event || !event.googleSheetId) return null;
  return event.googleSheetId;
}

/**
 * Finds the corresponding Google Sheet tab name for a given registration category.
 * Returns null if the category is not configured for Google Sheets.
 */
export function getTabForCategory(event: Event | null, category: string): string | null {
  if (!event || !event.googleSheets) return null;
  
  const config = event.googleSheets.find(
    (sheet: GoogleSheetTabConfig) => sheet.category === category
  );
  
  return config ? config.tabName : null;
}
