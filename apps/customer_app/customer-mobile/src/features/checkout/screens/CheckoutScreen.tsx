import { useMenu } from '../../../context/MenuContext';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ParamountPressable as Pressable } from '../../../components/ParamountPressable';
import { useCart } from '../../../context/CartContext';
import { useCheckout } from '../../../context/CheckoutContext';
import { branchName, branchPlace } from '../../../services/venuesApi';
import { useOrders } from '../../../context/OrderContext';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { createOrder, completeOrderAttempt, getOrderTracking, mapApiOrder } from '../../../services/ordersApi';
import { colors, fonts } from '../../../theme/theme';
import { optionSummary } from '../../food/components/CustomiseMeal';
export function CheckoutScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { items, subtotal, itemCount, clearCart, discount, promo } = useCart();
    const { reload } = useMenu();
    const { address, paymentMethod, resetCheckout, venue, setPaymentMethod } = useCheckout();
    // Cash is the only payment method, so pre-select it instead of asking for an extra tap.
    useEffect(() => { if (!paymentMethod) setPaymentMethod({ id: 'cash', label: 'Cash', detail: 'Pay on delivery or at branch collection', icon: 'cash-outline' }); }, [paymentMethod]);
    const { addOrder } = useOrders();
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const deliveryFee = orderType === 'delivery' ? Number(venue?.delivery_fee ?? 2.5) : 0;
    const total = subtotal - discount + deliveryFee;
    const disabled = submitting || !items.length || !venue?.is_open || !venue.accepting_orders || (orderType === 'delivery' && !address) || paymentMethod?.id !== 'cash';
    async function placeOrder() {
        if (disabled || !venue)
            return;
        setSubmitting(true);
        setError('');
        try {
            if (process.env.EXPO_PUBLIC_UI_PREVIEW === '1') {
                // UI preview: build a local sample order from the real tray so confirmation and tracking can be reviewed.
                const id = `SIG-PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`;
                addOrder({ id, orderType, restaurantName: venue.name, items, itemCount, subtotal, discount: discount || undefined, deliveryFee, total,
                    address: orderType === 'delivery' && address ? address : { id: 'collect', label: branchName(venue.name), address: branchPlace(venue) || venue.name },
                    paymentMethod: paymentMethod!, status: 'confirmed', estimatedMinutes: orderType === 'delivery' ? 35 : 20, createdAt: new Date().toISOString() });
                clearCart();
                resetCheckout();
                navigation.replace('OrderConfirmation', { orderId: id });
                return;
            }
            if (items.some(item => !item.menuItemId || item.branchCode !== venue.code))
                throw new Error('Review the venue menu and add current items before ordering.');
            const input = { branchCode: venue.code, orderType, deliveryAddress: orderType === 'delivery' ? address?.address : undefined, paymentMethod: 'cash', items: items.map(item => ({ menuItemId: item.menuItemId, variantId: item.variantId, itemName: item.name, variantName: item.size, quantity: item.quantity, unitPrice: item.unitPrice })) };
            const created = await createOrder(input);
            const tracked = await getOrderTracking(created.order_number);
            addOrder(mapApiOrder(tracked));
            completeOrderAttempt(input);
            clearCart();
            resetCheckout();
            navigation.replace('OrderConfirmation', { orderId: created.order_number });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Could not place your order. Please retry.');
        }
        finally {
            setSubmitting(false);
        }
    }
    const preview = process.env.EXPO_PUBLIC_UI_PREVIEW === '1';
    const requirements = [
        { title: 'Choose a venue', complete: Boolean(venue), target: 'Venue' as const },
        { title: 'Add a delivery address', complete: orderType === 'pickup' || Boolean(address), target: 'Address' as const },
        { title: 'Choose cash payment', complete: paymentMethod?.id === 'cash', target: 'Payment' as const },
    ];
    const missing = requirements.find(requirement => !requirement.complete);
    const guidance = !items.length ? 'Your tray is empty. Add something from the menu to continue.'
        : missing ? missing.title
        : !venue?.is_open || !venue.accepting_orders ? 'This venue is not accepting orders. Choose another venue.'
        : preview ? 'UI preview — this places a sample order on this device only.'
        : 'Everything is ready. Review your total, then place your order.';
    const row = (title: string, value: string, detail: string, target: 'Venue' | 'Address' | 'Payment', icon: 'storefront-outline' | 'location-outline' | 'cash-outline', complete: boolean) => (
        <Pressable accessibilityRole="button" style={styles.card} onPress={() => navigation.navigate(target)} accessibilityLabel={`${title}: ${value}. ${detail}`}>
            <View style={styles.cardIcon}><Ionicons name={icon} size={23} color={colors.primary} /></View>
            <View style={styles.cardBody}><Text style={styles.caption}>{title}</Text><Text style={styles.value}>{value}</Text><Text style={styles.detail}>{detail}</Text></View>
            <Ionicons name={complete ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={complete ? colors.success : colors.primary} />
        </Pressable>
    );
    return <SafeAreaView style={styles.container}>
        <View style={styles.header}><Pressable accessibilityLabel="Back" accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><Text style={styles.title}>Checkout</Text><View style={{ width: 44 }} /></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.caption}>YOUR ORDER, YOUR WAY</Text><Text style={styles.heading}>The final details.</Text>
            <Text style={styles.detail}>{itemCount} {itemCount === 1 ? 'item' : 'items'} in your tray. Choose how it reaches you.</Text>
            <View style={styles.options}>{(['delivery', 'pickup'] as const).map(type => <Pressable key={type} accessibilityRole="radio" aria-checked={orderType === type} accessibilityState={{ checked: orderType === type }} style={[styles.option, type === orderType && styles.selected]} onPress={() => { setOrderType(type); setError(''); }}>
                <Ionicons name={type === 'delivery' ? 'bicycle-outline' : 'bag-handle-outline'} size={26} color={colors.primary} />
                <Text style={styles.value}>{type === 'delivery' ? 'Bring it to me' : 'I’ll collect'}</Text><Text style={styles.small}>{type === 'delivery' ? 'Delivery to your door' : 'No delivery charge'}</Text>
                {type === orderType && <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.optionCheck} />}
            </Pressable>)}</View>
            <Text style={styles.sectionTitle}>Make it yours</Text>
            {row('PREPARED AT', venue ? branchName(venue.name) : 'Choose your venue', venue ? branchPlace(venue) || 'Signatures kitchen' : 'Find the kitchen for your order.', 'Venue', 'storefront-outline', Boolean(venue))}
            {orderType === 'delivery'
                ? row('DELIVER TO', address?.label ?? 'Add a delivery address', address?.address ?? 'Street, area and city — so we can find you.', 'Address', 'location-outline', Boolean(address))
                : <View style={styles.note}><Ionicons name="storefront-outline" size={22} color={colors.primary} /><View style={styles.cardBody}><Text style={styles.value}>Collect from {venue ? branchName(venue.name) : 'your selected venue'}</Text><Text style={styles.detail}>{venue?.address || 'Choose a venue to see its collection address.'}</Text><Text style={styles.small}>Follow preparation in your order updates.</Text></View></View>}
            {row('PAYMENT', paymentMethod?.id === 'cash' ? (orderType === 'delivery' ? 'Cash on delivery' : 'Cash at collection') : 'Choose cash payment', orderType === 'delivery' ? 'Pay your driver when your order arrives.' : 'Pay at the branch when you collect.', 'Payment', 'cash-outline', paymentMethod?.id === 'cash')}
            <View style={styles.summary}><Text style={styles.sectionTitle}>Your tray</Text>
                {items.length ? items.map(item => <View style={styles.totalRow} key={item.id}><View style={styles.quantity}><Text style={styles.value}>{item.quantity}×</Text></View><View style={styles.cardBody}><Text style={styles.value}>{item.name}</Text>{optionSummary(item.size, item.extras, item.removed) ? <Text style={styles.small}>{optionSummary(item.size, item.extras, item.removed)}</Text> : null}</View><Text style={styles.value}>${item.totalPrice.toFixed(2)}</Text></View>) : <Text style={styles.detail}>Your next favourite is waiting on the menu.</Text>}
                <View style={styles.rule} /><View style={styles.totalRow}><Text style={styles.detail}>Subtotal</Text><Text style={styles.value}>${subtotal.toFixed(2)}</Text></View>
                {discount > 0 && <View style={styles.totalRow}><Text style={styles.detail}>Promo · {promo?.code}</Text><Text style={[styles.value, { color: colors.success }]}>−${discount.toFixed(2)}</Text></View>}
                <View style={styles.totalRow}><Text style={styles.detail}>{orderType === 'delivery' ? 'Delivery fee' : 'Branch collection'}</Text><Text style={styles.value}>{orderType === 'delivery' ? `$${deliveryFee.toFixed(2)}` : 'Free'}</Text></View>
                <View style={styles.rule} /><View style={styles.totalRow}><View><Text style={styles.value}>Total to pay</Text><Text style={styles.small}>USD · Cash</Text></View><Text style={styles.amount}>${total.toFixed(2)}</Text></View>
            </View>
            {error ? <View style={styles.errorCard}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" style={styles.reviewButton} onPress={() => { reload(); navigation.navigate('Restaurant'); }}><Text style={styles.value}>Review venue menu</Text><Ionicons name="arrow-forward" size={18} color={colors.primary} /></Pressable></View> : null}
            {items.some(item => item.foodId.startsWith('bar-')) && <View style={styles.note}><Ionicons name="id-card-outline" size={22} color={colors.primary} /><View style={styles.cardBody}><Text style={styles.value}>Your tray includes alcohol · 18+</Text><Text style={styles.detail}>Have your ID ready. The driver or branch may check it before handing over drinks.</Text></View></View>}
            <View style={styles.guidance}><Ionicons name={disabled || preview ? 'information-circle-outline' : 'checkmark-circle-outline'} size={20} color={colors.primary} /><Text accessibilityLiveRegion="polite" style={[styles.detail, styles.cardBody]}>{guidance}</Text></View>
            {missing ? <Pressable accessibilityRole="button" style={styles.nextStep} onPress={() => navigation.navigate(missing.target)}><Text style={styles.value}>{missing.title}</Text><Ionicons name="arrow-forward" size={18} color={colors.primary} /></Pressable> : !items.length ? <Pressable accessibilityRole="button" style={styles.nextStep} onPress={() => navigation.navigate('Restaurant')}><Text style={styles.value}>Explore the menu</Text><Ionicons name="arrow-forward" size={18} color={colors.primary} /></Pressable> : venue && (!venue.is_open || !venue.accepting_orders) ? <Pressable accessibilityRole="button" style={styles.nextStep} onPress={() => navigation.navigate('Venue')}><Text style={styles.value}>Choose another venue</Text><Ionicons name="arrow-forward" size={18} color={colors.primary} /></Pressable> : null}
            <Text style={styles.small}>Prices and availability are checked when you place your order.</Text>
        </ScrollView>
        <View style={styles.bottom}><View style={styles.bottomInner}><Pressable accessibilityRole="button" accessibilityState={{ disabled, busy: submitting }} style={styles.place} disabled={disabled} onPress={placeOrder}><Text style={styles.placePrice}>${total.toFixed(2)}</Text><Text style={styles.placeText}>{submitting ? 'Confirming…' : 'Place order'}</Text>{!submitting && <Ionicons name="arrow-forward" size={20} color={colors.onDark} />}</Pressable></View></View>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, minHeight: 72 },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 22 },
    title: { fontFamily: fonts.heading, fontSize: 20, color: colors.text }, heading: { fontFamily: fonts.heading, fontSize: 36, color: colors.text },
    content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28, gap: 16, width: '100%', maxWidth: 620, alignSelf: 'center' },
    detail: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 14, lineHeight: 22 }, small: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
    value: { fontFamily: fonts.bold, fontSize: 14, color: colors.text }, caption: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, color: colors.primary },
    sectionTitle: { fontFamily: fonts.heading, fontSize: 23, color: colors.text },
    card: { backgroundColor: colors.surface, padding: 17, borderRadius: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardBody: { flex: 1, gap: 5 }, cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    options: { flexDirection: 'row', gap: 10 }, option: { flex: 1, padding: 16, minHeight: 136, gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
    selected: { backgroundColor: colors.surfaceSecondary, borderColor: colors.primary }, optionCheck: { position: 'absolute', top: 14, right: 12 },
    summary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, gap: 17 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, quantity: { backgroundColor: colors.surfaceSecondary, padding: 9, borderRadius: 8 },
    amount: { fontFamily: fonts.heading, fontSize: 32, color: colors.text }, rule: { height: 1, backgroundColor: colors.border },
    note: { backgroundColor: colors.surfaceSecondary, padding: 18, gap: 12, borderRadius: 14, flexDirection: 'row' },
    errorCard: { borderWidth: 1, borderColor: colors.error, backgroundColor: colors.surface, padding: 18, gap: 12, borderRadius: 12 }, errorText: { color: colors.error, fontFamily: fonts.medium, fontSize: 14, lineHeight: 22 },
    reviewButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, guidance: { flexDirection: 'row', gap: 9 },
    nextStep: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    bottom: { paddingHorizontal: 24, paddingVertical: 14, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, bottomInner: { width: '100%', maxWidth: 572, alignSelf: 'center' },
    place: { minHeight: 62, padding: 18, backgroundColor: colors.cta, borderWidth: 1, borderColor: colors.ctaBorder, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    placePrice: { fontFamily: fonts.heavy, color: colors.onDark, fontSize: 21 }, placeText: { fontFamily: fonts.bold, color: colors.onDark, fontSize: 15 },
});

