const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the .env.local file
const envPath = path.join(__dirname, '.env.local');
console.log('Loading .env.local from:', envPath);
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY;

console.log('GOOGLE_CLIENT_EMAIL:', clientEmail);
console.log('GOOGLE_PRIVATE_KEY exists:', !!privateKey);

if (privateKey) {
  console.log('First 30 chars of raw privateKey:', privateKey.substring(0, 30));
  console.log('Last 30 chars of raw privateKey:', privateKey.substring(privateKey.length - 30));
  
  // Apply the same replacement as in the Next.js API route
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  console.log('First 30 chars of formatted privateKey:', formattedPrivateKey.substring(0, 30));
  console.log('Last 30 chars of formatted privateKey:', formattedPrivateKey.substring(formattedPrivateKey.length - 30));
  
  try {
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    console.log('Successfully created GoogleAuth instance.');
  } catch (err) {
    console.error('Error creating GoogleAuth:', err);
  }
} else {
  console.log('Error: GOOGLE_PRIVATE_KEY is empty/undefined.');
}
