import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { useCheckout } from '../../../context/CheckoutContext';
import { colors, fonts } from '../../../theme/theme';
import { AtmosphereProvider } from '../../../context/AtmosphereContext';
import { AtmosphereVideo } from '../../../components/AtmosphereVideo';
import { ParamountHeader } from '../../../components/ParamountHeader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';

export function AddressScreen() {
  return <AtmosphereProvider><DeliveryAddressContent /></AtmosphereProvider>;
}

function DeliveryAddressContent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { address, setAddress } = useCheckout();
  const [label, setLabel] = useState(address?.label ?? 'Home');
  const [value, setValue] = useState(address?.address ?? '');
  const [attempted, setAttempted] = useState(false);
  const custom = label !== 'Home' && label !== 'Work';
  function save() {
    setAttempted(true);
    if (!label.trim() || !value.trim()) return;
    setAddress({ id: address?.id ?? 'delivery-address', label: label.trim(), address: value.trim() });
    navigation.goBack();
  }
  return <SafeAreaView edges={['bottom']} style={styles.screen}>
    <StatusBar style={focused ? 'light' : 'dark'} />
    <ParamountHeader onCart={() => navigation.navigate('Cart')} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { paddingTop: insets.top + 88 }]}>
          <AtmosphereVideo variant="delivery" />
          <LinearGradient pointerEvents="none" colors={['rgba(15,12,9,0.2)', 'rgba(15,12,9,0.05)', '#19130F']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          <Pressable accessibilityLabel="Back" accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={colors.onDark} /></Pressable>
          <Text accessibilityRole="header" style={styles.title}>Delivery</Text>
        </View>
        <View style={styles.panelWrap}>
          <View style={styles.panel}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image accessible={false} source={require('../../../../assets/paramount/walnut-grain.webp')} resizeMode="repeat" style={styles.grain} /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,15,11,0.4)' }]} /></View>
            <View style={styles.chips}>
              {(['Home', 'Work', 'Other'] as const).map(option => {
                const selected = option === 'Other' ? custom : label === option;
                return <Pressable key={option} accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected }} style={[styles.chip, selected && styles.selected]} onPress={() => setLabel(option)}>
                  <View style={[styles.chipIcon, selected && styles.selectedIcon]}><Ionicons name={option === 'Home' ? 'home-outline' : option === 'Work' ? 'briefcase-outline' : 'location-outline'} size={23} color={selected ? '#241A12' : '#C6A77E'} /></View>
                  <Text style={[styles.chipText, selected && styles.selectedText]}>{option}</Text>
                  <View style={[styles.selectionLine, selected && styles.activeLine]} />
                </Pressable>;
              })}
            </View>
            <View style={styles.fields}>
              {custom && <TextInput accessibilityLabel="Address label" placeholder="Address name" placeholderTextColor="#BDA98F" value={label} onChangeText={setLabel} maxLength={80} style={[styles.nameInput, attempted && !label.trim() && styles.invalid]} />}
              {attempted && !label.trim() && <Text accessibilityRole="alert" style={styles.error}>Enter an address name.</Text>}
              <View style={styles.addressLabel}><Ionicons name="navigate-outline" size={17} color={colors.gold} /><Text style={styles.caption}>DELIVER TO</Text></View>
              <TextInput accessibilityLabel="Full delivery address" placeholder={'Street address\nArea, city'} placeholderTextColor="#BDA98F" textContentType="fullStreetAddress" autoComplete="street-address" value={value} onChangeText={setValue} multiline maxLength={500} style={[styles.addressInput, attempted && !value.trim() && styles.invalid]} />
              {attempted && !value.trim() && <Text accessibilityRole="alert" style={styles.error}>Enter your delivery address.</Text>}
            </View>
            <Pressable accessibilityRole="button" style={styles.save} onPress={save}>
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#38271B' }]} />
              <Text style={styles.saveText}>Use address</Text><View style={styles.arrow}><Ionicons name="arrow-forward" size={21} color="#241A12" /></View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#19130F' }, scroll: { paddingBottom: 30 },
  hero: { height: 300, paddingHorizontal: 26, backgroundColor: '#19130F', overflow: 'hidden' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C6A77E70', borderRadius: 22, backgroundColor: 'rgba(19,16,13,0.5)' },
  title: { position: 'absolute', left: 28, bottom: 61, fontFamily: fonts.heading, fontSize: 42, color: colors.onDark, letterSpacing: -0.6 },
  panelWrap: { marginTop: -35, paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  panel: { backgroundColor: '#302116', borderRadius: 22, borderWidth: 1, borderColor: '#A5885D80', overflow: 'hidden', padding: 22, boxShadow: '0px 16px 35px rgba(0,0,0,0.24)' },
  grain: { width: '100%', height: '100%', opacity: 0.32 },
  chips: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  chip: { flex: 1, minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 12, backgroundColor: '#1B140F80', borderWidth: 1, borderColor: '#AD90632B', paddingTop: 13, paddingBottom: 10 },
  selected: { backgroundColor: '#74553638', borderColor: '#C6A77E90' },
  chipIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  selectedIcon: { backgroundColor: '#C6A77E' },
  chipText: { fontFamily: fonts.medium, fontSize: 12, color: '#BDA98F' }, selectedText: { color: '#FFF4DF' },
  selectionLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: 'transparent' }, activeLine: { backgroundColor: '#C6A77E' },
  fields: { paddingTop: 8, gap: 13, marginBottom: 24 },
  caption: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.7, color: '#D5BD98' }, addressLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  nameInput: { minHeight: 46, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#AD906370', fontFamily: fonts.medium, fontSize: 15, color: colors.onDark },
  addressInput: { minHeight: 100, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#AD906370', fontFamily: fonts.body, fontSize: 17, lineHeight: 27, color: colors.onDark, textAlignVertical: 'top' },
  invalid: { borderColor: '#F4A383' }, error: { fontFamily: fonts.medium, fontSize: 12, color: '#F4A383' },
  save: { minHeight: 60, paddingLeft: 20, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BDA074', backgroundColor: '#302116', overflow: 'hidden', boxShadow: 'inset 0px 1px 0px rgba(255,239,209,0.14)' },
  saveText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFF4DF', letterSpacing: 0.2 }, arrow: { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C6A77E' },
});
