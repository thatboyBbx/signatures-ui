import { Text } from 'react-native';
import { setPreference, usePreferences } from '../../../context/preferences';
import { Card, ParamountSubPage, SectionLabel, ToggleRow, subPageStyles } from '../../../components/ParamountSubPage';

export function NotificationsScreen() {
  const prefs = usePreferences();
  return <ParamountSubPage eyebrow="STAY IN THE LOOP" title="Notifications" italic="Only what matters.">
    <SectionLabel>YOUR ORDERS</SectionLabel>
    <Card>
      <ToggleRow icon="receipt-outline" label="Order updates" detail="Confirmed, in the kitchen, on the way and delivered." value={prefs.orderUpdates} onChange={value => setPreference('orderUpdates', value)} />
      <ToggleRow icon="bicycle-outline" label="Rider arriving" detail="A heads-up when your rider is a few minutes away." value={prefs.riderArriving} onChange={value => setPreference('riderArriving', value)} last />
    </Card>
    <SectionLabel>FROM SIGNATURES</SectionLabel>
    <Card>
      <ToggleRow icon="pricetag-outline" label="Offers & news" detail="New dishes, specials and events. Never more than one a week." value={prefs.offers} onChange={value => setPreference('offers', value)} last />
    </Card>
    <Text style={subPageStyles.note}>Your choices are saved on this device. Phone notifications switch on once push delivery is added to the app; until then, order progress shows on the tracking screen.</Text>
  </ParamountSubPage>;
}
