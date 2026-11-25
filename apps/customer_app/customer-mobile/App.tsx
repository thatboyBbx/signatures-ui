import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { colors } from './src/theme/theme';

import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { MenuProvider } from './src/context/MenuContext';
import { CheckoutProvider } from './src/context/CheckoutContext';
import { OrderProvider } from './src/context/OrderContext';
import { FavouritesProvider } from './src/context/FavouritesContext';
import { RatingsProvider } from './src/context/RatingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay: require('./assets/paramount/DMSerifDisplay-Regular.ttf'),
    DMSerifDisplayItalic: require('./assets/paramount/DMSerifDisplay-Italic.ttf'),
    DMSans: require('./assets/paramount/DMSans-400.ttf'),
    DMSansMedium: require('./assets/paramount/DMSans-500.ttf'),
    DMSansSemibold: require('./assets/paramount/DMSans-600.ttf'),
    DMSansBold: require('./assets/paramount/DMSans-700.ttf'),
    DMSansHeavy: require('./assets/paramount/DMSans-800.ttf'),
    ...(process.env.EXPO_PUBLIC_UI_PREVIEW === '1' ? { EtrixoDemo: require('./assets/paramount/Etrixo-DEMO.ttf') } : {}),
  });
  if (!fontsLoaded) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      {fontError ? <Text accessibilityRole="alert">Couldn't load the app. Please reopen it.</Text> : <ActivityIndicator color={colors.primary} />}
    </View>;
  }
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <CheckoutProvider>
              <MenuProvider><FavouritesProvider><RatingsProvider><StatusBar style="dark" />
              <View style={{ flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center' }}>
                <AppNavigator />
              </View>
            </RatingsProvider></FavouritesProvider></MenuProvider></CheckoutProvider>
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
