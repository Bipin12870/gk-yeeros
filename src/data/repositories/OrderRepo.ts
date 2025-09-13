import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CartItem } from '../../state/stores/useCartStore';

export type OrderCustomer = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export async function createPickupOrder(
  storeId: string,
  customer: OrderCustomer,
  items: CartItem[],
  totalAmount: number
) {
  // Remove any undefined fields recursively to satisfy Firestore constraints
  const sanitize = (value: any): any => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (value && typeof value === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(value)) {
        if (v === undefined) continue;
        out[k] = sanitize(v);
      }
      return out;
    }
    return value;
  };

  const payload = sanitize({
    customer,
    type: 'pickup' as const,
    status: 'pending' as const,
    items,
    totalAmount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const col = collection(db, 'stores', storeId, 'orders');
  const ref = await addDoc(col, payload);
  return ref.id;
}

export type OrderRecord = {
  id: string;
  type: 'pickup' | 'delivery';
  status: 'pending' | 'accepted' | 'ready' | 'completed' | 'cancelled';
  items: CartItem[];
  totalAmount: number;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
};

export function watchUserOrders(
  storeId: string,
  uid: string,
  onChange: (orders: OrderRecord[]) => void,
  onError?: (e: any) => void
) {
  const col = collection(db, 'stores', storeId, 'orders');
  // Avoid composite index requirement by filtering on customer.id only,
  // then sort by createdAt on the client.
  const q = query(col, where('customer.id', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: OrderRecord[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => {
        const ta = (a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) as number;
        const tb = (b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) as number;
        return tb - ta;
      });
      onChange(list);
    },
    (err) => {
      console.warn('watchUserOrders error', err);
      if (onError) onError(err);
    }
  );
}

export function watchOrder(
  storeId: string,
  orderId: string,
  onChange: (order: OrderRecord | null) => void,
  onError?: (e: any) => void
) {
  const ref = doc(db, 'stores', storeId, 'orders', orderId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) { onChange(null); return; }
      onChange({ id: snap.id, ...(snap.data() as any) });
    },
    (err) => onError && onError(err)
  );
}
