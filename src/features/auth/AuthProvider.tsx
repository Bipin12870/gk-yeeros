import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { ActivityIndicator, View } from 'react-native';

type AuthContextType = {
  user: User | null;
  verified: boolean;
};
const AuthContext = createContext<AuthContextType>({ user: null, verified: false });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u ?? null);
      setBooting(false);
    });
    return unsub;
  }, []);

  if (booting) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, verified: !!user?.emailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}