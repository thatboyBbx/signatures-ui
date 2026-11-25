import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { money } from './api';
import type { Delivery } from './api';
import { PREVIEW, useDriver } from './DriverProvider';
import {
  Amount, Body, Button, Check, Choice, ErrorText, Field, Heading, HoldAction, Label, LinkButton, Muted, Panel, Row, Rule,
  Screen, Section, Segmented, Sheet, Stepper, SwipeAction, Title, Value,
} from './ui';
import { colors, fonts, radius, spacing } from '../theme/theme';

/* ---------- helpers ---------- */
const TZ = 'Africa/Harare';
const clock = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '';
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const dayName = (iso: string) => {
  const key = dayKey(iso);
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 864e5).toISOString());
  return key === today ? 'Today' : key === yesterday ? 'Yesterday' : new Date(iso).toLocaleDateString('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'short' });
};
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;
};
const itemCount = (job: Delivery) => job.orders.order_items.reduce((n, i) => n + i.quantity, 0);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const facts = (job: Delivery) => [
  job.distance_km != null ? `${Number(job.distance_km).toFixed(1)} km` : '',
  job.estimated_minutes != null ? `~${job.estimated_minutes} min` : '',
  plural(itemCount(job), 'item'),
].filter(Boolean).join(' · ');
const firstName = (name?: string) => name?.split(' ')[0] ?? '';

async function open(url: string, setError: (m: string) => void, fallback: string) {
  try { await Linking.openURL(url); } catch { setError(fallback); }
}
const call = (phone: string | null | undefined, setError: (m: string) => void) =>
  phone ? open(`tel:${phone.replace(/\s/g, '')}`, setError, `Could not start a call. Dial ${phone}.`) : setError('No phone number on file.');
const maps = (address: string, setError: (m: string) => void) =>
  open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, setError, 'Could not open Maps. Use the address shown.');

function useRefreshOnFocus() {
  const { refresh } = useDriver();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return { busy, error, setError, run };
}

/* ---------- Sign in ---------- */
export function SignInScreen() {
  const store = useDriver();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <SafeAreaView edges={['top']} style={s.brandBlock}>
      <View style={s.brandInner}>
        <Text style={s.brand}>Paramount <Text style={s.brandAccent}>Signature</Text></Text>
        <Text style={s.brandSub}>Driver</Text>
      </View>
    </SafeAreaView>
    <Screen footer={<>
      <Button disabled={busy || !email || !password} onPress={() => run(() => store.signIn(email.trim(), password))}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      <Muted style={{ textAlign: 'center', fontSize: 13 }}>No account? Ask your branch for an invite.</Muted>
    </>}>
      <Title>Sign in</Title>
      <Section style={{ gap: spacing.lg }}>
        <Field title="Email" value={email} onChangeText={setEmail} email />
        <Field title="Password" value={password} onChangeText={setPassword} password />
      </Section>
      <ErrorText message={error} />
    </Screen>
  </View>;
}

/* ---------- Shift (tab 1) ---------- */
export function ShiftScreen() {
  useRefreshOnFocus();
  const store = useDriver();
  if (store.finished) return <DoneView job={store.finished} />;
  const job = store.active[0];
  if (job) return <JobView key={job.id} job={job} />;
  return <WaitingView />;
}

function StatusStrip() {
  const store = useDriver();
  const { busy, error, run } = useAction();
  const online = store.identity?.driver.is_online ?? false;
  const branch = store.identity?.branch.name ?? '';
  return <View style={{ gap: spacing.sm }}>
    <View style={[s.strip, online ? s.stripOn : s.stripOff]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.stripTitle, !online && { color: colors.text }]}>{online ? 'Online' : 'Offline'}</Text>
        <Text style={[s.stripSub, !online && { color: colors.textSecondary }]}>{branch}</Text>
      </View>
      {online && <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(() => store.setOnline(false))} style={s.stripButton}>
        <Text style={s.stripButtonText}>{busy ? '…' : 'Go offline'}</Text>
      </Pressable>}
    </View>
    <ErrorText message={error} />
  </View>;
}

function TodayLine() {
  const { earnings } = useDriver();
  return <Pressable accessibilityRole="link" onPress={() => router.push('/earnings')} style={s.today}>
    <Label>Today</Label>
    <Value style={{ fontVariant: ['tabular-nums'] }}>{earnings ? `${money(earnings.today)} · ${plural(earnings.todayCount, 'delivery', 'deliveries')}` : '—'}</Value>
  </Pressable>;
}

function WaitingView() {
  const store = useDriver();
  const { busy, error, run } = useAction();
  const [open, setOpen] = useState<Delivery | null>(null);
  const online = store.identity?.driver.is_online ?? false;
  const branch = store.identity?.branch.name ?? 'your branch';
  return <Screen footer={!online ? <>
    <ErrorText message={error} />
    <Button disabled={busy} onPress={() => run(() => store.setOnline(true))}>{busy ? 'Going online…' : 'Go online'}</Button>
  </> : undefined}>
    <StatusStrip />
    {online ? <Section style={{ gap: spacing.md }}>
      <Row>
        <Heading>Requests</Heading>
        {store.available.length > 0 && <Label>{store.available.length}</Label>}
      </Row>
      {store.available.length
        ? store.available.map(job => <RequestRow key={job.id} job={job} onPress={() => setOpen(job)} />)
        : <View style={s.empty}>
          <Body>No requests right now.</Body>
          <Label>{store.loading ? 'Checking…' : store.updated ? `Checked ${clock(store.updated)}` : ''}</Label>
        </View>}
    </Section> : <Section>
      <Title>Hello, {firstName(store.identity?.driver.full_name)}.</Title>
      <Muted>Go online to get requests from {branch}.</Muted>
    </Section>}
    <View style={{ flex: 1 }} />
    <TodayLine />
    {open && <RequestSheet job={open} onClose={() => setOpen(null)} />}
  </Screen>;
}

function RequestRow({ job, onPress }: { job: Delivery; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Request, ${money(job.earnings ?? job.driver_earnings)}, to ${job.delivery_address}`}
    onPress={onPress} style={({ pressed }) => [s.request, pressed && { backgroundColor: colors.surfaceSecondary }]}>
    <Row style={{ alignItems: 'flex-start' }}>
      <Amount style={{ fontSize: 30, lineHeight: 34 }}>{money(job.earnings ?? job.driver_earnings)}</Amount>
      <Label>{ago(job.created_at)}</Label>
    </Row>
    <Value lines={2}>{job.delivery_address}</Value>
    <Row>
      <Label>{facts(job)}</Label>
      <Label style={{ color: colors.text }}>Cash {money(job.orders.total)}</Label>
    </Row>
  </Pressable>;
}

function RequestSheet({ job, onClose }: { job: Delivery; onClose: () => void }) {
  const store = useDriver();
  const { busy, error, run } = useAction();
  const online = store.identity?.driver.is_online ?? false;
  const blocked = !online ? 'Go online to accept.' : store.active.length ? 'Finish your current delivery first.' : '';
  return <Sheet visible onClose={onClose} footer={<>
    <ErrorText message={error} />
    {blocked ? <Body style={{ textAlign: 'center' }}>{blocked}</Body>
      : <SwipeAction label="Swipe to accept" busy={busy} onConfirm={() => run(async () => { await store.accept(job); onClose(); })} />}
    <Button variant="quiet" disabled={busy} onPress={() => { store.decline(job.id); onClose(); }}>Decline</Button>
  </>}>
    <View>
      <Label>Your earning</Label>
      <Amount>{money(job.earnings ?? job.driver_earnings)}</Amount>
    </View>
    <Rule />
    <Section style={{ gap: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Label>Collect</Label>
        <Value>{job.orders.branches.name}</Value>
        <Muted>{job.orders.branches.address}</Muted>
      </View>
      <View style={{ gap: 2 }}>
        <Label>Deliver</Label>
        <Value>{job.delivery_address}</Value>
        <Muted>{job.orders.customer_name}</Muted>
      </View>
    </Section>
    <View style={s.facts}>
      {job.distance_km != null && <Fact label="Distance" value={`${Number(job.distance_km).toFixed(1)} km`} />}
      {job.estimated_minutes != null && <Fact label="Time" value={`~${job.estimated_minutes} min`} />}
      <Fact label="Items" value={String(itemCount(job))} />
      <Fact label="Cash" value={money(job.orders.total)} />
    </View>
    {!!job.orders.notes && <Note text={job.orders.notes} />}
    <Label>Posted {ago(job.created_at).toLowerCase()} · {job.orders.order_number}</Label>
  </Sheet>;
}

const Fact = ({ label, value }: { label: string; value: string }) =>
  <View style={{ flex: 1, gap: 2 }}><Label>{label}</Label><Value style={{ fontVariant: ['tabular-nums'] }}>{value}</Value></View>;

const Note = ({ text }: { text: string }) =>
  <View style={s.note}><Label>Note from customer</Label><Body>{text}</Body></View>;

/* ---------- Active job ---------- */
const STEPS = ['Collect', 'Deliver', 'Hand over'];

function JobView({ job }: { job: Delivery }) {
  const store = useDriver();
  const { busy, error, setError, run } = useAction();
  const [atDoor, setAtDoor] = useState(false);
  const [problem, setProblem] = useState(false);
  const [ticked, setTicked] = useState<string[]>([]);
  const collecting = job.status === 'heading_to_restaurant' || job.status === 'arrived_at_restaurant';
  const handover = job.status === 'on_the_way' && atDoor;
  const step = collecting ? 0 : handover ? 2 : 1;
  const branchPhone = store.identity?.branch.phone;
  const next = () => run(() => store.advance(job));

  const footer = (() => {
    switch (job.status) {
      case 'heading_to_restaurant': return <Button disabled={busy} onPress={next}>{busy ? 'Saving…' : 'I’ve arrived'}</Button>;
      case 'arrived_at_restaurant': return <SwipeAction label="Swipe · order in hand" busy={busy} onConfirm={next} />;
      case 'picked_up': return <Button disabled={busy} onPress={next}>{busy ? 'Saving…' : 'Start delivery'}</Button>;
      case 'on_the_way': return atDoor
        ? <HoldAction label="Hold · cash collected" busy={busy} onConfirm={() => run(() => store.advance(job, true))} />
        : <Button onPress={() => setAtDoor(true)}>I’m at the door</Button>;
      default: return null;
    }
  })();

  return <Screen footer={<><ErrorText message={error} />{footer}</>}>
    <View style={{ gap: spacing.lg }}>
      <Row>
        <Label style={{ color: colors.text }} >{job.orders.order_number}</Label>
        <Label>{money(job.earnings ?? job.driver_earnings)}</Label>
      </Row>
      <Stepper steps={STEPS} current={step} />
    </View>

    {job.status === 'heading_to_restaurant' && <>
      <Section>
        <Label>Collect from</Label>
        <Title>{job.orders.branches.name}</Title>
        <Body>{job.orders.branches.address}</Body>
        <Row style={{ justifyContent: 'flex-start' }}>
          <LinkButton onPress={() => call(branchPhone, setError)}>Call branch</LinkButton>
          <LinkButton onPress={() => maps(job.orders.branches.address, setError)}>Open in Maps</LinkButton>
        </Row>
      </Section>
      <Items job={job} />
    </>}

    {job.status === 'arrived_at_restaurant' && <>
      <Section>
        <Label>Show staff this order</Label>
        <View style={s.orderBox}><Text selectable style={s.orderNumber}>{job.orders.order_number}</Text></View>
      </Section>
      <Section>
        <Row><Label>Check the bag</Label><Label>{ticked.length}/{job.orders.order_items.length}</Label></Row>
        {job.orders.order_items.map(i => <Check key={i.id} checked={ticked.includes(i.id)}
          label={`${i.quantity} × ${i.item_name}`} detail={i.variant_name || undefined}
          onPress={() => setTicked(t => t.includes(i.id) ? t.filter(x => x !== i.id) : [...t, i.id])} />)}
      </Section>
    </>}

    {(job.status === 'picked_up' || (job.status === 'on_the_way' && !atDoor)) && <>
      <Section>
        <Label>Deliver to</Label>
        <Title>{job.orders.customer_name}</Title>
        <Value>{job.delivery_address}</Value>
        <Row style={{ justifyContent: 'flex-start' }}>
          <LinkButton onPress={() => call(job.orders.customer_phone, setError)}>Call customer</LinkButton>
          <LinkButton onPress={() => maps(job.delivery_address, setError)}>Open in Maps</LinkButton>
        </Row>
      </Section>
      {!!job.orders.notes && <Note text={job.orders.notes} />}
      <Row style={s.cashRow}>
        <Label>Cash to collect</Label>
        <Value style={{ fontVariant: ['tabular-nums'] }}>{money(job.orders.total)}</Value>
      </Row>
    </>}

    {handover && <Handover job={job} onBack={() => setAtDoor(false)} />}

    <View style={{ flex: 1 }} />
    <Pressable accessibilityRole="button" onPress={() => setProblem(true)} style={s.problemLink}>
      <Label>Problem with this order?</Label>
    </Pressable>
    <ProblemSheet visible={problem} job={job} onClose={() => setProblem(false)} />
  </Screen>;
}

function Items({ job }: { job: Delivery }) {
  return <Section>
    <Row><Label>Order</Label><Label>{plural(itemCount(job), 'item')}</Label></Row>
    <Panel style={{ gap: spacing.sm }}>
      {job.orders.order_items.map(i => <Row key={i.id} style={{ alignItems: 'flex-start' }}>
        <Body style={{ flex: 1 }}>{i.quantity} × {i.item_name}</Body>
        {!!i.variant_name && <Label>{i.variant_name}</Label>}
      </Row>)}
    </Panel>
  </Section>;
}

// Note options above the total, for working out change on the doorstep.
function notesFor(total: number) {
  const out: number[] = [];
  for (const n of [5, 10, 20, 50, 100]) {
    const tendered = Math.ceil(total / n) * n;
    if (tendered > total && !out.includes(tendered)) out.push(tendered);
    if (out.length === 3) break;
  }
  return out;
}

function Handover({ job, onBack }: { job: Delivery; onBack: () => void }) {
  const total = Number(job.orders.total);
  const [paid, setPaid] = useState<number | null>(null);
  return <>
    <Section style={{ alignItems: 'center', paddingVertical: spacing.md }}>
      <Label>Cash to collect</Label>
      <Amount style={{ fontSize: 60, lineHeight: 66 }}>{money(total)}</Amount>
      <Muted>from {job.orders.customer_name}</Muted>
    </Section>
    <Section>
      <Label>Customer pays with</Label>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {[total, ...notesFor(total)].map((n, i) => <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: paid === n }}
          onPress={() => setPaid(n)} style={[s.note$, paid === n && s.note$On]}>
          <Text style={[s.note$Text, paid === n && { color: colors.onDark }]}>{i === 0 ? 'Exact' : money(n).replace('.00', '')}</Text>
        </Pressable>)}
      </View>
      {paid != null && paid > total && <Row style={s.cashRow}>
        <Label>Give change</Label>
        <Value style={{ fontVariant: ['tabular-nums'] }}>{money(paid - total)}</Value>
      </Row>}
    </Section>
    <Pressable accessibilityRole="button" onPress={onBack} style={{ minHeight: 44, justifyContent: 'center' }}>
      <Label style={{ textDecorationLine: 'underline' }}>Back to address</Label>
    </Pressable>
  </>;
}

const PROBLEMS = [
  { key: 'no_answer', label: 'Customer not answering', who: 'customer' },
  { key: 'address', label: 'Wrong or unclear address', who: 'customer' },
  { key: 'not_ready', label: 'Order not ready', who: 'branch' },
  { key: 'missing', label: 'Items missing or damaged', who: 'branch' },
  { key: 'other', label: 'Something else', who: 'branch' },
];

function ProblemSheet({ visible, job, onClose }: { visible: boolean; job: Delivery; onClose: () => void }) {
  const store = useDriver();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const picked = PROBLEMS.find(p => p.key === reason);
  const close = () => { setReason(''); setError(''); onClose(); };
  return <Sheet visible={visible} onClose={close} footer={<>
    <ErrorText message={error} />
    <Button disabled={!picked} onPress={() => call(store.identity?.branch.phone, setError)}>{`Call ${store.identity?.branch.name ?? 'branch'}`}</Button>
    {picked?.who === 'customer' && <Button variant="secondary" onPress={() => call(job.orders.customer_phone, setError)}>Call customer</Button>}
    <Button variant="quiet" onPress={close}>Close</Button>
  </>}>
    <Heading>What’s wrong?</Heading>
    <View accessibilityRole="radiogroup">
      {PROBLEMS.map(p => <Choice key={p.key} label={p.label} selected={reason === p.key} onPress={() => setReason(p.key)} />)}
    </View>
  </Sheet>;
}

function DoneView({ job }: { job: Delivery }) {
  const store = useDriver();
  return <Screen footer={<Button onPress={store.clearFinished}>{store.identity?.driver.is_online ? 'Back to requests' : 'Done'}</Button>}>
    <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl }}>
      <Section style={{ alignItems: 'center' }}>
        <Label>Delivered · {clock(job.delivered_at)}</Label>
        <Amount style={{ fontSize: 60, lineHeight: 66 }}>{money(job.earnings ?? job.driver_earnings)}</Amount>
        <Muted>earned</Muted>
      </Section>
      <Panel>
        <Row><Label>Cash collected</Label><Value>{money(job.orders.total)}</Value></Row>
        <Rule />
        <Row><Label>Today</Label><Value>{store.earnings ? `${money(store.earnings.today)} · ${plural(store.earnings.todayCount, 'delivery', 'deliveries')}` : '—'}</Value></Row>
      </Panel>
    </View>
  </Screen>;
}

/* ---------- Earnings (tab 2) ---------- */
type Period = 'today' | 'week' | 'all';
export function EarningsScreen() {
  useRefreshOnFocus();
  const store = useDriver();
  const [period, setPeriod] = useState<Period>('today');
  const e = store.earnings;
  const todayKey = dayKey(new Date().toISOString());
  const weekStart = (() => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: TZ })); const back = (d.getDay() + 6) % 7; d.setDate(d.getDate() - back); return d.toLocaleDateString('en-CA'); })();
  const trips = store.completed.filter(j => j.delivered_at && (period === 'all' || (period === 'today' ? dayKey(j.delivered_at) === todayKey : dayKey(j.delivered_at) >= weekStart)));
  const amount = e ? (period === 'today' ? e.today : period === 'week' ? e.week : e.allTime) : null;
  const count = e ? (period === 'today' ? e.todayCount : period === 'week' ? e.weekCount : null) : null;
  const cash = trips.reduce((sum, j) => sum + Number(j.orders.total), 0);
  const groups = trips.reduce<Record<string, Delivery[]>>((acc, j) => { const k = dayName(j.delivered_at!); (acc[k] ??= []).push(j); return acc; }, {});

  return <Screen>
    <Title>Earnings</Title>
    <Segmented<Period> value={period} onChange={setPeriod} options={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'This week' }, { value: 'all', label: 'All time' }]} />
    <Section>
      <Amount>{amount == null ? '—' : money(amount)}</Amount>
      {count != null && <Muted>{plural(count, 'delivery', 'deliveries')}</Muted>}
    </Section>
    {period !== 'all' && <Row style={s.cashRow}>
      <Label>Cash collected for orders</Label>
      <Value style={{ fontVariant: ['tabular-nums'] }}>{money(cash)}</Value>
    </Row>}
    <Label>Earned, not paid out. Payouts aren’t in the app yet.</Label>
    <Section style={{ gap: spacing.lg }}>
      {Object.entries(groups).map(([day, list]) => <Section key={day}>
        <Label style={{ color: colors.text }}>{day}</Label>
        {list.map((j, i) => <View key={j.id}>
          {i > 0 && <Rule />}
          <Row style={{ paddingVertical: spacing.md, alignItems: 'flex-start' }}>
            <Label style={{ width: 44, paddingTop: 2 }}>{clock(j.delivered_at)}</Label>
            <View style={{ flex: 1 }}>
              <Body lines={1}>{j.delivery_address}</Body>
              <Label>Cash {money(j.orders.total)}</Label>
            </View>
            <Value style={{ fontVariant: ['tabular-nums'] }}>{money(j.earnings ?? j.driver_earnings)}</Value>
          </Row>
        </View>)}
      </Section>)}
      {!trips.length && <Muted>No deliveries {period === 'today' ? 'today' : period === 'week' ? 'this week' : 'yet'}.</Muted>}
    </Section>
  </Screen>;
}

/* ---------- Profile (tab 3) ---------- */
export function ProfileScreen() {
  useRefreshOnFocus();
  const store = useDriver();
  const driver = store.identity!.driver;
  const branch = store.identity!.branch;
  const [name, setName] = useState(driver.full_name);
  const [phone, setPhone] = useState(driver.phone);
  const [saved, setSaved] = useState(false);
  const save = useAction();
  const toggle = useAction();
  const changed = name.trim() !== driver.full_name || phone.trim() !== driver.phone;
  return <Screen>
    <Section style={{ gap: 2 }}>
      <Title>{driver.full_name}</Title>
      <Label>{driver.driver_code} · {branch.name}</Label>
    </Section>

    <Panel>
      <Row>
        <View style={{ flex: 1 }}>
          <Value>{driver.is_online ? 'Online' : 'Offline'}</Value>
          <Label>{store.active.length ? 'You have a delivery in progress' : driver.is_online ? 'Receiving requests' : 'Not receiving requests'}</Label>
        </View>
        <Switch accessibilityLabel="Available for new deliveries" value={driver.is_online} disabled={toggle.busy}
          trackColor={{ true: colors.espresso, false: colors.border }} thumbColor={colors.surface}
          onValueChange={v => toggle.run(() => store.setOnline(v))} />
      </Row>
      <ErrorText message={toggle.error} />
    </Panel>

    <Section style={{ gap: spacing.lg }}>
      <Heading>Your details</Heading>
      <Field title="Full name" value={name} onChangeText={v => { setName(v); setSaved(false); }} />
      <Field title="Phone" value={phone} onChangeText={v => { setPhone(v); setSaved(false); }} phone />
      <ErrorText message={save.error} />
      {(changed || saved) && <Button variant="secondary" disabled={save.busy || !changed || !name.trim() || !phone.trim()}
        onPress={() => save.run(async () => { await store.saveProfile({ full_name: name.trim(), phone: phone.trim() }); setSaved(true); })}>
        {save.busy ? 'Saving…' : saved && !changed ? 'Saved' : 'Save details'}
      </Button>}
    </Section>

    <Section>
      <Heading>Branch</Heading>
      <Value>{branch.name}</Value>
      <Muted>{branch.address}</Muted>
      {!!branch.phone && <Row style={{ justifyContent: 'flex-start' }}>
        <LinkButton onPress={() => call(branch.phone, save.setError)}>{`Call ${branch.phone}`}</LinkButton>
      </Row>}
    </Section>

    <Section>
      <Heading>Account</Heading>
      <Body>{store.identity?.email}</Body>
      <Label>Branch and access are managed by your administrator.</Label>
    </Section>

    <Button variant="secondary" onPress={store.signOut}>Sign out</Button>
    {PREVIEW && <Label style={{ textAlign: 'center' }}>Preview data</Label>}
  </Screen>;
}

const s = StyleSheet.create({
  brandBlock: { backgroundColor: colors.espresso },
  brandInner: { paddingHorizontal: spacing.xxl, paddingTop: 56, paddingBottom: spacing.xxxl, width: '100%', maxWidth: 560, alignSelf: 'center', gap: 4 },
  brand: { fontFamily: fonts.heading, fontSize: 36, lineHeight: 42, color: colors.onDark },
  brandAccent: { fontFamily: fonts.headingItalic, color: colors.gold },
  brandSub: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDarkMuted, letterSpacing: 0.4 },
  strip: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, paddingLeft: spacing.lg, minHeight: 68, borderWidth: 1 },
  stripOn: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  stripOff: { backgroundColor: colors.surface, borderColor: colors.border, paddingRight: spacing.lg },
  stripTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.onDark },
  stripSub: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.gold },
  stripButton: { minHeight: 68, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  stripButtonText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark, textDecorationLine: 'underline' },
  today: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm },
  empty: { paddingVertical: spacing.xxl, gap: 4 },
  request: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  facts: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  note: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: 4 },
  cashRow: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.lg, minHeight: 56 },
  orderBox: { backgroundColor: colors.surface, borderColor: colors.espresso, borderWidth: 2, borderRadius: radius.lg, paddingVertical: spacing.xl, alignItems: 'center' },
  orderNumber: { fontFamily: fonts.bold, fontSize: 22, letterSpacing: 1, color: colors.text, fontVariant: ['tabular-nums'] },
  problemLink: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  note$: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  note$On: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  note$Text: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, fontVariant: ['tabular-nums'] },
});
