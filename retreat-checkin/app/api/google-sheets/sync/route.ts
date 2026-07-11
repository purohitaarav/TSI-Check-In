import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Attendee, GoogleSheetTabConfig } from '@/types';
import { generateSearchName } from '@/lib/utils/csv-schema';
import { requireAuthorizedUser } from '@/lib/services/apiAuth';

interface SyncRequest {
  googleSheetId: string;
  tabs: GoogleSheetTabConfig[];
}

export async function POST(req: NextRequest) {
  console.log('Sync API called');

  const authResult = await requireAuthorizedUser(req);
  if (authResult instanceof NextResponse) {
    console.log('Auth failed:', authResult);
    return authResult;
  }

  console.log('Auth passed');

  try {
    const { googleSheetId, tabs } = await req.json() as SyncRequest;
    console.log('Request data:', { googleSheetId, tabs });

    if (!googleSheetId || !tabs || tabs.length === 0) {
      return NextResponse.json({ error: 'Missing googleSheetId or tabs' }, { status: 400 });
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ error: 'Server missing Google credentials' }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    let allAttendees: (Partial<Attendee> & { name: string; registrationGroupId: string })[] = [];
    const timestamp = new Date().toISOString();

    for (const tab of tabs) {
      // Fetch data for the tab
      let response;
      try {
        response = await sheets.spreadsheets.values.get({
          spreadsheetId: googleSheetId,
          range: `${tab.tabName}!A1:Z1000`, // Fetch up to Z1000 to be safe
        });
      } catch (sheetError: any) {
        console.error(`Error fetching tab ${tab.tabName}:`, sheetError);
        if (sheetError.code === 404) {
          return NextResponse.json({ error: `Tab "${tab.tabName}" not found in spreadsheet` }, { status: 400 });
        }
        if (sheetError.code === 403) {
          return NextResponse.json({ error: `Access denied to tab "${tab.tabName}". Check spreadsheet permissions.` }, { status: 403 });
        }
        return NextResponse.json({ error: `Failed to fetch tab "${tab.tabName}": ${sheetError.message}` }, { status: 500 });
      }

      const rows = response.data.values;
      if (!rows || rows.length < 2) continue; // Skip if no data (need at least headers and 1 row)

      const headers = rows[0].map(h => String(h).trim().toLowerCase());
      
      // Find critical column indices
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
      const firstNameIdx = headers.findIndex(h => h === 'first name');
      const lastNameIdx = headers.findIndex(h => h === 'last name');
      const emailIdx = headers.findIndex(h => h === 'email' || h === 'email address');
      const phoneIdx = headers.findIndex(h => h === 'phone' || h === 'phone number');
      
      // If we can't find a name, we'll fallback to the first column
      const fallbackNameIdx = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue; // Skip empty rows

        let name = '';
        if (nameIdx !== -1 && row[nameIdx]) {
          name = row[nameIdx];
        } else if (firstNameIdx !== -1 && lastNameIdx !== -1 && row[firstNameIdx]) {
          name = `${row[firstNameIdx]} ${row[lastNameIdx] || ''}`.trim();
        } else if (row[fallbackNameIdx]) {
          name = row[fallbackNameIdx];
        }

        if (!name) continue; // Still no name, skip

        const email = emailIdx !== -1 ? row[emailIdx] : null;
        const phone = phoneIdx !== -1 ? row[phoneIdx] : null;

        // Build registration data from all columns
        const registrationData: Record<string, string> = {};
        headers.forEach((header, idx) => {
          if (header && row[idx] !== undefined) {
            registrationData[header] = row[idx];
          }
        });

        // Generate a deterministic external ID based on row number so we can safely update it later without duplicates
        const externalId = `sheet-${googleSheetId}-tab-${tab.tabName}-row-${i + 1}`;

        allAttendees.push({
          name,
          searchName: generateSearchName(name),
          email,
          phone,
          registrationGroupId: tab.category,
          registrationData,
          source: 'google_sheet',
          externalId,
          importedAt: timestamp,
          lastSyncedAt: timestamp,
        });
      }
    }

    return NextResponse.json({ attendees: allAttendees });

  } catch (error: any) {
    console.error('Error syncing Google Sheet:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync Google Sheet' }, { status: 500 });
  }
}
