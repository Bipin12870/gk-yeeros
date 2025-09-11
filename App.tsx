// App.tsx
import 'react-native-reanimated'; // must be first
import React from 'react';
import { AuthProvider } from './src/features/auth/AuthProvider';
import AppNavigator from './src/app/AppNavigator';
import { CartProvider } from './src/state/stores/useCartStore';
import { FavoritesProvider } from './src/state/stores/useFavoritesStore';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
