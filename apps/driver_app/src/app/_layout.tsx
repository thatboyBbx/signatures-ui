import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DriverProvider, useDriver } from '../operations/DriverProvider';
import { SignInScreen } from '../operations/screens';
import { colors } from '../theme/theme';

function Gate() {
  const store = useDriver();
  if (store.starting) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><ActivityIndicator color={colors.espresso} /></View>;
  return store.identity ? <Slot /> : <SignInScreen />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSerifDisplay: require('../../assets/fonts/DMSerifDisplay-Regular.ttf'),
    DMSerifDisplayItalic: require('../../assets/fonts/DMSerifDisplay-Italic.ttf'),
    DMSans: require('../../assets/fonts/DMSans-400.ttf'),
    DMSansMedium: require('../../assets/fonts/DMSans-500.ttf'),
    DMSansSemibold: require('../../assets/fonts/DMSans-600.ttf'),
    DMSansBold: require('../../assets/fonts/DMSans-700.ttf'),
  });
  if (error) return <View style={{ flex: 1, padding: 30, justifyContent: 'center', backgroundColor: colors.background }}><Text>Fonts could not load. Restart the app to retry.</Text></View>;
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><ActivityIndicator color={colors.espresso} /></View>;
  return <SafeAreaProvider><StatusBar style="dark" /><DriverProvider><Gate /></DriverProvider></SafeAreaProvider>;
}
