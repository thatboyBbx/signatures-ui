import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PaymentMethod,
  useCheckout,
} from '../../../context/CheckoutContext';

import { colors, radius, spacing, fonts } from '../../../theme/theme';

const methods: PaymentMethod[] = [
  {
    id: 'cash',
    label: 'Cash',
    detail: 'Pay on delivery or at branch collection',
    icon: 'cash-outline',
  },
];

export function PaymentScreen() {
  const navigation = useNavigation();

  const {
    paymentMethod,
    setPaymentMethod,
  } = useCheckout();

  const selectMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.title}>
          Payment
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>
          How would you like to pay?
        </Text>

        <Text style={styles.description}>
          Select a payment method for this order.
        </Text>

        <View style={styles.list}>
          {methods.map((method) => {
            const selected =
              paymentMethod?.id === method.id;

            return (
              <Pressable
                key={method.id}
                style={[
                  styles.method,
                  selected && styles.methodSelected,
                ]}
                onPress={() => selectMethod(method)}
              >
                <View
                  style={[
                    styles.methodIcon,
                    selected &&
                      styles.methodIconSelected,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={22}
                    color={
                      selected
                        ? colors.surface
                        : colors.primary
                    }
                  />
                </View>

                <View style={styles.methodContent}>
                  <Text style={styles.methodName}>
                    {method.label}
                  </Text>

                  <Text style={styles.methodDetail}>
                    {method.detail}
                  </Text>
                </View>

                <Ionicons
                  name={
                    selected
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={24}
                  color={
                    selected
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '400',
    color: colors.text,
  },

  content: {
    padding: spacing.xl,
  },

  heading: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '400',
    color: colors.text,
  },

  description: {
    fontFamily: fonts.body,
    marginTop: 7,
    fontSize: 14,
    color: colors.textSecondary,
  },

  list: {
    marginTop: 26,
    gap: 12,
  },

  method: {
    minHeight: 82,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  methodSelected: {
    borderColor: colors.primary,
  },

  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  methodIconSelected: {
    backgroundColor: colors.primary,
  },

  methodContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  methodName: {
    fontFamily: fonts.heavy,
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },

  methodDetail: {
    fontFamily: fonts.body,
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
