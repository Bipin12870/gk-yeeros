import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { StoreDoc, StoreRecord, PickupConfig } from "../../types/store";

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

/** Update pickup timing config fields under stores/{id}.pickup */
export async function updatePickup(
  storeId: string = "MAIN",
  patch: Partial<PickupConfig>
) {
  const payload: Record<string, any> = {};
  if (patch.enabled !== undefined) payload["pickup.enabled"] = patch.enabled;
  if (patch.minLeadMinutes !== undefined) payload["pickup.minLeadMinutes"] = patch.minLeadMinutes;
  if (patch.maxLeadMinutes !== undefined) payload["pickup.maxLeadMinutes"] = patch.maxLeadMinutes;
  if (patch.bufferMinutes !== undefined) payload["pickup.bufferMinutes"] = patch.bufferMinutes;
  const ref = doc(db, COLLECTION, storeId);
  await updateDoc(ref, payload);
}

/** Update a staff member's photo by id in the store's staff array. Stores a Storage path or URL. */
// removed updateStaffPhoto (Storage migration deferred)
