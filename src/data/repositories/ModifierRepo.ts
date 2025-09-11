import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ModifierGroupDoc, ModifierGroupRecord } from '../../types/menu';

function toRecord(id: string, data: ModifierGroupDoc): ModifierGroupRecord {
  return {
    id,
    name: data.name,
    required: data.required ?? false,
    min: data.min ?? 0,
    max: data.max ?? (data.multi ? 99 : 1),
    multi: data.multi ?? false,
    isVariantGroup: data.isVariantGroup,
    options: data.options ?? [],
  };
}

export async function getModifierGroup(storeId: string, groupId: string): Promise<ModifierGroupRecord | null> {
  const ref = doc(db, 'stores', storeId, 'modifierGroups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toRecord(snap.id, snap.data() as ModifierGroupDoc);
}

export async function getModifierGroupsByIds(storeId: string, groupIds: string[] = []): Promise<ModifierGroupRecord[]> {
  const unique = Array.from(new Set(groupIds)).filter(Boolean);
  const results = await Promise.all(unique.map((id) => getModifierGroup(storeId, id)));
  return results.filter(Boolean) as ModifierGroupRecord[];
}

