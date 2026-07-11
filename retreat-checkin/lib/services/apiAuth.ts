import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { AuthorizedUser } from "@/types";

// Initialize Firebase Admin (singleton pattern)
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }


  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  return initializeApp({
    credential: cert({ clientEmail, privateKey, projectId }),
    projectId,
  });

  console.log("Firebase Admin Config:", {
  projectId,
  clientEmail,
});
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns the decoded token (with email) or null if invalid.
 */
async function verifyIdToken(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.slice(7);
  try {
    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    return null;
  }
}

/**
 * Check the authorizedUsers collection in Firestore via Admin SDK.
 */
async function getAuthorizedUserAdmin(email: string): Promise<AuthorizedUser | null> {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);
  const docRef = adminDb.collection("authorizedUsers").doc(email.toLowerCase().trim());
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;
  return { email: email.toLowerCase().trim() };
}

/**
 * Use in API route handlers to enforce authorization.
 *
 * Usage:
 *   const authResult = await requireAuthorizedUser(request);
 *   if (authResult instanceof NextResponse) return authResult; // 401 or 403
 *   const { email, role } = authResult;
 *
 * Returns the authorized user data on success, or a NextResponse error on failure.
 */
export async function requireAuthorizedUser(
  request: NextRequest
): Promise<AuthorizedUser | NextResponse> {
  // 1. Verify the Firebase ID token
  const decodedToken = await verifyIdToken(request);
  if (!decodedToken || !decodedToken.email) {
    return NextResponse.json(
      { error: "Unauthorized: No valid authentication token provided." },
      { status: 401 }
    );
  }

  // 2. Check the authorizedUsers collection
  const authorizedUser = await getAuthorizedUserAdmin(decodedToken.email);
  if (!authorizedUser) {
    return NextResponse.json(
      { error: "Forbidden: Your account is not authorized to access this application." },
      { status: 403 }
    );
  }

  return authorizedUser;
}
