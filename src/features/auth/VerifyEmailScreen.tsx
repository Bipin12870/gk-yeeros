import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from './AuthProvider';
import { resendVerification } from '../../data/repositories/AuthRepo';
import { auth } from '../../lib/firebase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';
import { deleteUser } from 'firebase/auth';

export default function VerifyEmailScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [busy, setBusy] = useState(false);

  const onResend = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await resendVerification(user);
      Alert.alert('Verification email sent', 'Please check your inbox (and spam).');
    } catch (e: any) {
      Alert.alert('Could not send email', e?.message || 'Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex:1, padding:24, justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'800', marginBottom:8 }}>Confirm your email</Text>
      <Text style={{ color:'#4b5563', marginBottom:16 }}>
        We sent a verification link to:
      </Text>
      <Text style={{ fontWeight:'700', marginBottom:16 }}>{user?.email}</Text>
      <Text style={{ color:'#6b7280', marginBottom:24 }}>
        After verifying, reopen the app to continue.
      </Text>

      <TouchableOpacity
        onPress={onResend}
        disabled={busy}
        style={{ backgroundColor:'black', padding:14, borderRadius:12, alignItems:'center', marginBottom:10 }}
      >
        <Text style={{ color:'white', fontWeight:'700' }}>
          {busy ? 'Sending…' : 'Resend verification email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          if (busy) return;
          setBusy(true);
          try {
            if (user) {
              try { await deleteUser(user); } catch (e) { /* ignore if cannot delete */ }
            }
            await auth.signOut();
          } finally {
            // Navigate to Signup instead of Home with a reset
            navigation.reset({ index: 0, routes: [{ name: 'Signup' }] });
            setBusy(false);
          }
        }}
        style={{ padding:12, alignItems:'center' }}
      >
        <Text style={{ color:'#ef4444', fontWeight:'700' }}>Use a different email</Text>
      </TouchableOpacity>
    </View>
  );
}
