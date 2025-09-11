import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type CategoryDoc = {
  name: string;
  displayOrder?: number;
  active?: boolean;
  icon?: string; // optional MaterialIcons name for UI chips
  groupId?: string; // e.g., 'regular' | 'kids'
  groupName?: string; // e.g., 'Yerros Regular' | 'Yerros Kids'
};

export type CategoryRecord = {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  icon?: string;
  groupId?: string;
  groupName?: string;
};

function toCategoryRecord(id: string, data: CategoryDoc): CategoryRecord {
  return {
    id,
    name: data.name,
    displayOrder: data.displayOrder ?? 9999,
    active: data.active ?? true,
    icon: data.icon,
    groupId: data.groupId,
    groupName: data.groupName,
  };
}

export async function getCategories(storeId: string = 'MAIN'): Promise<CategoryRecord[]> {
  const col = collection(db, 'stores', storeId, 'categories');
  const q = query(col, orderBy('displayOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => toCategoryRecord(d.id, d.data() as CategoryDoc)).filter(c => c.active);
}

export function watchCategories(
  storeId: string = 'MAIN',
  onChange: (categories: CategoryRecord[]) => void,
  onError?: (e: any) => void
) {
  const col = collection(db, 'stores', storeId, 'categories');
  const q = query(col, orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const categories = snap.docs.map(d => toCategoryRecord(d.id, d.data() as CategoryDoc)).filter(c => c.active);
      onChange(categories);
    },
    (err) => onError && onError(err)
  );
}
