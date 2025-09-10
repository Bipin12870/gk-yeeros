import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { auth } from '../../lib/firebase';

export default function ProfileScreen() {
  const { user } = useAuth();
  const name = user?.displayName || 'Guest';
  const email = user?.email || '';

  return (
    <View style={{ flex:1, backgroundColor:'#fff', padding:24 }}>
      <View style={{ alignItems:'center', marginTop:20, marginBottom:24 }}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/128' }}
          style={{ width:96, height:96, borderRadius:48, marginBottom:12 }}
        />
        <Text style={{ fontSize:20, fontWeight:'800' }}>{name}</Text>
        {!!email && <Text style={{ color:'#6b7280', marginTop:4 }}>{email}</Text>}
      </View>

      <View style={{ gap:12 }}>
        <TouchableOpacity style={{ padding:16, borderRadius:12, backgroundColor:'#f3f4f6' }}>
          <Text style={{ fontWeight:'700' }}>Edit profile (coming soon)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => auth.signOut()} style={{ padding:16, borderRadius:12, backgroundColor:'#ef4444' }}>
          <Text style={{ color:'#fff', fontWeight:'800', textAlign:'center' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

