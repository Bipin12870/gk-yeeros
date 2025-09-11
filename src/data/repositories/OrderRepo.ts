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
  const payload = {
    customer,
    type: 'pickup' as const,
    status: 'pending' as const,
    items,
    totalAmount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const col = collection(db, 'stores', storeId, 'orders');
  const ref = await addDoc(col, payload);
  return ref.id;
}
