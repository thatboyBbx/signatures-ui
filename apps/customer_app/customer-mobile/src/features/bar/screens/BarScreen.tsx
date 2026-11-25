import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Image as NativeImage, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AtmosphereVideo } from '../../../components/AtmosphereVideo';
import { ParamountMark } from '../../../components/ParamountMark';
import { ParamountPressable, ParamountPhoto } from '../../../components/ParamountPressable';
import { ParamountDock, dockRoutes } from '../../../components/ParamountTabBar';
import { ParamountTray } from '../../../components/ParamountTray';
import { useReducedMotion } from '../../../components/useReducedMotion';
import { AtmosphereProvider } from '../../../context/AtmosphereContext';
import { useCart } from '../../../context/CartContext';
import { haptic } from '../../../components/haptics';
import { fonts } from '../../../theme/theme';
import { barCategories, barImageUri, barMenu, barServes, type BarDrink } from '../barMenu';
import type { RootStackParamList } from '../../../navigation/AppNavigator';

const walnut = require('../../../../assets/paramount/walnut-grain.webp');
// Bar palette: near-black, bone and brass. Hard edges, no soft corners.
const ink = '#0E0C0A';
const panel = '#17120E';
const bone = '#ECE5D8';
const brass = '#C6A77E';
const muted = '#B5A58F';
const rule = '#3A3027';

// Age confirmation lasts for the app session, so the gate is not repeated on every visit.
let ageConfirmedThisSession = false;

function Wood({ faint = false }: { faint?: boolean }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><NativeImage source={walnut} resizeMode="repeat" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: faint ? 0.16 : 0.42 }]} /><View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17,12,8,0.48)' }]} /></View>;
}

const money = (value: number) => `$${value.toFixed(2)}`;

export function BarScreen() {
  return <AtmosphereProvider><BarExperience /></AtmosphereProvider>;
}

function BarExperience() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const { addItem } = useCart();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [drinksY, setDrinksY] = useState(0);
  const [category, setCategory] = useState<string>('All');
  const [selected, setSelected] = useState<BarDrink | null>(null);
  const [serveId, setServeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [ageOk, setAgeOk] = useState(ageConfirmedThisSession);
  const [added, setAdded] = useState<string | null>(null);
  const columns = width >= 650 ? 3 : 2;
  const shown = barMenu.filter(drink => category === 'All' || drink.category === category);
  const goTab = (index: number) => navigation.popTo('MainTabs', { screen: dockRoutes[index] });
  const serves = selected ? barServes(selected.category) : [];
  const serve = serves.find(item => item.id === serveId) ?? serves[0];
  const unitPrice = selected && serve ? Math.round(selected.price * serve.multiplier * 100) / 100 : 0;

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(null), 2600);
    return () => clearTimeout(timer);
  }, [added]);

  const open = (drink: BarDrink) => { setSelected(drink); setServeId(barServes(drink.category)[0].id); setQuantity(1); };
  const confirmAge = () => { ageConfirmedThisSession = true; setAgeOk(true); };
  const addToTray = () => {
    if (!selected || !serve) return;
    addItem({
      id: `bar-${selected.id}-${serve.id}`, foodId: `bar-${selected.id}`, name: selected.name, image: barImageUri(selected.image),
      basePrice: selected.price, size: serve.label, sizePrice: unitPrice - selected.price, extras: [],
      quantity, unitPrice, totalPrice: unitPrice * quantity,
    });
    haptic('success');
    setAdded(`${quantity} × ${selected.name}`);
    setSelected(null);
  };

  return <View style={styles.screen}>
    <StatusBar style="light" />
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
      <View style={[styles.hero, { height: Math.min(660, Math.max(510, height * 0.74)) }]}>
        <AtmosphereVideo variant="bar" />
        <LinearGradient pointerEvents="none" colors={['rgba(17,17,16,0.4)', 'rgba(17,17,16,0.12)', 'rgba(14,12,10,0.96)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.header, { top: insets.top + 14 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Home" onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={22} color={bone} /></Pressable>
          <View style={styles.identity}><ParamountMark size={23} color={bone} /><Text style={styles.brand}>PARAMOUNT / THE BAR</Text></View>
          <ParamountTray onPress={() => navigation.navigate('Cart')} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.ageTag}>18+ · DRINK RESPONSIBLY</Text>
          <Text accessibilityRole="header" style={[styles.heroTitle, { fontSize: width < 500 ? 88 : 128, lineHeight: width < 500 ? 82 : 118 }]}>THE{'\n'}BAR.</Text>
          <ParamountPressable accessibilityLabel="Explore drinks" style={styles.heroAction} onPress={() => scroll.current?.scrollTo({ y: drinksY, animated: !reduced })}><Wood /><Text style={styles.actionText}>THE LINEUP</Text><Ionicons name="arrow-down" size={25} color={bone} /></ParamountPressable>
        </View>
      </View>

      <View style={styles.catalogue} onLayout={event => setDrinksY(event.nativeEvent.layout.y)}>
        <View style={styles.catalogueHeading}>
          <Text accessibilityRole="header" style={styles.title}>PICK YOUR POUR.</Text>
          <View style={styles.countBlock}><Text style={styles.countNumber}>{shown.length.toString().padStart(2, '0')}</Text><Text style={styles.countLabel}>POURS</Text></View>
        </View>
        <View style={styles.headingRule} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {barCategories.map(item => <ParamountPressable key={item} accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{ selected: category === item }} aria-selected={category === item} onPress={() => setCategory(item)} style={[styles.filter, category === item && styles.activeFilter]}><Text style={[styles.filterText, category === item && styles.activeFilterText]}>{item.toUpperCase()}</Text></ParamountPressable>)}
        </ScrollView>
        <View style={styles.grid}>
          {shown.map((drink, index) => {
            // A lone tile in the final row spans the full width instead of leaving a gap.
            const lone = index === shown.length - 1 && shown.length % columns === 1 && shown.length > 1;
            const tileWidth = lone ? '100%' : columns === 3 ? '31.5%' : '47.5%';
            // Bottle photos shot on mixed backgrounds sit in one framed print; cocktails stay full-bleed.
            const framed = !drink.cutout && drink.category !== 'Cocktails' && drink.category !== 'Mocktails';
            return <ParamountPressable photoMotion key={drink.id} accessibilityLabel={`${drink.name}, ${drink.note}, ${money(drink.price)}. View and add to tray`} style={[styles.card, { width: tileWidth }]} onPress={() => open(drink)}>
              <View style={[styles.photoStage, { height: lone ? 240 : width < 360 ? 190 : 230 }]}>
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: panel }]} />
                {(drink.cutout || framed) && <Wood faint />}
                {framed ? <View style={[styles.print, lone && styles.printWide, drink.studio && styles.studioStage]}>
                  <ParamountPhoto accessibilityLabel={drink.name} source={drink.image} resizeMode="cover" style={[styles.photo, drink.studio && styles.studioPhoto]} />
                </View> : <ParamountPhoto accessibilityLabel={drink.name} source={drink.image} resizeMode={drink.cutout ? 'contain' : 'cover'} style={[styles.photo, drink.cutout && styles.cutout]} />}
                {!drink.cutout && !framed && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,12,10,0.22)' }]} />}
                <Text style={styles.index}>{(index + 1).toString().padStart(2, '0')}</Text>
                <View style={styles.categoryTag}><Text style={styles.categoryTagText}>{drink.category.toUpperCase()}</Text></View>
              </View>
              <View style={styles.cardCopy}>
                <Text numberOfLines={1} style={styles.drinkName}>{drink.name.toUpperCase()}</Text>
                <Text numberOfLines={1} style={styles.drinkNote}>{drink.note}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{money(drink.price)}</Text>
                  <View style={styles.addBox}><Ionicons name="add" size={20} color={ink} /></View>
                </View>
              </View>
            </ParamountPressable>;
          })}
        </View>
        <Text style={styles.footnote}>PRICES IN USD, BASED ON TYPICAL HARARE BAR RATES — CONFIRMED BY THE BRANCH BEFORE LIVE ORDERING. ID MAY BE CHECKED ON DELIVERY.</Text>
      </View>

      <ParamountPressable photoMotion accessibilityLabel="Choose a venue for the bar" onPress={() => navigation.navigate('Venue')} style={styles.venue}>
        <ParamountPhoto source={require('../../../../assets/paramount/bar-drinks.jpg')} style={styles.venueImage} />
        <View style={styles.venueCopy}><Wood /><Text style={styles.actionText}>FIND YOUR SPOT</Text><Ionicons name="arrow-forward" size={25} color={bone} /></View>
      </ParamountPressable>
    </ScrollView>

    {added && <View pointerEvents="box-none" style={[styles.toastWrap, { bottom: Math.max(14, insets.bottom) + 82 }]}><View accessibilityLiveRegion="polite" style={styles.toast}>
      <Ionicons name="checkmark" size={18} color={ink} />
      <Text numberOfLines={1} style={styles.toastText}>ADDED · {added.toUpperCase()}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="View tray" onPress={() => navigation.navigate('Cart')} style={styles.toastAction}><Text style={styles.toastActionText}>VIEW TRAY</Text></Pressable>
    </View></View>}

    <ParamountDock square bottomInset={insets.bottom} onSelect={goTab} />

    <Modal visible={selected !== null && ageOk} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => setSelected(null)}>
      <View style={styles.modalShade}><View accessibilityViewIsModal style={styles.detail}>
        {selected && serve && <>
          <View style={styles.detailImageStage}>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: panel }]} />
            <Wood faint />
            <ParamountPhoto accessibilityLabel={selected.name} source={selected.image} resizeMode="contain" style={styles.detailImage} />
          </View>
          <View style={styles.detailCopy}>
            <Text style={styles.detailCategory}>{selected.category.toUpperCase()}</Text>
            <Text accessibilityRole="header" style={styles.detailName}>{selected.name.toUpperCase()}</Text>
            <Text style={styles.detailNote}>{selected.note}</Text>
            {serves.length > 1 && <View style={styles.serveRow}>
              {serves.map(item => {
                const active = item.id === serve.id;
                return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: active }} aria-checked={active} onPress={() => setServeId(item.id)} style={[styles.serve, active && styles.serveActive]}>
                  <Text style={[styles.serveLabel, active && styles.serveLabelActive]}>{item.label.toUpperCase()}</Text>
                  <Text style={[styles.serveDetail, active && styles.serveLabelActive]}>{item.detail} · {money(Math.round(selected.price * item.multiplier * 100) / 100)}</Text>
                </Pressable>;
              })}
            </View>}
            {serves.length === 1 && <Text style={styles.serveSingle}>{serve.label.toUpperCase()} · {serve.detail}</Text>}
            <View style={styles.orderRow}>
              <View style={styles.stepper}>
                <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" disabled={quantity === 1} onPress={() => setQuantity(value => Math.max(1, value - 1))} style={[styles.stepButton, quantity === 1 && { opacity: 0.4 }]}><Ionicons name="remove" size={18} color={bone} /></Pressable>
                <Text style={styles.stepValue}>{quantity}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" onPress={() => setQuantity(value => value + 1)} style={styles.stepButton}><Ionicons name="add" size={18} color={bone} /></Pressable>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Add ${quantity} ${selected.name} to tray, ${money(unitPrice * quantity)}`} onPress={addToTray} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
                <Text style={styles.addButtonText}>ADD TO TRAY</Text>
                <Text style={styles.addButtonPrice}>{money(unitPrice * quantity)}</Text>
              </Pressable>
            </View>
          </View>
        </>}
        <Pressable accessibilityRole="button" accessibilityLabel="Close drink details" onPress={() => setSelected(null)} style={styles.close}><Ionicons name="close" size={25} color={bone} /></Pressable>
      </View></View>
    </Modal>

    <Modal visible={!ageOk} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={() => navigation.goBack()}>
      <View style={styles.gateShade}><View accessibilityViewIsModal style={styles.gate}>
        <Text style={styles.gateBig}>18+</Text>
        <Text accessibilityRole="header" style={styles.gateTitle}>ARE YOU OF LEGAL{'\n'}DRINKING AGE?</Text>
        <Text style={styles.gateBody}>The Bar serves alcohol to adults aged 18 and over. Your ID may be checked when your order is handed over.</Text>
        <Pressable accessibilityRole="button" onPress={confirmAge} style={({ pressed }) => [styles.addButton, styles.gateYes, pressed && styles.addButtonPressed]}><Text style={styles.addButtonText}>YES, I'M 18 OR OLDER</Text><Ionicons name="arrow-forward" size={20} color={ink} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.gateNo}><Text style={styles.gateNoText}>NO, TAKE ME BACK</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

const hardShadow = { shadowColor: brass, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ink },
  hero: { backgroundColor: '#19140F', overflow: 'hidden' },
  header: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontFamily: fonts.bold, color: bone, fontSize: 10, letterSpacing: 1.4 },
  back: { width: 44, height: 44, borderWidth: 2, borderColor: brass, backgroundColor: '#19140F99', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { position: 'absolute', bottom: 28, left: 24, right: 24, gap: 20 },
  ageTag: { alignSelf: 'flex-start', fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 2, color: ink, backgroundColor: brass, paddingHorizontal: 8, paddingVertical: 4 },
  heroTitle: { fontFamily: fonts.heavy, color: bone, letterSpacing: -5 },
  heroAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 28, minHeight: 54, paddingHorizontal: 18, borderWidth: 2, borderColor: brass, backgroundColor: '#19140F', overflow: 'hidden' },
  actionText: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.6, color: bone },
  catalogue: { paddingHorizontal: 18, paddingTop: 30, paddingBottom: 28 },
  catalogueHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontFamily: fonts.heavy, fontSize: 34, lineHeight: 34, letterSpacing: -1.4, color: bone },
  countBlock: { alignItems: 'flex-end' },
  countNumber: { fontFamily: fonts.heavy, fontSize: 30, lineHeight: 30, color: brass, letterSpacing: -1 },
  countLabel: { fontFamily: fonts.heavy, fontSize: 9, letterSpacing: 2, color: muted },
  headingRule: { height: 4, backgroundColor: bone, marginTop: 14, marginBottom: 18 },
  filters: { gap: 8, paddingBottom: 24, paddingRight: 18 },
  filter: { borderWidth: 2, borderColor: rule, minHeight: 44, paddingHorizontal: 15, justifyContent: 'center', backgroundColor: ink },
  activeFilter: { borderColor: bone, backgroundColor: bone },
  filterText: { fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 1.2, color: muted },
  activeFilterText: { color: ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20, paddingRight: 5 },
  card: { borderWidth: 2, borderColor: bone, backgroundColor: panel, overflow: 'hidden', ...hardShadow },
  photoStage: { backgroundColor: panel, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  studioStage: { backgroundColor: '#A48B6B' },
  studioPhoto: { mixBlendMode: 'multiply' },
  photo: { width: '100%', height: '100%' },
  cutout: { width: '84%', height: '84%' },
  print: { width: '62%', height: '80%', borderWidth: 2, borderColor: bone, backgroundColor: '#211912', overflow: 'hidden' },
  printWide: { width: '34%' },
  index: { position: 'absolute', left: 10, top: 8, fontFamily: fonts.heavy, fontSize: 22, letterSpacing: -1, color: bone, opacity: 0.9 },
  categoryTag: { position: 'absolute', right: 0, top: 0, backgroundColor: bone, paddingHorizontal: 7, paddingVertical: 4 },
  categoryTagText: { fontFamily: fonts.heavy, fontSize: 8, letterSpacing: 1.4, color: ink },
  cardCopy: { padding: 11, gap: 5, borderTopWidth: 2, borderTopColor: bone },
  drinkName: { fontFamily: fonts.heavy, fontSize: 16, letterSpacing: -0.3, color: bone },
  drinkNote: { fontFamily: fonts.body, fontSize: 11, color: muted, lineHeight: 16 },
  priceRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: fonts.heavy, fontSize: 21, letterSpacing: -0.5, color: brass },
  addBox: { width: 34, height: 34, backgroundColor: brass, alignItems: 'center', justifyContent: 'center' },
  footnote: { marginTop: 26, fontFamily: fonts.bold, fontSize: 9, lineHeight: 15, letterSpacing: 1.2, color: muted },
  venue: { marginHorizontal: 18, marginRight: 23, borderWidth: 2, borderColor: bone, backgroundColor: panel, overflow: 'hidden', ...hardShadow },
  venueImage: { width: '100%', height: 200 },
  venueCopy: { minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', borderTopWidth: 2, borderTopColor: bone },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { width: '92%', maxWidth: 470, minHeight: 52, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: brass, borderWidth: 2, borderColor: ink },
  toastText: { flex: 1, fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1, color: ink },
  toastAction: { alignSelf: 'stretch', paddingHorizontal: 14, justifyContent: 'center', backgroundColor: ink },
  toastActionText: { fontFamily: fonts.heavy, fontSize: 10, letterSpacing: 1.4, color: brass },
  modalShade: { flex: 1, backgroundColor: '#000000D9', padding: 20, justifyContent: 'center', alignItems: 'center' },
  detail: { width: '100%', maxWidth: 450, backgroundColor: panel, borderWidth: 2, borderColor: bone, ...hardShadow },
  detailImageStage: { height: 280, backgroundColor: panel, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottomWidth: 2, borderBottomColor: bone },
  detailImage: { width: '88%', height: '88%' },
  detailCopy: { padding: 20, gap: 10 },
  detailCategory: { alignSelf: 'flex-start', fontFamily: fonts.heavy, color: ink, backgroundColor: brass, fontSize: 9, letterSpacing: 2, paddingHorizontal: 7, paddingVertical: 3 },
  detailName: { fontFamily: fonts.heavy, color: bone, fontSize: 30, lineHeight: 32, letterSpacing: -1 },
  detailNote: { fontFamily: fonts.body, color: muted, fontSize: 13 },
  serveRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  serve: { flex: 1, minHeight: 58, padding: 10, borderWidth: 2, borderColor: rule, justifyContent: 'center', gap: 3 },
  serveActive: { borderColor: bone, backgroundColor: bone },
  serveLabel: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.2, color: bone },
  serveDetail: { fontFamily: fonts.medium, fontSize: 11, color: muted },
  serveLabelActive: { color: ink },
  serveSingle: { marginTop: 6, fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.2, color: bone, borderWidth: 2, borderColor: rule, padding: 10 },
  orderRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'stretch' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: rule },
  stepButton: { width: 40, height: 52, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 24, textAlign: 'center', fontFamily: fonts.heavy, fontSize: 16, color: bone },
  addButton: { flex: 1, minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: brass, borderWidth: 2, borderColor: brass },
  addButtonPressed: { backgroundColor: bone, borderColor: bone },
  addButtonText: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 1.4, color: ink },
  addButtonPrice: { fontFamily: fonts.heavy, fontSize: 18, color: ink },
  close: { position: 'absolute', top: 10, right: 10, width: 44, height: 44, backgroundColor: '#111110CC', borderWidth: 2, borderColor: bone, justifyContent: 'center', alignItems: 'center' },
  gateShade: { flex: 1, backgroundColor: '#0E0C0AF2', padding: 22, justifyContent: 'center', alignItems: 'center' },
  gate: { width: '100%', maxWidth: 420, padding: 24, gap: 14, backgroundColor: panel, borderWidth: 2, borderColor: bone, ...hardShadow },
  gateBig: { fontFamily: fonts.heavy, fontSize: 84, lineHeight: 84, letterSpacing: -4, color: brass },
  gateTitle: { fontFamily: fonts.heavy, fontSize: 26, lineHeight: 28, letterSpacing: -0.8, color: bone },
  gateBody: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: muted },
  gateYes: { flex: 0, marginTop: 8 },
  gateNo: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: rule },
  gateNoText: { fontFamily: fonts.heavy, fontSize: 11, letterSpacing: 1.4, color: bone },
});
