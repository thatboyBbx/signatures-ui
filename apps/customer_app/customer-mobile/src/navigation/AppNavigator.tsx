import { AtmosphereProvider, useAtmosphere } from '../context/AtmosphereContext';
import { ParamountTabBar } from '../components/ParamountTabBar';
import { ParamountHeader } from '../components/ParamountHeader';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigation, useIsFocused } from '@react-navigation/native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { SearchScreen } from '../features/search/screens/SearchScreen';
import { OrdersScreen } from '../features/orders/screens/OrdersScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

import { RestaurantScreen } from '../features/restaurant/screens/RestaurantScreen';
import { FoodDetailsScreen } from '../features/food/screens/FoodDetailsScreen';
import { CartScreen } from '../features/cart/screens/CartScreen';
import { CheckoutScreen } from '../features/checkout/screens/CheckoutScreen';

import { AddressScreen } from '../features/address/screens/AddressScreen';
import { VenueScreen } from '../features/venue/screens/VenueScreen';
import { BarScreen } from '../features/bar/screens/BarScreen';
import { PaymentScreen } from '../features/payment/screens/PaymentScreen';
import { OrderConfirmationScreen } from '../features/order-confirmation/screens/OrderConfirmationScreen';
import { OrderTrackingScreen } from '../features/order-tracking/screens/OrderTrackingScreen';
import { PersonalDetailsScreen } from '../features/account/screens/PersonalDetailsScreen';
import { FavouritesScreen } from '../features/account/screens/FavouritesScreen';
import { NotificationsScreen } from '../features/account/screens/NotificationsScreen';
import { SettingsScreen } from '../features/account/screens/SettingsScreen';

import { colors, fonts } from '../theme/theme';
import { Skeleton } from '../components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Restaurant: undefined;
  FoodDetails: {
    menuItemId?: string;
    name: string;
    price: string;
    image: string;
  };
  Cart: undefined;
  Checkout: undefined;
  Address: undefined;
  Venue: undefined;
  Bar: undefined;
  Payment: undefined;
  OrderConfirmation: {
    orderId: string;
  };
  OrderTracking: {
    orderId: string;
  };
  PersonalDetails: undefined;
  Favourites: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: { query?: string; category?: string; filters?: boolean } | undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return <AtmosphereProvider><MainTabsContent /></AtmosphereProvider>;
}

function MainTabsContent() {
  const { setOnHome } = useAtmosphere();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={{ flex: 1 }}>
    <StatusBar style={focused ? 'light' : 'dark'} />
    <ParamountHeader onCart={() => navigation.navigate('Cart')} />
    <Tab.Navigator
      tabBar={props => <ParamountTabBar {...props} />}
      screenListeners={{ state: event => { const state = event.data.state; setOnHome(state.routes[state.index ?? 0]?.name === 'Home'); } }}
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { paddingTop: route.name === 'Home' ? 0 : insets.top + 66 },

      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
    </View>
  );
}

export function AppNavigator() {
  const { customer, loading } = useAuth();

  if (loading) {
    return (
      // Skeleton in Home's shape (dark hero, cream sheet) while the saved session is checked.
      <View accessibilityLabel="Loading" style={styles.loading}>
        <View style={{ height: 360, backgroundColor: colors.black, padding: 24, justifyContent: 'flex-end', gap: 12 }}>
          <Skeleton tone="dark" width="70%" height={36} radius={10} />
          <Skeleton tone="dark" width="55%" height={36} radius={10} />
          <Skeleton tone="dark" width={150} height={44} radius={22} style={{ marginTop: 12 }} />
        </View>
        <View style={{ flex: 1, marginTop: -28, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: colors.background, padding: 20, gap: 16 }}>
          <Skeleton height={126} radius={22} />
          <Skeleton height={54} radius={27} />
          <Skeleton width="45%" height={26} />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer theme={{ dark: false, colors: {
      primary: colors.primary, background: colors.background, card: colors.surface,
      text: colors.text, border: colors.border, notification: colors.gold,
    }, fonts: {
      regular: { fontFamily: fonts.body, fontWeight: '400' },
      medium: { fontFamily: fonts.body, fontWeight: '400' },
      bold: { fontFamily: fonts.body, fontWeight: '400' },
      heavy: { fontFamily: fonts.body, fontWeight: '400' },
    } }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {customer ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Restaurant" component={RestaurantScreen} />
            <Stack.Screen name="Venue" component={VenueScreen} />
            <Stack.Screen name="Bar" component={BarScreen} />
            <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen
              name="OrderConfirmation"
              component={OrderConfirmationScreen}
            />
            <Stack.Screen
              name="OrderTracking"
              component={OrderTrackingScreen}
            />
            <Stack.Screen
              name="Address"
              component={AddressScreen}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
            />
            <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
            <Stack.Screen name="Favourites" component={FavouritesScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});






