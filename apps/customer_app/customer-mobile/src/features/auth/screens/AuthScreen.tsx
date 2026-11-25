import { ParamountMark } from '../../../components/ParamountMark';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AtmosphereVideo } from '../../../components/AtmosphereVideo';
import { AtmosphereProvider } from '../../../context/AtmosphereContext';

import { useAuth } from '../../../context/AuthContext';
import { colors, radius, spacing, fonts } from '../../../theme/theme';

type Mode = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const { signIn, signUp, startPreview } = useAuth();
  const [mode, setMode] =
    useState<Mode>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] =
    useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const previewEnabled = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';
  const [showPassword, setShowPassword] = useState(false);
  const { height } = useWindowDimensions();

  const isSignUp = mode === 'sign-up';

  const submit = async () => {
    setFormError(null);
    if (
      !email.trim() ||
      !password ||
      (isSignUp && !fullName.trim())
    ) {
      setFormError('Please complete the required fields.');
      return;
    }

    if (password.length < 8) {
      setFormError('Use a password with at least 8 characters.');
      return;
    }

    try {
      setSubmitting(true);

      if (isSignUp) {
        const result = await signUp({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
        });

        if (result.requiresEmailConfirmation) {
          setFormError('Check your email to confirm your account, then log in.');
          setMode('sign-in');
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error) {
      setFormError(error instanceof TypeError
        ? 'The account server is unavailable in this local preview. No account was created.'
        : error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { height: Math.min(360, Math.max(270, height * 0.38)) }]}>
            <AtmosphereProvider><AtmosphereVideo variant="grill" /></AtmosphereProvider>
            <LinearGradient pointerEvents="none" colors={['rgba(17,12,8,0.62)', 'rgba(17,12,8,0.2)', 'rgba(17,12,8,0.88)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
            <SafeAreaView edges={['top']} style={styles.brandRow}>
              <ParamountMark size={34} color={colors.onDark} />
              <View accessibilityLabel="Paramount Signature"><Text style={styles.brandName}>Paramount</Text><Text style={styles.brandItalic}>Signature</Text></View>
            </SafeAreaView>
            <View style={styles.heroCopy}>
              <Text accessibilityRole="header" style={styles.heroTitle}>{isSignUp ? 'Join the table.' : 'Welcome back.'}</Text>
              <Text style={styles.heroItalic}>{isSignUp ? 'Your seat is waiting.' : 'Good food is waiting.'}</Text>
            </View>
          </View>

          <View style={styles.sheet}>
            <View style={styles.sheetInner}>
              <View accessibilityRole="tablist" style={styles.segment}>
                {(['sign-in', 'sign-up'] as const).map(option => {
                  const active = mode === option;
                  return <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: active }} aria-selected={active}
                    onPress={() => { setMode(option); setFormError(null); }} style={[styles.segmentItem, active && styles.segmentActive]}>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option === 'sign-in' ? 'Log in' : 'Create account'}</Text>
                  </Pressable>;
                })}
              </View>

              <Text style={styles.description}>
                {isSignUp ? 'Create an account to order, save your favourites and follow every delivery to your door.' : 'Log in with the email you registered with Signatures.'}
              </Text>

              <View style={styles.form}>
                {formError && <View accessibilityRole="alert" style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color={colors.error} /><Text style={styles.errorText}>{formError}</Text></View>}
                {isSignUp && <>
                  <Field label="Full name" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="As it appears on your ID" autoCapitalize="words" textContentType="name" />
                  <Field label="Phone (optional)" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="+263 7X XXX XXXX" keyboardType="phone-pad" textContentType="telephoneNumber" />
                </>}
                <Field label="Email address" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
                <Field label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="At least 8 characters" autoCapitalize="none" secureTextEntry={!showPassword} textContentType={isSignUp ? 'newPassword' : 'password'}
                  trailing={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setShowPassword(value => !value)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textSecondary} /></Pressable>} />

                <Pressable style={[styles.primaryButton, submitting && styles.buttonDisabled]} disabled={submitting} onPress={() => void submit()}>
                  {submitting ? <ActivityIndicator color={colors.onDark} /> : <>
                    <Text style={styles.primaryButtonText}>{isSignUp ? 'Create account' : 'Log in'}</Text>
                    <Ionicons name="arrow-forward" size={19} color={colors.onDark} />
                  </>}
                </Pressable>
              </View>

              {previewEnabled && <View style={styles.previewBlock}>
                <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
                <Pressable onPress={startPreview} style={styles.secondaryButton}>
                  <Ionicons name="eye-outline" size={18} color={colors.text} />
                  <Text style={styles.secondaryButtonText}>Explore the UI preview</Text>
                </Pressable>
                <Text style={styles.finePrint}>Demo screens only. No account or order is created.</Text>
              </View>}

              <Text style={styles.finePrint}>Signatures · Harare</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  trailing,
  ...inputProps
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  trailing?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.field}>
        <Ionicons
          name={icon}
          size={19}
          color={colors.textSecondary}
        />

        <TextInput
          accessibilityLabel={label}
          {...inputProps}
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
        />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.black, overflow: 'hidden' },
  brandRow: { position: 'absolute', left: 24, right: 24, top: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 25, color: colors.onDark },
  brandItalic: { fontFamily: fonts.headingItalic, fontSize: 17, lineHeight: 19, color: colors.onDark, marginTop: -2 },
  heroCopy: { position: 'absolute', left: 24, right: 24, bottom: 46 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 42, lineHeight: 46, color: colors.onDark },
  heroItalic: { fontFamily: fonts.headingItalic, fontSize: 26, lineHeight: 32, color: colors.gold },
  sheet: { flex: 1, marginTop: -26, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetInner: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 26, paddingBottom: 34, gap: 16 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder },
  segmentText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textSecondary },
  segmentTextActive: { color: colors.onDark },
  description: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  form: { gap: 15 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.error, backgroundColor: colors.surface },
  errorText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.error },
  fieldBlock: { gap: 7 },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textSecondary },
  field: { height: 56, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { fontFamily: fonts.body, flex: 1, color: colors.text, fontSize: 15 },
  primaryButton: { height: 58, marginTop: 6, borderRadius: 29, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontFamily: fonts.bold, color: colors.onDark, fontSize: 15 },
  previewBlock: { gap: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.6, color: colors.textSecondary },
  secondaryButton: { height: 54, borderRadius: 27, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButtonText: { fontFamily: fonts.semibold, color: colors.text, fontSize: 14 },
  finePrint: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
});
