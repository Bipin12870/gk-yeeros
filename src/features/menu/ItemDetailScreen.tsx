import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { theme } from '../../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';
import { getModifierGroupsByIds } from '../../data/repositories/ModifierRepo';
import type { ModifierGroupRecord, ModifierOption } from '../../types/menu';
import { getItem } from '../../data/repositories/ItemRepo';
import { watchStore } from '../../data/repositories/StoreRepo';
import type { StoreRecord } from '../../types/store';
import { isOpenNow } from '../../utils/openNow';
import { useCart } from '../../state/stores/useCartStore';
import { useToast } from '../../state/ui/ToastProvider';
import { useFavorites } from '../../state/stores/useFavoritesStore';
import { useAuth } from '../auth/AuthProvider';

type ItemParam = {
  id: string;
  name: string;
  img?: string;
  description?: string;
  price: number; // basePrice
  modifierGroupIds?: string[];
  // optional editing
  editIndex?: number;
  initialSelections?: Record<string, string[]>;
  initialQty?: number;
  initialNote?: string;
  hiddenOptions?: Record<string, string[]>;
  extraOptions?: Record<string, ModifierOption[]>;
};

export default function ItemDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ItemDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const item = route.params as ItemParam;
  const { user } = useAuth();
  const { addItem, updateItem, totalCount } = useCart();
  const toast = useToast();
  const { add: addFav, remove: removeFav, has } = useFavorites();

  const [store, setStore] = useState<StoreRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ModifierGroupRecord[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>(item.initialSelections ?? {}); // groupId -> optionIds
  const [qty, setQty] = useState(item.initialQty ?? 1);
  const [note, setNote] = useState<string>(item.initialNote ?? '');
  const [hiddenOptions, setHiddenOptions] = useState<Record<string, string[]>>(item.hiddenOptions ?? {});
  const [extraOptions, setExtraOptions] = useState<Record<string, ModifierOption[]>>(item.extraOptions ?? {});

  // Fetch missing per-item extras (e.g., hiddenOptions) if not provided
  useEffect(() => {
    (async () => {
      if (!item.hiddenOptions || !item.extraOptions) {
        const rec = await getItem('MAIN', item.id);
        if (rec?.hiddenOptions && !item.hiddenOptions) setHiddenOptions(rec.hiddenOptions);
        if ((rec as any)?.extraOptions && !item.extraOptions) setExtraOptions((rec as any).extraOptions as Record<string, ModifierOption[]>);
        if (rec?.defaultSelections && !item.initialSelections) {
          setSelections((prev) => ({ ...rec.defaultSelections, ...prev }));
        }
      }
    })();
  }, [item.id]);

  // Watch store to determine if ordering is allowed
  useEffect(() => {
    const unsub = watchStore('MAIN', (doc) => setStore(doc));
    return () => unsub();
  }, []);

  // Load modifier groups for this item
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getModifierGroupsByIds('MAIN', item.modifierGroupIds ?? []);
        if (!mounted) return;
        // Apply per-item extra options first, then filter hidden options
        const adjusted = list.map((g) => {
          const extras = extraOptions[g.id] ?? [];
          // merge and de-dup by id, preferring extras to allow overriding
          const mergedMap = new Map<string, ModifierOption>();
          for (const o of g.options) mergedMap.set(o.id, o);
          for (const o of extras) mergedMap.set(o.id, o);
          let options = Array.from(mergedMap.values());
          const blocked = hiddenOptions[g.id] ?? [];
          if (blocked.length) options = options.filter((o) => !blocked.includes(o.id));
          return { ...g, options } as ModifierGroupRecord;
        });
        setGroups(adjusted);
        // default selections
        const initial: Record<string, string[]> = {};
        for (const g of adjusted) {
          const defaults = g.options.filter(o => o.defaultSelected).map(o => o.id);
          if (defaults.length) {
            initial[g.id] = defaults;
          } else if (g.required && g.min > 0) {
            // pick first if required and no defaults
            const first = g.options[0]?.id;
            if (first) initial[g.id] = [first];
          }
        }
        // Merge with any initialSelections provided (e.g., editing)
        setSelections((prev) => ({ ...initial, ...prev }));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [item.modifierGroupIds, hiddenOptions, extraOptions]);

  const toggleOption = (group: ModifierGroupRecord, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.multi) {
        const exists = current.includes(optionId);
        if (exists) {
          // unselect respecting min
          const next = current.filter((id) => id !== optionId);
          if (group.required && next.length < (group.min ?? 0)) return prev; // cannot go below min
          return { ...prev, [group.id]: next };
        } else {
          if (current.length >= (group.max ?? 99)) return prev; // cannot exceed max
          return { ...prev, [group.id]: [...current, optionId] };
        }
      } else {
        // single-select
        if (current.includes(optionId)) {
          if (group.required) return prev; // can't deselect required single
          return { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [optionId] };
      }
    });
  };

  const priceDelta = useMemo(() => {
    let delta = 0;
    for (const g of groups) {
      const selected = selections[g.id] ?? [];
      for (const id of selected) {
        const opt = g.options.find((o) => o.id === id);
        delta += opt?.priceDelta ?? 0;
      }
    }
    return delta;
  }, [groups, selections]);

  const unitPrice = useMemo(() => item.price + priceDelta, [item.price, priceDelta]);
  const total = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  const canAdd = useMemo(() => {
    // validate required groups min/max
    for (const g of groups) {
      const selected = selections[g.id] ?? [];
      const count = selected.length;
      if (g.required && count < (g.min ?? 0)) return false;
      if (count > (g.max ?? (g.multi ? 99 : 1))) return false;
    }
    return true;
  }, [groups, selections]);

  const canOrder = useMemo(() => {
    if (!store) return false;
    const online = store.online !== false;
    const pickupEnabled = store.pickup?.enabled !== false;
    const open = isOpenNow(store.hours);
    return online && pickupEnabled && open;
  }, [store]);

  const onAddToCart = async () => {
    if (!canOrder) { toast.show('We\'re closed at the moment.'); return; }
    if (!user) {
      toast.show('Please sign in to add items', { action: { label: 'Login', onPress: () => navigation.navigate('Login') } });
      return;
    }
    if (!canAdd) return;
    const selectionDetails = groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      options: (selections[g.id] ?? []).map((id) => {
        const o = g.options.find((x) => x.id === id);
        return { id, name: o?.name ?? id, priceDelta: o?.priceDelta };
      }),
    }));
    const line = {
      id: item.id,
      name: item.name,
      img: item.img,
      modifierGroupIds: item.modifierGroupIds,
      basePrice: item.price,
      quantity: qty,
      selections: Object.entries(selections).map(([groupId, optionIds]) => ({ groupId, optionIds })),
      unitPrice: item.price + priceDelta,
      selectionDetails,
      note: note?.trim() ? note.trim() : undefined,
    } as const;
    try {
      if (typeof item.editIndex === 'number') {
        await updateItem(item.editIndex, line);
        toast.show('Updated item in cart');
        navigation.goBack();
      } else {
        await addItem(line);
        const nextCount = totalCount + qty;
        toast.show(
          `Added to cart • ${nextCount} item${nextCount !== 1 ? 's' : ''} total`,
          { action: { label: 'View', onPress: () => navigation.navigate('Cart') } }
        );
      }
    } catch (e) {
      console.error('Cart operation failed', e);
      toast.show('Could not update cart');
    }
  };

  const isFav = has(item.id);
  const onSaveFav = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    const wasFav = isFav;
    await addFav({ id: item.id, name: item.name, img: item.img, selections: Object.entries(selections).map(([groupId, optionIds]) => ({ groupId, optionIds })) });
    toast.show(wasFav ? 'Favorite updated' : 'Saved to favorites');
  };
  const onRemoveFav = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    await removeFav(item.id);
    toast.show('Removed from favorites');
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor: theme.colors.card }} contentContainerStyle={{ paddingBottom:24 }}>
      <Image
        source={{ uri: item.img }}
        style={{
          width: '70%',
          aspectRatio: 2,
          alignSelf: 'center',
          marginTop: 12,
          borderRadius: 12,
          backgroundColor: '#F3F4F6',
        }}
        resizeMode="cover"
      />
      <View style={{ padding:16 }}>
        <Text style={{ fontSize:22, fontWeight:'800', marginBottom:6, color: theme.colors.text }}>{item.name}</Text>
        <Text style={{ fontSize:20, fontWeight:'900', color: theme.colors.text }}>${unitPrice.toFixed(2)}</Text>
        <Text style={{ color: theme.colors.muted, marginTop:2 }}>
          Base ${item.price.toFixed(2)}{priceDelta !== 0 ? `, Add-ons ${priceDelta > 0 ? '+' : ''}${priceDelta.toFixed(2)}` : ''}
        </Text>
        {!!item.description && <Text style={{ color: theme.colors.muted, marginTop:10 }}>{item.description}</Text>}

        {loading ? (
          <View style={{ paddingVertical:24 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {groups.map((g) => (
              <View
                key={g.id}
                style={{
                  marginBottom: 16,
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.tokens.radius.lg,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  shadowColor: theme.tokens.shadow.soft.color,
                  shadowOpacity: theme.tokens.shadow.soft.opacity,
                  shadowOffset: theme.tokens.shadow.soft.offset,
                  shadowRadius: theme.tokens.shadow.soft.radius,
                  elevation: theme.tokens.shadow.soft.elevation,
                }}
              >
                <Text style={{ fontSize:18, fontWeight:'800', color: theme.colors.text }}>
                  {g.name} {g.required ? '*' : ''}
                </Text>
                <Text style={{ color: theme.colors.muted, marginTop:4, fontSize:12 }}>
                  {g.multi ? `Choose ${g.min ?? 0}-${g.max ?? 99}` : 'Choose 1'}
                </Text>
                <View style={{ height: 1, backgroundColor: theme.colors.border, marginTop: 10, marginBottom: 6 }} />
                <View style={{ marginTop:4, gap:8 }}>
                  {g.options.map((opt) => {
                    const selected = (selections[g.id] ?? []).includes(opt.id);
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => toggleOption(g, opt.id)}
                        style={{
                          flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                          padding:12, borderRadius:12, borderWidth:1,
                          borderColor: selected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: selected ? theme.colors.primaryMutedBg : theme.colors.card
                        }}
                      >
                        <Text style={{ color: theme.colors.text }}>{opt.name}</Text>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                          {!!opt.priceDelta && opt.priceDelta !== 0 && (
                            <Text style={{ color: theme.colors.muted }}>
                              {opt.priceDelta > 0 ? `+${opt.priceDelta.toFixed(2)}` : `${opt.priceDelta.toFixed(2)}`}
                            </Text>
                          )}
                          <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor: selected ? theme.colors.primary : '#9ca3af', backgroundColor: selected ? theme.colors.primary : 'transparent' }} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Customer note */}
            <View
              style={{
                marginTop: 8,
                backgroundColor: theme.colors.card,
                borderRadius: theme.tokens.radius.lg,
                padding: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: theme.tokens.shadow.soft.color,
                shadowOpacity: theme.tokens.shadow.soft.opacity,
                shadowOffset: theme.tokens.shadow.soft.offset,
                shadowRadius: theme.tokens.shadow.soft.radius,
                elevation: theme.tokens.shadow.soft.elevation,
              }}
            >
              <Text style={{ fontSize:16, fontWeight:'800' }}>Add a note</Text>
              <View style={{ height: 1, backgroundColor: theme.colors.border, marginTop: 10, marginBottom: 8 }} />
              <TextInput
                placeholder="e.g., no onions, extra napkins"
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={(t) => setNote(t.slice(0, 200))}
                multiline
                numberOfLines={3}
                style={{
                  borderWidth:1,
                  borderColor: theme.colors.border,
                  borderRadius:12,
                  paddingHorizontal:12,
                  paddingVertical:10,
                  minHeight:80,
                  textAlignVertical:'top',
                }}
              />
              <Text style={{ color:'#9ca3af', fontSize:12, marginTop:6 }}>{note.length}/200</Text>
            </View>

            {/* Quantity and totals */}
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop: 8 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                <TouchableOpacity onPress={() => setQty((q: number) => Math.max(1, q - 1))} style={{ borderWidth:1, borderColor:'#e5e7eb', paddingHorizontal:12, paddingVertical:6, borderRadius:8 }}>
                  <Text style={{ fontSize:18, fontWeight:'800' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ fontSize:16, fontWeight:'800' }}>{qty}</Text>
                <TouchableOpacity onPress={() => setQty((q: number) => q + 1)} style={{ borderWidth:1, borderColor:'#e5e7eb', paddingHorizontal:12, paddingVertical:6, borderRadius:8 }}>
                  <Text style={{ fontSize:18, fontWeight:'800' }}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize:18, fontWeight:'900', color: theme.colors.text }}>Total ${total.toFixed(2)}</Text>
            </View>

            {!canOrder && (
              <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, padding: 10, borderRadius: 10, marginTop: 8 }}>
                <Text style={{ color: '#92400E' }}>We’re currently closed. Browsing only.</Text>
              </View>
            )}
            <TouchableOpacity disabled={!canAdd || !canOrder} onPress={onAddToCart} style={{ backgroundColor: canAdd && canOrder ? theme.colors.primaryDark : '#9ca3af', padding:14, borderRadius:12, alignItems:'center', marginTop:16 }}>
              <Text style={{ color:'#fff', fontWeight:'800' }}>{canOrder ? `Add to Cart — $${total.toFixed(2)}` : 'Closed'}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
              <TouchableOpacity onPress={onSaveFav} style={{ flex:1, backgroundColor: theme.colors.primaryMutedBg, padding:12, borderRadius:12, alignItems:'center' }}>
                <Text style={{ color: theme.colors.primaryDark, fontWeight:'700' }}>{isFav ? 'Update Favorite' : 'Save to Favorites'}</Text>
              </TouchableOpacity>
              {isFav && (
                <TouchableOpacity onPress={onRemoveFav} style={{ padding:12, borderRadius:12, alignItems:'center', backgroundColor: theme.colors.destructiveBg }}>
                  <Text style={{ color: theme.colors.destructiveText, fontWeight:'800' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:12, alignItems:'center' }}>
          <Text style={{ color: theme.colors.muted }}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
