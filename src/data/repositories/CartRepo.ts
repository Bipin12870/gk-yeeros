import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CartItem } from '../../state/stores/useCartStore';

type CartDoc = {
  items: CartItem[];
  updatedAt?: any;
};

export function watchCart(
  uid: string,
  onChange: (items: CartItem[]) => void,
  onError?: (e: any) => void
) {
  const ref = doc(db, 'users', uid, 'cart', 'current');
  return onSnapshot(
    ref,
    (snap) => {
      const data = snap.data() as CartDoc | undefined;
      onChange(data?.items ?? []);
    },
    (err) => onError && onError(err)
  );
}

export async function getCart(uid: string): Promise<CartItem[] | null> {
  const ref = doc(db, 'users', uid, 'cart', 'current');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as CartDoc;
  return data.items ?? [];
}

export async function setCart(uid: string, items: CartItem[]) {
  const ref = doc(db, 'users', uid, 'cart', 'current');
  await setDoc(ref, { items, updatedAt: serverTimestamp() }, { merge: true });
}

