import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { Card, ParamountSubPage, Row, WoodPanel, subPageStyles } from '../../../components/ParamountSubPage';
import { colors, fonts } from '../../../theme/theme';

export function PersonalDetailsScreen() {
  const { customer } = useAuth();
  const name = customer?.fullName || 'Customer';
  const initials = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  return <ParamountSubPage eyebrow="YOUR ACCOUNT" title="Personal details" italic="As we know you.">
    <WoodPanel style={styles.hero}>
      <View style={styles.monogram}><Text style={styles.initials}>{initials}</Text></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.eyebrow}>SIGNED IN AS</Text>
        <Text numberOfLines={2} style={styles.name}>{name}</Text>
      </View>
    </WoodPanel>
    <View style={{ height: 16 }} />
    <Card>
      <Row icon="person-outline" label="Full name" value={name} />
      <Row icon="mail-outline" label="Email" value={customer?.email || 'Not added'} />
      <Row icon="call-outline" label="Phone" value={customer?.phone || 'Not added'} last />
    </Card>
    <Text style={subPageStyles.note}>Editing these details in the app is coming soon. Your name and phone are shared with your rider only for active deliveries.</Text>
  </ParamountSubPage>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  monogram: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(234,227,214,0.08)' },
  initials: { fontFamily: fonts.heading, fontSize: 26, color: colors.onDark },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.6, color: '#E4CC9E' },
  name: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, color: colors.onDark },
});
