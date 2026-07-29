const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load env variables
const envPath = path.join(__dirname, '.env.local');
console.log('Loading .env.local from:', envPath);
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

console.log('Firebase Project ID:', projectId);
console.log('Client Email:', clientEmail);

try {
  const app = initializeApp({
    credential: cert({ clientEmail, privateKey, projectId }),
    projectId,
  });
  console.log('Firebase App initialized successfully.');

  const db = getFirestore(app);
  console.log('Connecting to Firestore and fetching authorizedUsers...');
  
  db.collection('authorizedUsers').get()
    .then(snapshot => {
      console.log('Success! Number of authorized users found:', snapshot.size);
      snapshot.forEach(doc => {
        console.log('- User document ID:', doc.id);
      });
      process.exit(0);
    })
    .catch(err => {
      console.error('Firestore get() failed with error:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Error during Firebase Admin initialization:', err);
  process.exit(1);
}
