import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AuthorizedUser } from "@/types";

/**
 * Check if a given email is authorized to access the application.
 * Authorization is granted if a document exists in `authorizedUsers/{email}`.
 */
export async function getAuthorizedUser(email: string): Promise<AuthorizedUser | null> {
  const id = email.toLowerCase().trim();
  const docRef = doc(db, "authorizedUsers", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { email: id };
}

/**
 * Returns true if the email has a document in the authorizedUsers collection.
 */
export async function isAuthorized(email: string): Promise<boolean> {
  const user = await getAuthorizedUser(email);
  return user !== null;
}
