import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../features/auth/AuthProvider';
import { removeFavorite, upsertFavorite, watchFavorites } from '../../data/repositories/FavoritesRepo';

export type FavoriteItem = {
  id: string; // item id
  name: string;
  img?: string;
  // Store last-used selections for quick re-order
  selections?: { groupId: string; optionIds: string[] }[];
};

type FavContextType = {
  items: FavoriteItem[];
  add: (fav: FavoriteItem) => Promise<void>; // upsert
  update: (fav: FavoriteItem) => Promise<void>;
  remove: (id: string) => Promise<void>;
  has: (id: string) => boolean;
};

const FavContext = createContext<FavContextType | undefined>(undefined);
const STORAGE_KEY = 'favorites:v1';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const unsubRef = useRef<null | (() => void)>(null);
  const syncedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  // Firestore sync: watch user favorites when logged in
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    syncedRef.current = false;
    if (!user) return;
    unsubRef.current = watchFavorites(
      user.uid,
      async (remote) => {
        // First snapshot: if remote empty but local has data, push local up
        if (!syncedRef.current) {
          syncedRef.current = true;
          if (remote.length === 0 && items.length > 0) {
            for (const fav of items) await upsertFavorite(user.uid, fav);
            return; // will sync on next snapshot
          }
        }
        setItems(remote);
      }
    );
    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [user?.uid]);

  const add = async (fav: FavoriteItem) => {
    // upsert: if exists, replace to update selections or name/img
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === fav.id);
      if (idx === -1) return [...prev, fav];
      const next = prev.slice();
      next[idx] = { ...prev[idx], ...fav };
      return next;
    });
    if (user) await upsertFavorite(user.uid, fav);
  };
  const update = async (fav: FavoriteItem) => {
    setItems((prev) => prev.map((it) => (it.id === fav.id ? { ...it, ...fav } : it)));
    if (user) await upsertFavorite(user.uid, fav);
  };
  const remove = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (user) await removeFavorite(user.uid, id);
  };
  const has = (id: string) => items.some((it) => it.id === id);

  const value = useMemo(() => ({ items, add, update, remove, has }), [items]);
  return <FavContext.Provider value={value}>{children}</FavContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
