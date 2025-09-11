import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type ItemDoc = {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string; // Firestore field
  basePrice: number;
  active?: boolean;
  displayOrder?: number;
  modifierGroupIds?: string[];
};

export type ItemRecord = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  img?: string; // mapped from imageUrl for UI
  price: number; // mapped from basePrice for UI
  active: boolean;
  displayOrder: number;
  modifierGroupIds?: string[];
};

function toItemRecord(id: string, data: ItemDoc): ItemRecord {
  return {
    id,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description,
    img: data.imageUrl,
    price: data.basePrice,
    active: data.active ?? true,
    displayOrder: data.displayOrder ?? 9999,
    modifierGroupIds: data.modifierGroupIds,
  };
}

export async function getItems(storeId: string = 'MAIN'): Promise<ItemRecord[]> {
  const col = collection(db, 'stores', storeId, 'items');
  const q = query(col, orderBy('displayOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => toItemRecord(d.id, d.data() as ItemDoc)).filter(i => i.active);
}

export async function getItem(storeId: string = 'MAIN', itemId: string): Promise<ItemRecord | null> {
  const ref = doc(db, 'stores', storeId, 'items', itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toItemRecord(snap.id, snap.data() as ItemDoc);
}

export function watchItems(
  storeId: string = 'MAIN',
  onChange: (items: ItemRecord[]) => void,
  onError?: (e: any) => void
) {
  const col = collection(db, 'stores', storeId, 'items');
  const q = query(col, orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map(d => toItemRecord(d.id, d.data() as ItemDoc)).filter(i => i.active);
      onChange(items);
    },
    (err) => onError && onError(err)
  );
}
