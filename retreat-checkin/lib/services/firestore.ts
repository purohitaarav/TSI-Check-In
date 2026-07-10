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
  writeBatch,
  where
} from "firebase/firestore";
import { Attendee, RegistrationGroup, Event } from "@/types";

export const firestoreService = {
  async getEvents(): Promise<Event[]> {
    const collectionRef = collection(db, "events");
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  },

  async getEventByGoogleSheetId(googleSheetId: string): Promise<Event | null> {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("googleSheetId", "==", googleSheetId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Event;
    }
    return null;
  },

  async createEvent(eventData: Omit<Event, "id">): Promise<string> {
    const collectionRef = collection(db, "events");
    const docRef = doc(collectionRef);
    await setDoc(docRef, {
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },



  async getEvent(eventId: string): Promise<Event | null> {
    const docRef = doc(db, `events`, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return null;
  },

  async updateEventGoogleSheetConfig(
    eventId: string, 
    config: { name?: string; googleSheetId?: string; googleSheets?: { tabName: string; category: string }[] }
  ): Promise<void> {
    const docRef = doc(db, `events`, eventId);
    await updateDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  },
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

  async checkInAttendee(eventId: string, attendeeId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // 1. Update attendee
    const attendeeRef = doc(db, `events/${eventId}/attendees`, attendeeId);
    const timestamp = new Date().toISOString();
    batch.update(attendeeRef, {
      checkedIn: true,
      checkedInAt: timestamp,
      checkedInBy: userId
    });

    // 2. Create history log
    const logRef = doc(collection(db, `events/${eventId}/checkins`));
    batch.set(logRef, {
      attendeeId,
      action: "check_in",
      timestamp,
      userId
    });

    await batch.commit();
  },

  async undoCheckInAttendee(eventId: string, attendeeId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // 1. Revert attendee
    const attendeeRef = doc(db, `events/${eventId}/attendees`, attendeeId);
    const timestamp = new Date().toISOString();
    batch.update(attendeeRef, {
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null
    });

    // 2. Create history log
    const logRef = doc(collection(db, `events/${eventId}/checkins`));
    batch.set(logRef, {
      attendeeId,
      action: "undo_check_in",
      timestamp,
      userId
    });

    await batch.commit();
  },
  
  async batchWriteAttendees(eventId: string, attendees: Omit<Attendee, "id">[]): Promise<void> {
    const collectionRef = collection(db, `events/${eventId}/attendees`);
    
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

  async upsertAttendee(eventId: string, attendeeData: Partial<Attendee> & { name: string; registrationGroupId: string }): Promise<string> {
    const attendeesRef = collection(db, `events/${eventId}/attendees`);
    let docRef;

    // Try to find existing by ID or externalId
    if (attendeeData.id) {
      docRef = doc(attendeesRef, attendeeData.id);
    } else if (attendeeData.externalId) {
      const q = query(attendeesRef, where("externalId", "==", attendeeData.externalId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        docRef = snap.docs[0].ref;
      }
    }

    if (!docRef) {
      docRef = doc(attendeesRef);
    }

    const cleanData = Object.fromEntries(Object.entries(attendeeData).filter(([_, v]) => v !== undefined));
    await setDoc(docRef, cleanData, { merge: true });
    return docRef.id;
  },

  async batchUpsertAttendees(eventId: string, attendees: (Partial<Attendee> & { name: string; registrationGroupId: string })[]): Promise<void> {
    const collectionRef = collection(db, `events/${eventId}/attendees`);
    
    // Fetch all existing attendees to map externalId to docId to avoid duplicate creation
    const existingSnap = await getDocs(query(collectionRef));
    const externalIdMap = new Map<string, string>();
    existingSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.externalId) {
        externalIdMap.set(data.externalId, doc.id);
      }
    });

    const chunks = [];
    for (let i = 0; i < attendees.length; i += 490) {
      chunks.push(attendees.slice(i, i + 490));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const attendee of chunk) {
        let docRef;
        if (attendee.id) {
          docRef = doc(collectionRef, attendee.id);
        } else if (attendee.externalId && externalIdMap.has(attendee.externalId)) {
          docRef = doc(collectionRef, externalIdMap.get(attendee.externalId)!);
        } else {
          docRef = doc(collectionRef);
        }
        
        const cleanData = Object.fromEntries(Object.entries(attendee).filter(([_, v]) => v !== undefined));
        batch.set(docRef, cleanData, { merge: true });
      }
      await batch.commit();
    }
  },
  
  async getAttendeesForEvent(eventId: string): Promise<Attendee[]> {
    const collectionRef = collection(db, `events/${eventId}/attendees`);
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendee));
  },

  async createRegistrationGroup(eventId: string, groupName: string): Promise<string> {
    // Generate a simple slug ID for the group that avoids collisions nicely if we append a random string
    // but for simplicity, we use the sanitized name. If it exists, it safely overwrites the name (idempotent).
    const groupId = groupName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const docRef = doc(db, `events/${eventId}/registrationGroups`, groupId);
    await setDoc(docRef, { name: groupName }, { merge: true });
    return groupId;
  },

  async renameRegistrationGroup(eventId: string, groupId: string, newName: string): Promise<void> {
    const docRef = doc(db, `events/${eventId}/registrationGroups`, groupId);
    await updateDoc(docRef, { name: newName });
  },

  async getRegistrationGroups(eventId: string): Promise<RegistrationGroup[]> {
    const collectionRef = collection(db, `events/${eventId}/registrationGroups`);
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegistrationGroup));
  },

  async updateRegistrationGroupFields(eventId: string, groupId: string, fields: string[]): Promise<void> {
    const docRef = doc(db, `events/${eventId}/registrationGroups`, groupId);
    await updateDoc(docRef, { visibleFields: fields });
  },

  async deleteRegistrationGroup(eventId: string, groupId: string): Promise<void> {
    // 1. Delete all attendees belonging to this group
    const attendeesRef = collection(db, `events/${eventId}/attendees`);
    const q = query(attendeesRef, where("registrationGroupId", "==", groupId));
    const querySnapshot = await getDocs(q);
    
    // Process in batches if there are many attendees
    const chunks = [];
    for (let i = 0; i < querySnapshot.docs.length; i += 490) {
      chunks.push(querySnapshot.docs.slice(i, i + 490));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const docSnapshot of chunk) {
        batch.delete(docSnapshot.ref);
      }
      await batch.commit();
    }

    // 2. Delete the group document
    const groupRef = doc(db, `events/${eventId}/registrationGroups`, groupId);
    await deleteDoc(groupRef);
  }
};
