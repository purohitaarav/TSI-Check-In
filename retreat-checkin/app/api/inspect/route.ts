import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const retreatsSnap = await getDocs(collection(db, 'retreats'));
    const retreats = retreatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const eventsSnap = await getDocs(collection(db, 'events'));
    const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ retreats, events });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
