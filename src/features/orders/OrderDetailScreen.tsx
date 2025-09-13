import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../app/AppNavigator';
import { watchOrder, type OrderRecord } from '../../data/repositories/OrderRepo';
import { theme } from '../../theme';

export default function OrderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const { orderId } = route.params as { orderId: string };
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = watchOrder('MAIN', orderId, (o) => { setOrder(o); setLoading(false); });
    return () => unsub();
  }, [orderId]);

  const createdDate = useMemo(() => {
    const d = order?.createdAt?.toDate ? order.createdAt.toDate() as Date : null;
    return d ? d.toLocaleString() : '';
  }, [order?.createdAt]);

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.background, padding: 16 }}>
        <Text style={{ color: theme.colors.muted }}>Order not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text }}>Order #{order.id.slice(-6).toUpperCase()}</Text>
        {!!createdDate && <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{createdDate}</Text>}
        <View style={{ marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#e5e7eb' }}>
          <Text style={{ fontWeight: '700', color: '#1f2937', fontSize: 12 }}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={{ marginTop: 12, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
        {order.items.map((it, idx) => (
          <View key={idx} style={{ padding: 12, borderTopWidth: idx === 0 ? 0 : 1, borderColor: theme.colors.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={{ fontWeight:'800', color: theme.colors.text }}>{it.name} × {it.quantity}</Text>
              <Text style={{ fontWeight:'900', color: theme.colors.text }}>${(it.unitPrice * it.quantity).toFixed(2)}</Text>
            </View>
            <Text style={{ color: theme.colors.muted, marginTop: 2 }}>Unit ${it.unitPrice.toFixed(2)}</Text>
            {it.selectionDetails && it.selectionDetails.length > 0 && (
              <View style={{ marginTop: 6 }}>
                {it.selectionDetails.map((g) => (
                  <Text key={g.groupId} style={{ color: theme.colors.muted }}>
                    {g.groupName}: {g.options.map(o => o.name).join(', ')}
                  </Text>
                ))}
              </View>
            )}
            {!!it.note && (
              <Text style={{ color: '#374151', marginTop: 6, fontStyle: 'italic' }}>Note: {it.note}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 12, alignItems:'flex-end' }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: theme.colors.text }}>Total ${order.totalAmount.toFixed(2)}</Text>
      </View>
    </ScrollView>
  );
}
