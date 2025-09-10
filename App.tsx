// App.tsx
import 'react-native-reanimated'; // must be first
import React from 'react';
import { AuthProvider } from './src/features/auth/AuthProvider';
import AppNavigator from './src/app/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}