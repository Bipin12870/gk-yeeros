import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FavoriteItem } from '../../state/stores/useFavoritesStore';

export function watchFavorites(
  uid: string,
  onChange: (items: FavoriteItem[]) => void,
  onError?: (e: any) => void
) {
  const col = collection(db, 'users', uid, 'favorites');
  return onSnapshot(
    col,
    (snap) => {
      const list: FavoriteItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      onChange(list);
    },
    (err) => onError && onError(err)
  );
}

export async function upsertFavorite(uid: string, fav: FavoriteItem) {
  const ref = doc(db, 'users', uid, 'favorites', fav.id);
  await setDoc(ref, { ...fav, updatedAt: serverTimestamp() }, { merge: true });
}

export async function removeFavorite(uid: string, itemId: string) {
  const ref = doc(db, 'users', uid, 'favorites', itemId);
  await deleteDoc(ref);
}

