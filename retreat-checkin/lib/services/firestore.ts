import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  QueryConstraint,
  writeBatch
} from "firebase/firestore";
import { Attendee } from "@/types";

export const firestoreService = {
  async getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  },

  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  },

  async set(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
  },

  async update(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  },

  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },
  
  async batchWriteAttendees(eventId: string, attendees: Omit<Attendee, "id">[]): Promise<void> {
    const collectionRef = collection(db, `events/${eventId}/attendees`);
    
    // Firestore batches hold up to 500 operations
    const chunks = [];
    for (let i = 0; i < attendees.length; i += 490) {
      chunks.push(attendees.slice(i, i + 490));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const attendee of chunk) {
        const docRef = doc(collectionRef); 
        batch.set(docRef, attendee);
      }
      await batch.commit();
    }
  },
  
  async getAttendeesForEvent(eventId: string): Promise<Attendee[]> {
    const collectionRef = collection(db, `events/${eventId}/attendees`);
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendee));
  }
};
