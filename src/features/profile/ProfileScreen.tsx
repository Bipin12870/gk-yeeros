import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthProvider';
import { auth, db } from '../../lib/firebase';
import { updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { sendReset } from '../../data/repositories/AuthRepo';
import { watchUserOrders, type OrderRecord } from '../../data/repositories/OrderRepo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthBusy, setReauthBusy] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const email = user?.email || '';
  const joinDate = useMemo(() => (
    user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown'
  ), [user?.metadata?.creationTime]);

  const avatar = useMemo(() => {
    if (imageError || !user?.photoURL) {
      return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || 'User')}&size=128&background=3b82f6&color=fff&bold=true` };
    }
    return { uri: user.photoURL };
  }, [imageError, user?.photoURL, name, email]);

  // Header is provided by navigator; sign out moved near avatar below.

  // Prefill additional fields from users/{uid}
  React.useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? snap.data() as any : null;
        if (data) {
          if (typeof data.phone === 'string') setPhone(data.phone);
          if (typeof data.address === 'string') setAddress(data.address);
          // photo URL editing removed from Contact & Preferences
          if (typeof data.specialNote === 'string') setSpecialNote(data.specialNote);
        }
      } catch {}
    })();
  }, [user?.uid]);

  // Watch past orders for this user
  useEffect(() => {
    if (!user) { setOrders([]); setOrdersLoading(false); setOrdersError(null); return; }
    setOrdersLoading(true);
    setOrdersError(null);
    const unsub = watchUserOrders(
      'MAIN',
      user.uid,
      (list) => { setOrders(list); setOrdersLoading(false); },
      (e) => { setOrders([]); setOrdersLoading(false); setOrdersError('Could not load orders.'); }
    );
    return () => unsub();
  }, [user?.uid]);

  const onSaveName = async () => {
    if (!user) return;
    const newName = name.trim();
    if (newName.length === 0) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user, { displayName: newName });
      try {
        await updateDoc(doc(db, 'users', user.uid), { displayName: newName, updatedAt: serverTimestamp() });
      } catch {/* ignore if user doc missing */}
      Alert.alert('Saved', 'Your name has been updated.');
      setNameMsg('Name updated successfully.');
    } catch (e: any) {
      Alert.alert('Could not update name', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onSaveDetails = async () => {
    if (!user) return;
    setDetailsMsg(null);
    setDetailsSaving(true);
    try {
      const update: any = {
        updatedAt: serverTimestamp(),
      };
      if (phone.trim() !== '') update.phone = phone.trim();
      if (address.trim() !== '') update.address = address.trim();
      if (specialNote.trim() !== '') update.specialNote = specialNote.trim();
      if (Object.keys(update).length > 1) {
        await updateDoc(doc(db, 'users', user.uid), update);
      }

      setDetailsMsg('Profile details updated successfully.');
    } catch (e: any) {
      Alert.alert('Could not save details', e?.message || 'Please try again.');
    } finally {
      setDetailsSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!email) {
      Alert.alert('No email', 'This account has no email to reset.');
      return;
    }
    setResetting(true);
    try {
      await sendReset(email);
      Alert.alert('Reset link sent', 'Check your inbox to reset your password.');
      setResetMsg(`Reset link sent to ${email}.`);
    } catch (e: any) {
      Alert.alert('Could not send reset', e?.message || 'Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const performDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const uid = user.uid;
      // Delete favorites subcollection
      try {
        const favCol = collection(db, 'users', uid, 'favorites');
        const favSnap = await getDocs(favCol);
        await Promise.all(favSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch {}

      // Delete cart doc
      try { await deleteDoc(doc(db, 'users', uid, 'cart', 'current')); } catch {}

      // Delete user profile doc
      try { await deleteDoc(doc(db, 'users', uid)); } catch {}

      // Finally delete auth user (may require recent login)
      try {
        await deleteUser(user);
        Alert.alert('Account deleted', 'Your account and data have been removed.');
        // Ensure logged out and navigate home
        try { await auth.signOut(); } catch {}
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } catch (e: any) {
        if (e?.code === 'auth/requires-recent-login') {
          setNeedsReauth(true);
          Alert.alert('Reauthentication required', 'Please re-enter your password to delete your account.');
        } else {
          Alert.alert('Could not delete account', e?.message || 'Please try again.');
        }
        setDeleting(false);
        return;
      }
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!user) return;
    if (Platform.OS === 'web') {
      // On web, React Native's Alert doesn't support multiple buttons; use confirm()
      const confirmed = typeof window !== 'undefined' && window.confirm(
        'This will permanently delete your account and personal data (profile, favorites, and cart). This cannot be undone. Continue?'
      );
      if (confirmed) {
        await performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and personal data (profile, favorites, and cart). This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]
    );
  };

  const onConfirmReauthAndDelete = async () => {
    if (!user) return;
    if (!user.email) {
      Alert.alert('No email on account', 'Cannot reauthenticate without an email. Please sign out and sign in again.');
      return;
    }
    const pwd = reauthPassword.trim();
    if (pwd.length < 6) {
      Alert.alert('Password required', 'Please enter your password to continue.');
      return;
    }
    setReauthBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwd);
      await reauthenticateWithCredential(user, cred);
      setNeedsReauth(false);
      setReauthPassword('');
      await performDelete();
    } catch (e: any) {
      Alert.alert('Reauthentication failed', e?.message || 'Please double-check your password.');
    } finally {
      setReauthBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#1f2937' }}>Profile</Text>
        </View>

        {/* Profile Summary (keep as is) */}
        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24, position: 'relative' }}>
          <TouchableOpacity
            onPress={async () => { try { await auth.signOut(); } catch (e) { Alert.alert('Error', 'Failed to sign out.'); } }}
            style={{ position: 'absolute', top: 8, right: 24, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={18} color="#B91C1C" />
            <Text style={{ color: '#B91C1C', fontWeight: '800' }}>Sign Out</Text>
          </TouchableOpacity>
          <Image source={avatar} onError={() => setImageError(true)} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', marginBottom: 12 }} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#1f2937' }}>{name || 'Guest User'}</Text>
          {!!email && <Text style={{ fontSize: 16, color: '#6b7280' }}>{email}</Text>}
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>Member since</Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>{joinDate}</Text>
          </View>
        </View>

        {/* Edit Name */}
        <View style={{ marginHorizontal: 24, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Edit Name</Text>
          {nameMsg ? (
            <View style={{
              backgroundColor: '#ecfdf5',
              borderLeftWidth: 4,
              borderLeftColor: '#10b981',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12
            }}>
              <Text style={{ color: '#065f46', fontWeight: '600' }}>{nameMsg}</Text>
            </View>
          ) : null}
          <TextInput
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            style={{ borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827', marginBottom: 12 }}
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity onPress={onSaveName} disabled={saving} style={{ backgroundColor: saving ? '#9ca3af' : '#111827', padding: 14, borderRadius: 12, alignItems: 'center' }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Password Reset */}
        <View style={{ marginHorizontal: 24, marginTop: 16, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Password</Text>
          <Text style={{ color: '#6b7280', marginBottom: 12 }}>Send a password reset link to your email.</Text>
          {resetMsg ? (
            <View style={{
              backgroundColor: '#ecfdf5',
              borderLeftWidth: 4,
              borderLeftColor: '#10b981',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12
            }}>
              <Text style={{ color: '#065f46', fontWeight: '600' }}>{resetMsg}</Text>
            </View>
          ) : null}
          <TouchableOpacity onPress={onResetPassword} disabled={resetting} style={{ backgroundColor: resetting ? '#9ca3af' : '#111827', padding: 14, borderRadius: 12, alignItems: 'center' }}>
            {resetting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Send reset link</Text>}
          </TouchableOpacity>
        </View>

        {/* Contact, Address, Photo, Allergies/Notes */}
        <View style={{ marginHorizontal: 24, marginTop: 16, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Contact & Preferences</Text>
          {detailsMsg ? (
            <View style={{
              backgroundColor: '#ecfdf5',
              borderLeftWidth: 4,
              borderLeftColor: '#10b981',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12
            }}>
              <Text style={{ color: '#065f46', fontWeight: '600' }}>{detailsMsg}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginLeft: 4 }}>Phone</Text>
          <TextInput
            placeholder="Your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 16, color: '#111827', marginBottom: 12 }}
            placeholderTextColor="#9ca3af"
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginLeft: 4 }}>Address</Text>
          <TextInput
            placeholder="Your delivery address"
            value={address}
            onChangeText={setAddress}
            multiline
            style={{ borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 16, color: '#111827', minHeight: 64, textAlignVertical: 'top', marginBottom: 12 }}
            placeholderTextColor="#9ca3af"
          />


          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginLeft: 4 }}>Allergies / Special Requests</Text>
          <TextInput
            placeholder="Any allergies or special requests"
            value={specialNote}
            onChangeText={setSpecialNote}
            multiline
            style={{ borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 16, color: '#111827', minHeight: 72, textAlignVertical: 'top', marginBottom: 12 }}
            placeholderTextColor="#9ca3af"
          />

          <TouchableOpacity onPress={onSaveDetails} disabled={detailsSaving} style={{ backgroundColor: detailsSaving ? '#9ca3af' : '#111827', padding: 14, borderRadius: 12, alignItems: 'center' }}>
            {detailsSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Save details</Text>}
          </TouchableOpacity>
        </View>

        {/* Past Orders */}
        <View style={{ marginHorizontal: 24, marginTop: 16, backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Past Orders</Text>
          {ordersLoading ? (
            <View style={{ paddingVertical: 8 }}>
              <ActivityIndicator />
            </View>
          ) : ordersError ? (
            <Text style={{ color: '#ef4444' }}>Could not load orders.</Text>
          ) : orders.length === 0 ? (
            <Text style={{ color: '#6b7280' }}>You don’t have any past orders yet.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {orders.map((o) => {
                const created = o.createdAt?.toDate ? o.createdAt.toDate() as Date : undefined;
                const dateText = created ? created.toLocaleString() : '';
                const itemsText = o.items?.map((it) => `${it.name} × ${it.quantity}`).join(' · ');
                const statusColor = o.status === 'completed' ? '#065f46' : o.status === 'cancelled' ? '#991B1B' : '#1f2937';
                const statusBg = o.status === 'completed' ? '#ecfdf5' : o.status === 'cancelled' ? '#FEE2E2' : '#e5e7eb';
                return (
                  <TouchableOpacity key={o.id} onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })} activeOpacity={0.8} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '800', color: '#111827' }}>Order #{o.id.slice(-6).toUpperCase()}</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: statusBg }}>
                        <Text style={{ color: statusColor, fontWeight: '700', fontSize: 12 }}>{o.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    {!!dateText && <Text style={{ color: '#6b7280', marginTop: 4 }}>{dateText}</Text>}
                    {!!itemsText && <Text style={{ color: '#374151', marginTop: 6 }} numberOfLines={2}>{itemsText}</Text>}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontWeight: '900', color: '#111827' }}>${o.totalAmount.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={{ marginHorizontal: 24, marginTop: 20, backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FCA5A5' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#991B1B', marginBottom: 8 }}>Delete Account</Text>
          <Text style={{ color: '#7F1D1D', marginBottom: 12 }}>This will permanently delete your account, favorites, and cart. Orders already placed will remain for compliance and cannot be removed here.</Text>
          <TouchableOpacity onPress={onDeleteAccount} disabled={deleting} style={{ backgroundColor: '#DC2626', padding: 14, borderRadius: 12, alignItems: 'center' }}>
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Delete My Account</Text>}
          </TouchableOpacity>
          {needsReauth && (
            <View style={{ marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: '#991B1B', fontWeight: '700', marginBottom: 8 }}>Please re-enter your password</Text>
              <TextInput
                placeholder="Password"
                value={reauthPassword}
                onChangeText={setReauthPassword}
                secureTextEntry
                autoCapitalize="none"
                style={{ borderWidth: 2, borderColor: '#f3f4f6', backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 16, color: '#111827', marginBottom: 8 }}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={onConfirmReauthAndDelete} disabled={reauthBusy} style={{ backgroundColor: '#991B1B', padding: 12, borderRadius: 12, alignItems: 'center' }}>
                {reauthBusy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Confirm and Delete</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign Out moved to headerRight */}
      </ScrollView>
    </SafeAreaView>
  );
}
