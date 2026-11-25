import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../../context/AuthContext';
import { colors, radius, fonts } from '../../../theme/theme';

const options = [
  { label: 'Personal details', icon: 'person-outline' },
  { label: 'Saved addresses', icon: 'location-outline' },
  { label: 'Payment methods', icon: 'card-outline' },
  { label: 'Favourites', icon: 'heart-outline' },
  { label: 'Notifications', icon: 'notifications-outline' },
  { label: 'Settings', icon: 'settings-outline' },
] as const;

export function ProfileScreen() {
  const { customer, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const confirmSignOut = () => {
    if (Platform.OS === 'web') { navigation.navigate('Settings'); return; }
    Alert.alert(
      'Log out?',
      'You will need to log in again to access your orders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void signOut().catch((error) => {
              Alert.alert(
                'Could not log out',
                error instanceof Error
                  ? error.message
                  : 'Please try again.',
              );
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.user}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={27} color={colors.surface} />
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.name}>
            {customer?.fullName ?? 'Customer'}
          </Text>
          <Text style={styles.subtitle}>
            {customer?.email ?? customer?.phone ?? ''}
          </Text>
          {customer?.phone && (
            <Text style={styles.phone}>{customer.phone}</Text>
          )}
        </View>
      </View>

      <View style={styles.menu}>
        {options.map((option, index) => (
          <Pressable
            key={option.label}
            onPress={() => navigation.navigate(({ 'Personal details': 'PersonalDetails', 'Saved addresses': 'Address', 'Payment methods': 'Payment', Favourites: 'Favourites', Notifications: 'Notifications', Settings: 'Settings' } as const)[option.label])}
            style={[
              styles.row,
              index !== options.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={colors.text}
                />
              </View>

              <Text style={styles.rowText}>{option.label}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={confirmSignOut}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color={colors.error}
        />

        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  eyebrow: {
    fontFamily: fonts.heavy,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1.4,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.heading,
    marginTop: 7,
    fontSize: 30,
    fontWeight: '400',
    color: colors.text,
  },
  user: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  phone: {
    fontFamily: fonts.body,
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
  },
  menu: {
    marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  logoutButton: {
    height: 54,
    marginTop: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontFamily: fonts.heavy,
    color: colors.error,
    fontSize: 14,
    fontWeight: '400',
  },
});
