import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { useCart } from '../../state/stores/useCartStore';
import { useAuth } from '../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';
import { createPickupOrder } from '../../data/repositories/OrderRepo';
import { useToast } from '../../state/ui/ToastProvider';
import { watchStore } from '../../data/repositories/StoreRepo';
import type { StoreRecord } from '../../types/store';
import { isOpenNow } from '../../utils/openNow';

export default function CartScreen() {
  const { items, totalAmount, removeItem, clear } = useCart();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const [store, setStore] = useState<StoreRecord | null>(null);

  // Watch store for online flag and hours
  useEffect(() => {
    const unsub = watchStore('MAIN', (doc) => setStore(doc));
    return unsub;
  }, []);

  const canPlaceOrder = useMemo(() => {
    if (!store) return false;
    const online = store.online !== false; // default to true if missing
    const pickupEnabled = store.pickup?.enabled !== false; // default to true
    const open = isOpenNow(store.hours);
    return online && pickupEnabled && open;
  }, [store]);

  if (!user) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:20, backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize:22, fontWeight:'800', color: theme.colors.text }}>Your Cart</Text>
        <Text style={{ color: theme.colors.muted, marginTop:8, textAlign:'center' }}>Please sign in to add items and place an order.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop:12, backgroundColor: theme.colors.primaryDark, paddingHorizontal:16, paddingVertical:10, borderRadius:10 }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize:22, fontWeight:'800', color: theme.colors.text }}>Your Cart</Text>
        <Text style={{ color: theme.colors.muted, marginTop:8 }}>Cart is empty.</Text>
      </View>
    );
  }
  return (
    <View style={{ flex:1 }}>
      <FlatList
        data={items}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={{ padding:16 }}
        ItemSeparatorComponent={() => <View style={{ height:12 }} />}
        renderItem={({ item, index }) => (
          <View style={{ gap:12, padding:12, borderWidth:1, borderColor: theme.colors.border, borderRadius:12, backgroundColor: theme.colors.card }}>
            <View style={{ flexDirection:'row', gap:12 }}>
              {item.img ? (
                <Image source={{ uri: item.img }} style={{ width:64, height:64, borderRadius:8 }} />
              ) : (
                <View style={{ width:64, height:64, borderRadius:8, backgroundColor:'#f3f4f6' }} />
              )}
              <View style={{ flex:1 }}>
                <Text style={{ fontWeight:'800' }}>{item.name} × {item.quantity}</Text>
                <Text style={{ color: theme.colors.muted, marginTop:4 }}>Unit ${item.unitPrice.toFixed(2)}</Text>
              </View>
              <Text style={{ fontWeight:'900' }}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
            </View>
            {/* Selections */}
            {item.selectionDetails && item.selectionDetails.length > 0 && (
              <View style={{ marginTop:6 }}>
                {item.selectionDetails.map((g) => (
                  <Text key={g.groupId} style={{ color: theme.colors.muted }}>
                    {g.groupName}: {g.options.map(o => o.name).join(', ')}
                  </Text>
                ))}
              </View>
            )}
            {!!item.note && (
              <View style={{ marginTop:6 }}>
                <Text style={{ color:'#374151', fontStyle:'italic' }}>Note: {item.note}</Text>
              </View>
            )}
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:8, marginTop:8 }}>
              <TouchableOpacity onPress={() => {
                // navigate to edit
                navigation.navigate('ItemDetail', {
                  id: item.id,
                  name: item.name,
                  img: item.img,
                  price: item.basePrice,
                  modifierGroupIds: item.modifierGroupIds,
                  editIndex: index,
                  initialQty: item.quantity,
                  initialSelections: Object.fromEntries(item.selections.map(s => [s.groupId, s.optionIds])),
                  initialNote: item.note,
                });
              }} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor: theme.colors.primaryMutedBg }}>
                <Text style={{ color: theme.colors.primaryDark, fontWeight:'800' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(index)} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:8, backgroundColor: theme.colors.destructiveBg }}>
                <Text style={{ color: theme.colors.destructiveText, fontWeight:'800' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={{ marginTop:16, padding:12, borderTopWidth:1, borderColor: theme.colors.border }}>
            {!canPlaceOrder && (
              <View style={{ padding:12, borderRadius:10, backgroundColor: '#FEF3C7', borderWidth:1, borderColor: '#F59E0B', marginBottom:10 }}>
                <Text style={{ color: '#92400E' }}>
                  We’re currently closed. Please order during open hours.
                </Text>
              </View>
            )}
            <Text style={{ fontSize:18, fontWeight:'900', textAlign:'right' }}>Total ${totalAmount.toFixed(2)}</Text>
            <TouchableOpacity
              disabled={!canPlaceOrder}
              onPress={async () => {
                if (!canPlaceOrder) {
                  toast.show('We’re closed at the moment.');
                  return;
                }
                try {
                  if (!user) { navigation.navigate('Login'); return; }
                  await createPickupOrder('MAIN', { id: user.uid, name: user.displayName ?? null, email: user.email ?? null }, items, totalAmount);
                  toast.show('Order placed — we received your pickup order.');
                  await clear();
                } catch (e) {
                  toast.show('Order failed — please try again.');
                }
              }}
              style={{ marginTop:12, backgroundColor: canPlaceOrder ? theme.colors.primaryDark : '#9ca3af', padding:14, borderRadius:12, alignItems:'center' }}
            >
              <Text style={{ color:'#fff', fontWeight:'800' }}>{canPlaceOrder ? 'Place Order (Pickup)' : 'Closed'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
