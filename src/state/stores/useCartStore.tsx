import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../features/auth/AuthProvider';
import { setCart as setRemoteCart, watchCart } from '../../data/repositories/CartRepo';

export type CartOptionSelection = {
  groupId: string;
  optionIds: string[]; // selected option ids in that group
};

export type CartItem = {
  id: string; // item id
  name: string;
  img?: string;
  modifierGroupIds?: string[];
  basePrice: number;
  quantity: number;
  selections: CartOptionSelection[];
  // precalculated total for this line (base + deltas) * qty
  unitPrice: number;
  note?: string;
  // Snapshot of human-friendly selection labels for display (optional)
  selectionDetails?: { groupId: string; groupName: string; options: { id: string; name: string; priceDelta?: number }[] }[];
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  updateItem: (index: number, item: CartItem) => Promise<void>;
  removeItem: (index: number) => Promise<void>;
  clear: () => Promise<void>;
  totalCount: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'cart:v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const unsubRef = useRef<null | (() => void)>(null);
  const syncedRef = useRef(false);
  const itemsRef = useRef<CartItem[]>([]);

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
    itemsRef.current = items;
  }, [items, hydrated]);

  // Firestore sync when logged in
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    syncedRef.current = false;
    if (!user || !hydrated) return;
    unsubRef.current = watchCart(
      user.uid,
      async (remote) => {
        if (!syncedRef.current) {
          syncedRef.current = true;
          const local = itemsRef.current;
          const rlen = (remote?.length ?? 0);
          // Prefer the fuller cart on first sync
          if (local.length > rlen) {
            await setRemoteCart(user.uid, local).catch(() => {});
            return; // will sync on next snapshot with local pushed up
          }
        }
        setItems(remote ?? []);
      }
    );
    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [user?.uid, hydrated]);

  const addItem = async (item: CartItem) => {
    setItems((prev) => {
      const next = [...prev, item];
      if (user) setRemoteCart(user.uid, next).catch(() => {});
      return next;
    });
  };

  const updateItem = async (index: number, item: CartItem) => {
    setItems((prev) => {
      const next = prev.map((it, i) => (i === index ? item : it));
      if (user) setRemoteCart(user.uid, next).catch(() => {});
      return next;
    });
  };

  const removeItem = async (index: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (user) setRemoteCart(user.uid, next).catch(() => {});
      return next;
    });
  };

  const clear = async () => {
    setItems(() => {
      const next: CartItem[] = [];
      if (user) setRemoteCart(user.uid, next).catch(() => {});
      return next;
    });
  };

  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

  const value = useMemo(() => ({ items, addItem, updateItem, removeItem, clear, totalCount, totalAmount }), [items, totalCount, totalAmount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
