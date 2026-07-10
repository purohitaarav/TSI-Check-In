import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract spreadsheet ID from URL
    // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = match ? match[1] : null;

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
    }

    // Check if we have credentials
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: 'Google Sheets integration is not configured on the server. Missing credentials.' 
      }, { status: 500 });
    }

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    if (!response.data || !response.data.sheets) {
      return NextResponse.json({ error: 'Could not retrieve sheets' }, { status: 400 });
    }

    // Extract tab names
    const tabNames = response.data.sheets
      .map(sheet => sheet.properties?.title)
      .filter(Boolean) as string[];

    return NextResponse.json({ 
      spreadsheetId, 
      tabNames,
      title: response.data.properties?.title || 'Unknown Spreadsheet'
    });

  } catch (error: any) {
    console.error('Error inspecting Google Sheet:', error);
    
    // Provide a helpful error if it's a permissions issue
    if (error.code === 403) {
      return NextResponse.json({ 
        error: 'Access denied. Make sure you have shared the spreadsheet with the service account email.' 
      }, { status: 403 });
    }
    
    if (error.code === 404) {
      return NextResponse.json({ 
        error: 'Spreadsheet not found. Please check the URL and ensure the sheet is accessible.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to inspect Google Sheet' 
    }, { status: 500 });
  }
}
