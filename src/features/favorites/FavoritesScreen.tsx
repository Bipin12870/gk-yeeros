import React from 'react';
import { View, Text } from 'react-native';

export default function FavoritesScreen() {
  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'800' }}>Favorites</Text>
      <Text style={{ color:'#6b7280', marginTop:8 }}>Your saved items will appear here.</Text>
    </View>
  );
}

