import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { StoreDoc, StoreRecord } from "../../types/store";

const COLLECTION = "stores";

function toStoreRecord(id: string, data?: StoreDoc): StoreRecord | null {
  if (!data) return null;
  return { id, ...data };
}

/** One-shot fetch of a store document */
export async function getStore(storeId: string = "MAIN"): Promise<StoreRecord | null> {
  const ref = doc(db, COLLECTION, storeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toStoreRecord(snap.id, snap.data() as StoreDoc);
}

/** Real-time subscription to a store document */
export function watchStore(
  storeId: string = "MAIN",
  onChange: (store: StoreRecord | null) => void,
  onError?: (e: any) => void
) {
  const ref = doc(db, COLLECTION, storeId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
      } else {
        onChange(toStoreRecord(snap.id, snap.data() as StoreDoc));
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}