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
  QueryConstraint
} from "firebase/firestore";

// Generic service wrapper to interact with Firestore
export const firestoreService = {
  // Get all documents in a collection
  async getAll<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  },

  // Get a single document by ID
  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  },

  // Create or overwrite a document
  async set(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
  },

  // Update specific fields of a document
  async update(collectionName: string, id: string, data: any): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  },

  // Delete a document
  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }
};
