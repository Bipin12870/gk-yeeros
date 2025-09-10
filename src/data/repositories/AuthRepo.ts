import { auth } from '../../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';

import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

type SignUpArgs = {
  name?: string;
  email: string;
  password: string;
  phone?: string;
  marketingOptIn?: boolean;
  acceptTerms?: boolean; // record consent timestamp
};

/** Create users/{uid} if missing */
async function ensureUserDoc(user: User, extras?: {
  phone?: string;
  marketingOptIn?: boolean;
  acceptTerms?: boolean;
}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      phone: extras?.phone ?? null,
      photoURL: user.photoURL ?? null,
      roles: ['customer'],
      marketingOptIn: !!extras?.marketingOptIn,
      status: 'active',
      address: null,
     // preferences: { defaultPickupStoreId: 'MAIN', dietaryTags: [] },
      consent: { terms: !!extras?.acceptTerms, ts: serverTimestamp() },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
  } else {
    // keep profile in sync minimally; do not overwrite user edits
    await updateDoc(ref, {
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
  }
}

export async function signUpEmail(opts: SignUpArgs): Promise<User> {
  const { email, password, name, phone, marketingOptIn, acceptTerms } = opts;

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }

  // Send real verification email
  await sendEmailVerification(cred.user);

  return cred.user;
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  // Block unverified sign-in and avoid creating user docs for them
  if (!cred.user.emailVerified) {
    await auth.signOut();
    throw new Error('Please verify your email before signing in.');
  }

  // Touch lastSeenAt on verified login and ensure profile exists
  const ref = doc(db, 'users', cred.user.uid);
  try {
    await updateDoc(ref, { lastSeenAt: serverTimestamp() });
  } catch {
    await ensureUserDoc(cred.user);
  }

  return cred.user;
}

export async function sendReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerification(user: User) {
  await sendEmailVerification(user);
}

/** Create user doc only when the auth user is verified */
export async function ensureUserDocIfVerified(user: User) {
  if (!user.emailVerified) return;
  await ensureUserDoc(user);
}
