import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/menu/HomeScreen';
import SignupScreen from '../features/auth/SignupScreen';
import VerifyEmailScreen from '../features/auth/VerifyEmailScreen';
import LoginScreen from '../features/auth/LoginScreen';
import CartScreen from '../features/cart/CartScreen';
import FavoritesScreen from '../features/favorites/FavoritesScreen';
import ItemDetailScreen from '../features/menu/ItemDetailScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import { useAuth } from '../features/auth/AuthProvider';
import TeamScreen from '../features/about/TeamScreen'; // ✅ fixed path

export type RootStackParamList = {
  Home: undefined;
  Signup: undefined;
  Login: undefined;
  VerifyEmail: undefined;
  Cart: undefined;
  Favorites: undefined;
  // If your ItemDetail navigate() passes a whole item object, loosen this to `any`
  ItemDetail: any;
  Profile: undefined;
  Team: undefined;
  OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, verified } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: 'Sign Up' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Sign In' }} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: true, title: 'Item' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Cart' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Favorites' }} />
            <Stack.Screen name="Team" component={TeamScreen} options={{ headerShown: true, title: 'Our Team' }} />
            <Stack.Screen name="OrderDetail" component={require('../features/orders/OrderDetailScreen').default} options={{ headerShown: true, title: 'Order' }} />
          </>
        )}

        {user && !verified && (
          <>
            {/* Allow browsing while unverified */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: true, title: 'Item' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Cart' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Favorites' }} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: true, title: 'Verify Email' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: 'Sign Up' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Sign In' }} />
            {/* Include Team so footer button still works before verification */}
            <Stack.Screen name="Team" component={TeamScreen} options={{ headerShown: true, title: 'Our Team' }} />
            <Stack.Screen name="OrderDetail" component={require('../features/orders/OrderDetailScreen').default} options={{ headerShown: true, title: 'Order' }} />
          </>
        )}

        {user && verified && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true, title: 'Cart' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Favorites' }} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: true, title: 'Item' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Profile' }} />
            <Stack.Screen name="Team" component={TeamScreen} options={{ headerShown: true, title: 'Our Team' }} />
            <Stack.Screen name="OrderDetail" component={require('../features/orders/OrderDetailScreen').default} options={{ headerShown: true, title: 'Order' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
