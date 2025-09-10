import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';

export default function ItemDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ItemDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { name, img, description, price } = route.params;

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#fff' }} contentContainerStyle={{ paddingBottom:24 }}>
      <Image source={{ uri: img }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
      <View style={{ padding:16 }}>
        <Text style={{ fontSize:22, fontWeight:'800', marginBottom:8 }}>{name}</Text>
        <Text style={{ color:'#6b7280', marginBottom:16 }}>{description}</Text>
        <Text style={{ fontSize:20, fontWeight:'900', color:'#4f46e5' }}>${price.toFixed(2)}</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={{ backgroundColor:'#111827', padding:14, borderRadius:12, alignItems:'center', marginTop:16 }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:12, alignItems:'center' }}>
          <Text style={{ color:'#6b7280' }}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

