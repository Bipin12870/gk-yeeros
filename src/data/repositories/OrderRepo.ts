import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
