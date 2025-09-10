import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInEmail } from '../../data/repositories/AuthRepo';
import { isValidEmail } from '../../utils/validation';
import { friendlyAuthError } from '../../utils/firebaseErrors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/AppNavigator';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onLogin = async () => {
    setErr(null);
    const em = email.trim();
    if (!isValidEmail(em)) return setErr('Enter a valid email');
    if (!password) return setErr('Enter your password');
    setBusy(true);
    try {
      await signInEmail(em, password);
      // onAuthStateChanged will drive navigation (VerifyEmail or Home)
    } catch (e: any) {
      setErr(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      paddingHorizontal: 24, 
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: '#fafafa' 
    }}>
      {/* Header Section */}
      <View style={{ marginBottom: 48, alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: '#111827',
          marginBottom: 8
        }}>
          Welcome Back
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 24
        }}>
          Sign in to your account
        </Text>
      </View>

      {/* Form Container */}
      <View style={{ 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8
      }}>
        {/* Error Message */}
        {err ? (
          <View style={{
            backgroundColor: '#fef2f2',
            borderLeftWidth: 4,
            borderLeftColor: '#ef4444',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <Text style={{ 
              color: '#dc2626',
              fontSize: 14,
              fontWeight: '500'
            }}>
              {err}
            </Text>
          </View>
        ) : null}

        {/* Input Fields */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: 8,
            marginLeft: 4
          }}>
            Email Address
          </Text>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ 
              borderWidth: 2,
              borderColor: '#f3f4f6',
              backgroundColor: '#f9fafb',
              borderRadius: 16,
              padding: 16,
              fontSize: 16,
              color: '#111827',
              marginBottom: 16
            }}
            placeholderTextColor="#9ca3af"
          />
          
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: 8,
            marginLeft: 4
          }}>
            Password
          </Text>
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ 
              borderWidth: 2,
              borderColor: '#f3f4f6',
              backgroundColor: '#f9fafb',
              borderRadius: 16,
              padding: 16,
              fontSize: 16,
              color: '#111827'
            }}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity 
          onPress={onLogin} 
          disabled={busy} 
          style={{ 
            backgroundColor: busy ? '#9ca3af' : '#111827',
            padding: 18,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <Text style={{ 
            color: 'white', 
            fontWeight: '700',
            fontSize: 16,
            letterSpacing: 0.5
          }}>
            {busy ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Signup Link */}
        <TouchableOpacity 
          onPress={() => navigation.replace('Signup')} 
          style={{ 
            alignItems: 'center', 
            padding: 8
          }}
        >
          <Text style={{ 
            color: '#6b7280',
            fontSize: 15
          }}>
            New here?{' '}
            <Text style={{ 
              color: '#111827', 
              fontWeight: '700'
            }}>
              Create an account
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}