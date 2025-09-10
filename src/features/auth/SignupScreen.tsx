import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signUpEmail } from '../../data/repositories/AuthRepo';
import { isValidEmail, isStrongPassword } from '../../utils/validation';
import { friendlyAuthError } from '../../utils/firebaseErrors';
import { getStore } from '../../data/repositories/StoreRepo';

export default function SignupScreen({ navigation }: any) {
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [showPwd,setShowPwd] = useState(false);
  const [agree,setAgree] = useState(false);
  const [termsUrl,setTermsUrl] = useState<string | null>(null);

  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState<string | null>(null);

  useEffect(() => {
    // Load Terms URL from Firestore /stores/MAIN
    (async () => {
      try {
        const store = await getStore(); // defaults to "MAIN"
        setTermsUrl(store?.legal?.termsUrl ?? null);
      } catch {
        // ignore – signup still works; just no link
      }
    })();
  }, []);

  const onSignup = async () => {
    setErr(null);
    const em = email.trim();
    if (!isValidEmail(em)) return setErr('Please enter a valid email address.');
    if (!isStrongPassword(password)) return setErr('Password should be at least 6 characters.');
    if (!agree) return setErr('You must agree to the Terms & Conditions to continue.');

    setBusy(true);
    try {
      await signUpEmail({ name: name.trim(), email: em, password, acceptTerms: agree });
      Alert.alert('Verify your email', 'We sent you a verification link. Please verify to continue.');
      // Take users directly to the verification screen
      navigation.replace('VerifyEmail');
    } catch (e: any) {
      setErr(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#fafafa',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40
    }}>
      {/* Header Section */}
      <View style={{ marginBottom: 48 }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: '#111827',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Welcome
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 24
        }}>
          Create your account to get started
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
        {/* Input Fields */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: 8,
            marginLeft: 4
          }}>
            Full Name
          </Text>
          <TextInput
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
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

          {/* Password with show/hide toggle */}
          <View style={{
            borderWidth: 2,
            borderColor: '#f3f4f6',
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <TextInput
              placeholder="Create a secure password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              style={{ 
                flex: 1,
                padding: 16,
                fontSize: 16,
                color: '#111827'
              }}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity onPress={() => setShowPwd(s => !s)} style={{ paddingHorizontal: 6, paddingVertical: 8 }}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms & Conditions */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setAgree(a => !a)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <View style={{
            width: 20, height: 20, borderRadius: 6, borderWidth: 2,
            borderColor: agree ? '#111827' : '#d1d5db',
            backgroundColor: agree ? '#111827' : 'transparent',
            alignItems: 'center', justifyContent: 'center'
          }}>
            {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={{ color: '#374151', marginLeft: 8, flexShrink: 1 }}>
            I agree to the{' '}
            <Text
              style={{ color: '#111827', fontWeight: '700', textDecorationLine: 'underline' }}
              onPress={() => termsUrl && Linking.openURL(termsUrl)}
            >
              Terms & Conditions
            </Text>
          </Text>
        </TouchableOpacity>

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

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={onSignup}
          disabled={busy || !agree}
          style={{ 
            backgroundColor: busy || !agree ? '#9ca3af' : '#111827',
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
            {busy ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity 
          onPress={() => navigation.replace('Login')} 
          style={{ 
            alignItems: 'center',
            padding: 8
          }}
        >
          <Text style={{ 
            color: '#6b7280',
            fontSize: 15
          }}>
            Already have an account?{' '}
            <Text style={{ 
              fontWeight: '700',
              color: '#111827'
            }}>
              Sign In
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
