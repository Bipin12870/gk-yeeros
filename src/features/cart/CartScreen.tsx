import React from 'react';
import { View, Text } from 'react-native';

export default function CartScreen() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'800' }}>Your Cart</Text>
      <Text style={{ color:'#6b7280', marginTop:8 }}>Cart functionality coming soon.</Text>
    </View>
  );
}

