import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api, money, signIn } from '../operations/api';
import type { Branch, Delivery, Driver, Identity, MenuItem, Order } from '../operations/api';
import { OrderPanel } from './Board';
import { Drawer, LoadState, Switch } from './controls';
import { branchLabel, chime, dayTime, deliveryName, shortCode, statusName, timer, unlockSound, useNow, useResource } from './lib';

/* ---------- sign in ---------- */

export function SignIn({ onSignedIn, notice }: { onSignedIn: (identity: Identity) => void; notice: string }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(notice);
    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        unlockSound();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError('');
        try {
            await signIn(String(form.get('email')), String(form.get('password')));
            const { data } = await api<Identity>('/me');
            if (data.role !== 'staff') throw new Error('This account is for drivers. Use the driver app.');
            onSignedIn(data);
        }
        catch (err) { setError((err as Error).message); }
        finally { setBusy(false); }
    }
    return (
        <main className="signin">
            <section className="signin-brand">
                <p className="wordmark">Paramount <span>Signature</span></p>
                <p className="signin-role">Branch</p>
            </section>
            <section className="signin-form">
                <form onSubmit={submit}>
                    <h1>Sign in</h1>
                    <label>Email<input name="email" type="email" autoComplete="username" required /></label>
                    <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                    <p className="muted small">Access is by invitation from your administrator.</p>
                </form>
            </section>
        </main>
    );
}

/* ---------- menu ---------- */

const blankItem: MenuItem = { id: '', name: '', department: 'Food', category: '', description: '', image_url: '', price: 0, available: true, menu_variants: [] };
const toPayload = (item: MenuItem) => ({ ...item, variants: item.menu_variants.map(v => ({ id: v.id, label: v.label, price: Number(v.price) })) });

export function MenuView() {
    const menu = useResource<MenuItem[]>('/menu', 30000);
    const [filter, setFilter] = useState<'All' | 'Food' | 'Drinks' | 'Sold out'>('All');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<MenuItem | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const all = menu.data ?? [];
    const soldOut = all.filter(i => !i.available).length;
    const shown = all.filter(i => (filter === 'All' || (filter === 'Sold out' ? !i.available : i.department === filter))
        && `${i.name} ${i.category}`.toLowerCase().includes(search.trim().toLowerCase()));
    const groups = useMemo(() => {
        const map = new Map<string, MenuItem[]>();
        shown.forEach(i => map.set(i.category, [...(map.get(i.category) ?? []), i]));
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [shown]);

    async function toggle(item: MenuItem, available: boolean) {
        setBusy(item.id);
        setError('');
        menu.setData(list => (list ?? []).map(i => i.id === item.id ? { ...i, available } : i));
        try { await api('/menu', toPayload({ ...item, price: Number(item.price), available }), 'POST'); }
        catch (e) { setError(`${item.name}: ${(e as Error).message}`); menu.setData(list => (list ?? []).map(i => i.id === item.id ? { ...i, available: item.available } : i)); }
        finally { setBusy(null); void menu.load(); }
    }

    return (
        <section className="view">
            <header className="view-head">
                <h1>Menu</h1>
                <div className="segments" role="group" aria-label="Filter menu">
                    {(['All', 'Food', 'Drinks', 'Sold out'] as const).map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{f}{f === 'Sold out' && soldOut > 0 ? ` ${soldOut}` : ''}</button>)}
                </div>
                <input className="search" type="search" aria-label="Search menu" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
                <button className="primary" onClick={() => setEditing({ ...blankItem })}>Add item</button>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            <LoadState loading={menu.loading && !menu.data} error={menu.error} empty={shown.length === 0} emptyText={search ? 'No items match.' : filter === 'Sold out' ? 'Nothing is sold out.' : 'No items yet.'} retry={() => void menu.load()} />
            {groups.map(([category, items]) => (
                <section key={category} className="menu-group">
                    <h2>{category}</h2>
                    <ul className="rows">
                        {items.map(item => (
                            <li key={item.id} className={`row ${item.available ? '' : 'row-off'}`}>
                                <button className="row-main" onClick={() => setEditing(item)}>
                                    <span className="row-title">{item.name}</span>
                                    <span className="row-sub">{item.menu_variants.length ? item.menu_variants.map(v => `${v.label} ${money(v.price)}`).join(' · ') : money(item.price)}</span>
                                </button>
                                <span className={`avail ${item.available ? '' : 'off'}`}>{item.available ? 'Available' : 'Sold out'}</span>
                                <Switch checked={item.available} disabled={busy === item.id} label={`${item.name} available`} onChange={next => void toggle(item, next)} />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
            {editing && <MenuEditor initial={editing} close={() => setEditing(null)} saved={async () => { setEditing(null); await menu.load(); }} />}
        </section>
    );
}

function MenuEditor({ initial, close, saved }: { initial: MenuItem; close: () => void; saved: () => Promise<void> }) {
    const [item, setItem] = useState<MenuItem>(() => ({ ...structuredClone(initial), price: Number(initial.price), menu_variants: initial.menu_variants.map(v => ({ ...v, price: Number(v.price) })) }));
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const setVariant = (index: number, patch: Partial<MenuItem['menu_variants'][number]>) => setItem({ ...item, menu_variants: item.menu_variants.map((v, i) => i === index ? { ...v, ...patch } : v) });
    async function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try { await api('/menu', toPayload(item), 'POST'); await saved(); }
        catch (err) { setError((err as Error).message); }
        finally { setBusy(false); }
    }
    return (
        <Drawer onClose={close} title={<span className="panel-heading">{initial.id ? initial.name : 'New item'}</span>}
            footer={<button className="primary panel-action" form="menu-form" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>}>
            <form id="menu-form" className="form" onSubmit={submit}>
                <label>Name<input required maxLength={200} value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} /></label>
                <div className="form-grid">
                    <label>Section<select value={item.department} onChange={e => setItem({ ...item, department: e.target.value as MenuItem['department'] })}><option>Food</option><option>Drinks</option></select></label>
                    <label>Category<input required maxLength={200} value={item.category} onChange={e => setItem({ ...item, category: e.target.value })} /></label>
                </div>
                <label>Price (USD)<input type="number" min="0" max="100000" step="0.01" required value={item.price} onChange={e => setItem({ ...item, price: Number(e.target.value) })} /></label>
                <label>Description<textarea maxLength={2000} value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} /></label>
                <label>Image link<input type="url" value={item.image_url} placeholder="https://" onChange={e => setItem({ ...item, image_url: e.target.value })} /></label>
                <div className="switch-row"><span>Available</span><Switch checked={item.available} label="Available" onChange={available => setItem({ ...item, available })} /></div>
                <fieldset className="options">
                    <legend>Options</legend>
                    {item.menu_variants.length === 0 && <p className="muted small">One standard portion.</p>}
                    {item.menu_variants.map((v, i) => (
                        <div className="form-grid" key={v.id ?? `new-${i}`}>
                            <label>Name<input required maxLength={200} value={v.label} onChange={e => setVariant(i, { label: e.target.value })} /></label>
                            <label>Price<input required type="number" min="0" step="0.01" value={v.price} onChange={e => setVariant(i, { price: Number(e.target.value) })} /></label>
                        </div>
                    ))}
                    <button type="button" disabled={item.menu_variants.length >= 20} onClick={() => setItem({ ...item, menu_variants: [...item.menu_variants, { label: '', price: item.price }] })}>Add option</button>
                    {item.menu_variants.some(v => v.id) && <p className="muted small">Saved options stay linked to past orders, so they can be renamed but not removed.</p>}
                </fieldset>
                {error && <p className="form-error" role="alert">{error}</p>}
            </form>
        </Drawer>
    );
}

/* ---------- drivers ---------- */

export function DriversView() {
    const team = useResource<{ drivers: Driver[]; deliveries: Delivery[] }>('/drivers', 10000);
    const now = useNow();
    const drivers = team.data?.drivers ?? [];
    const deliveries = team.data?.deliveries ?? [];
    const waiting = deliveries.filter(d => !d.driver_id);
    const jobOf = (driver: Driver) => deliveries.find(d => d.driver_id === driver.id);
    const groups: [string, Driver[]][] = [
        ['On a job', drivers.filter(d => d.is_online && (d.status === 'busy' || jobOf(d)))],
        ['Free', drivers.filter(d => d.is_online && d.status !== 'busy' && !jobOf(d))],
        ['Offline', drivers.filter(d => !d.is_online)],
    ];
    const sinceOf = (d: Delivery) => d.picked_up_at ?? d.accepted_at ?? d.created_at;
    return (
        <section className="view">
            <header className="view-head"><h1>Drivers</h1><p className="view-meta">{drivers.filter(d => d.is_online).length} online</p></header>
            <LoadState loading={team.loading && !team.data} error={team.error} empty={drivers.length === 0} emptyText="No drivers are linked to this branch yet." retry={() => void team.load()} />
            {waiting.length > 0 && (
                <section className="menu-group">
                    <h2>Waiting for a driver</h2>
                    <ul className="rows">{waiting.map(d => <li key={d.id} className="row"><span className="row-main static"><span className="row-title code-cell">{shortCode(d.orders.order_number)}</span><span className="row-sub">{d.orders.delivery_address}</span></span>{d.created_at && <span className="row-time">{timer(now - new Date(d.created_at).getTime())}</span>}</li>)}</ul>
                </section>
            )}
            {groups.filter(([, list]) => list.length).map(([title, list]) => (
                <section key={title} className="menu-group">
                    <h2>{title}<span className="count">{list.length}</span></h2>
                    <ul className="rows">
                        {list.map(driver => {
                            const job = jobOf(driver);
                            return (
                                <li key={driver.id} className={`row ${driver.is_online ? '' : 'row-off'}`}>
                                    <span className="row-main static">
                                        <span className="row-title">{driver.full_name}</span>
                                        <span className="row-sub">{driver.driver_code}{driver.phone && <> · <a href={`tel:${driver.phone.replace(/\s/g, '')}`}>{driver.phone}</a></>}</span>
                                    </span>
                                    {job && <span className="row-job"><strong>{shortCode(job.orders.order_number)}</strong> {deliveryName(job.status)}{sinceOf(job) && <> · {timer(now - new Date(sinceOf(job)!).getTime())}</>}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </section>
    );
}

/* ---------- history ---------- */

const closedStatuses = ['delivered', 'completed', 'cancelled', 'rejected'];

export function HistoryView() {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Harare' }).format(new Date());
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [open, setOpen] = useState<Order | null>(null);
    const query = new URLSearchParams({ history: '1', page: String(page), status, search: search.trim(), from, to }).toString();
    const history = useResource<Order[]>(`/orders?${query}`, 60000);
    const now = useNow(60000);
    const list = history.data ?? [];
    return (
        <section className="view">
            <header className="view-head">
                <h1>History</h1>
                <input className="search" type="search" aria-label="Search order number" placeholder="Order number" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
                <select aria-label="Status" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}>
                    <option value="">All</option>{closedStatuses.map(s => <option key={s} value={s}>{statusName(s)}</option>)}
                </select>
                <label className="date">From<input type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setPage(0); }} /></label>
                <label className="date">To<input type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setPage(0); }} /></label>
            </header>
            <LoadState loading={history.loading && !history.data} error={history.error} empty={list.length === 0} emptyText="No closed orders in this range." retry={() => void history.load()} />
            {list.length > 0 && (
                <ul className="rows history">
                    {list.map(order => (
                        <li key={order.id} className="row">
                            <button className="row-main grid" onClick={() => setOpen(order)}>
                                <span className="row-title">{shortCode(order.order_number)}</span>
                                <span>{order.customer_name}</span>
                                <span className="muted">{order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                                <span className={`state state-${order.status}`}>{statusName(order.status)}</span>
                                <span className="num">{money(order.total)}</span>
                                <span className="muted">{dayTime(order.created_at)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {history.count > 25 && (
                <nav className="pager" aria-label="Pages">
                    <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                    <span>{page + 1} of {Math.ceil(history.count / 25)}</span>
                    <button disabled={(page + 1) * 25 >= history.count} onClick={() => setPage(page + 1)}>Next</button>
                </nav>
            )}
            {open && <OrderPanel order={open} drivers={[]} now={now} readOnly onClose={() => setOpen(null)} />}
        </section>
    );
}

/* ---------- branch ---------- */

export function BranchView({ branch, email, onSaved, onSignOut }: { branch: Branch; email: string; onSaved: (b: Branch) => void; onSignOut: () => void }) {
    const [draft, setDraft] = useState(branch);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const dirty = draft.phone !== branch.phone || draft.address !== branch.address;
    async function save(e: FormEvent) {
        e.preventDefault();
        setBusy(true); setError(''); setNotice('');
        try { const { data } = await api<Branch>('/branch', { phone: draft.phone, address: draft.address, accepting_orders: branch.accepting_orders }, 'PATCH'); onSaved(data); setDraft(data); setNotice('Saved.'); }
        catch (err) { setError((err as Error).message); }
        finally { setBusy(false); }
    }
    return (
        <section className="view narrow">
            <header className="view-head"><h1>{branchLabel(branch.name)}</h1></header>
            <form className="form card" onSubmit={save}>
                <label>Phone<input required maxLength={60} value={draft.phone ?? ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></label>
                <label>Collection address<textarea required maxLength={500} value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} /></label>
                {error && <p className="form-error" role="alert">{error}</p>}
                {notice && <p className="form-ok" role="status">{notice}</p>}
                <button className="primary" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save'}</button>
                <p className="muted small">Delivery fees, opening hours and staff accounts are set by your administrator.</p>
            </form>
            <div className="card settings-list">
                <div className="switch-row"><span>New-order sound</span><button onClick={() => { unlockSound(); setTimeout(() => chime(), 50); }}>Play test</button></div>
                <div className="switch-row"><span className="muted">{email}</span><button onClick={onSignOut}>Sign out</button></div>
            </div>
        </section>
    );
}
