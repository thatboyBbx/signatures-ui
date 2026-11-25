import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { money } from '../operations/api';
import { runAction } from './actions';
import type { Action } from './actions';
import type { Delivery, Driver, Order } from '../operations/api';
import { ConfirmAction, Drawer, HoldButton } from './controls';
import {
    chime, clock, deliveryOf, eventName, fetchActiveOrders, firstName, itemCount, plural, readStore, shortCode,
    stageOf, stageStart, statusName, timer, urgency, useNow, useResource, writeStore,
} from './lib';

type Column = { key: string; title: string; match: (o: Order) => boolean };
const columns: Column[] = [
    { key: 'new', title: 'New', match: o => o.status === 'confirmed' },
    { key: 'preparing', title: 'Preparing', match: o => o.status === 'preparing' },
    { key: 'ready', title: 'Ready', match: o => o.status === 'ready' },
    { key: 'driver', title: 'Driver', match: o => o.status === 'awaiting_driver' || o.status === 'driver_assigned' },
];

const optimistic: Partial<Record<Action, string>> = { accept: 'preparing', reject: 'rejected', ready: 'ready', dispatch: 'awaiting_driver', cancel: 'cancelled', handover: 'completed' };

/* ---------- the board ---------- */

export function ServiceBoard({ soundOn, onSync }: { soundOn: boolean; onSync: (state: { error: string; updated: number }) => void }) {
    const orders = useResource<Order[]>('/orders?board', 5000, fetchActiveOrders);
    const team = useResource<{ drivers: Driver[]; deliveries: Delivery[] }>('/drivers', 15000);
    const now = useNow();
    const [openId, setOpenId] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notice, setNotice] = useState('');
    const [tab, setTab] = useState('new');
    const [seen, setSeen] = useState<string[]>(() => readStore('branch.seen', []));

    useEffect(() => { onSync({ error: orders.error, updated: orders.updated }); }, [orders.error, orders.updated, onSync]);

    const active = useMemo(() => (orders.data ?? []).filter(o => columns.some(c => c.match(o))), [orders.data]);
    const unseen = active.filter(o => o.status === 'confirmed' && !seen.includes(o.id));
    const stale = !!orders.error && !!orders.data;

    const markSeen = useCallback((id: string) => setSeen(current => {
        if (current.includes(id)) return current;
        const next = [...current, id].slice(-200);
        writeStore('branch.seen', next);
        return next;
    }), []);

    // New-order sound: once when an order lands, then every 8 s until someone opens it.
    const unseenKey = unseen.map(o => o.id).join(',');
    const heard = useRef(new Set<string>());
    useEffect(() => {
        if (!soundOn || !unseenKey) return;
        const fresh = unseenKey.split(',').some(id => !heard.current.has(id));
        unseenKey.split(',').forEach(id => heard.current.add(id));
        if (fresh) chime();
        const repeat = setInterval(() => chime(), 8000);
        return () => clearInterval(repeat);
    }, [unseenKey, soundOn]);

    useEffect(() => { document.title = unseen.length ? `(${unseen.length}) New order · Branch` : 'Branch · Paramount Signature'; }, [unseen.length]);

    const act = useCallback(async (order: Order, action: Action) => {
        markSeen(order.id);
        setBusyId(order.id);
        setNotice('');
        const previous = orders.data;
        const next = optimistic[action];
        if (next) orders.setData(list => (list ?? []).map(o => o.id === order.id ? { ...o, status: action === 'ready' && o.order_type === 'delivery' ? 'awaiting_driver' : next } : o));
        try {
            const warning = await runAction(order, action);
            if (warning) setNotice(warning);
            if (['reject', 'cancel', 'handover'].includes(action)) setOpenId(null);
        }
        catch (e) {
            orders.setData(() => previous);
            setNotice((e as Error).message);
        }
        finally {
            setBusyId(null);
            void orders.load();
            void team.load();
        }
    }, [orders, team, markSeen]);

    const open = active.find(o => o.id === openId) ?? null;
    const drivers = team.data?.drivers ?? [];
    const online = drivers.filter(d => d.is_online);

    if (!orders.data) {
        return orders.error
            ? <div className="quiet-state" role="alert"><p>{orders.error}</p><button onClick={() => void orders.load()}>Try again</button></div>
            : <p className="quiet-state" role="status">Loading the board…</p>;
    }

    return (
        <section className="board-wrap" aria-label="Service board">
            <nav className="stage-tabs" aria-label="Board columns">
                {columns.map(c => {
                    const n = active.filter(c.match).length;
                    return <button key={c.key} className={tab === c.key ? 'active' : ''} aria-pressed={tab === c.key} onClick={() => setTab(c.key)}>{c.title}<span>{n}</span></button>;
                })}
            </nav>
            <div className="board">
                {columns.map(column => {
                    const list = active.filter(column.match).sort((a, b) => stageStart(a).localeCompare(stageStart(b)));
                    const noDrivers = column.key === 'driver' && team.data && online.length === 0 && list.length > 0;
                    return (
                        <section key={column.key} className={`column ${tab === column.key ? 'column-current' : ''}`} aria-label={column.title}>
                            <header className="column-head">
                                <h2>{column.title}</h2>
                                <span className="column-count">{list.length}</span>
                                {column.key === 'driver' && team.data && <span className={`column-note ${noDrivers ? 'alert' : ''}`}>{online.length ? `${online.length} online` : 'No drivers online'}</span>}
                            </header>
                            <div className="tickets">
                                {list.length === 0 && <p className="column-empty">None</p>}
                                {list.map(order => (
                                    <Ticket key={order.id} order={order} now={now} unseen={order.status === 'confirmed' && !seen.includes(order.id)} busy={busyId === order.id || stale}
                                        onOpen={() => { markSeen(order.id); setOpenId(order.id); }} onAction={action => void act(order, action)} />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
            {notice && <div className="toast" role="status"><span>{notice}</span><button className="text-button" onClick={() => setNotice('')}>Dismiss</button></div>}
            {open && <OrderPanel order={open} drivers={drivers} now={now} busy={busyId === open.id || stale} onClose={() => setOpenId(null)} onAction={action => void act(open, action)} />}
        </section>
    );
}

/* ---------- one ticket ---------- */

function driverLine(order: Order) {
    const stage = stageOf(order);
    const name = deliveryOf(order)?.drivers?.full_name;
    if (stage === 'driver_search') return 'Finding a driver';
    if (!name) return 'Driver assigned';
    if (stage === 'driver_here') return `${firstName(name)} is here`;
    if (stage === 'driver_collected') return `${firstName(name)} has it`;
    return `${firstName(name)} coming`;
}

function primaryFor(order: Order): { action: Action; label: string; hold?: boolean } | null {
    if (order.status === 'confirmed') return { action: 'accept', label: 'Accept' };
    if (order.status === 'preparing') return { action: 'ready', label: 'Ready' };
    if (order.status === 'ready' && order.order_type === 'pickup') return { action: 'handover', label: 'Hold · handed over, cash in', hold: true };
    if (order.status === 'ready') return { action: 'dispatch', label: 'Request driver' };
    return null;
}

function Ticket({ order, now, unseen, busy, onOpen, onAction }: { order: Order; now: number; unseen: boolean; busy: boolean; onOpen: () => void; onAction: (a: Action) => void }) {
    const level = urgency(order, now);
    const elapsed = now - new Date(stageStart(order)).getTime();
    const primary = primaryFor(order);
    const isDriver = order.status === 'awaiting_driver' || order.status === 'driver_assigned';
    const detail = isDriver ? driverLine(order)
        : order.status === 'ready' && order.order_type === 'pickup' ? `Pickup · ${firstName(order.customer_name)}`
            : `${order.order_type === 'pickup' ? 'Pickup' : 'Delivery'} · ${plural(itemCount(order), 'item')}`;
    return (
        <article className={`ticket level-${level} ${unseen ? 'ticket-unseen' : ''}`}>
            <button className="ticket-open" onClick={onOpen} aria-label={`Order ${shortCode(order.order_number)}, ${detail}. Open details`}>
                <span className="ticket-top">
                    <span className="ticket-code">{shortCode(order.order_number)}</span>
                    <span className="ticket-timer">{timer(elapsed)}</span>
                </span>
                <span className="ticket-detail">{detail}</span>
                {order.notes && !isDriver && <span className="ticket-note">{order.notes}</span>}
            </button>
            {primary && (primary.hold
                ? <HoldButton label={primary.label} disabled={busy} onConfirm={() => onAction(primary.action)} className="ticket-action" />
                : <button className="ticket-action primary" disabled={busy} onClick={() => onAction(primary.action)}>{primary.label}</button>)}
        </article>
    );
}

/* ---------- order details panel ---------- */

export function OrderPanel({ order, drivers, now, busy = false, readOnly = false, onClose, onAction }: { order: Order; drivers: Driver[]; now: number; busy?: boolean; readOnly?: boolean; onClose: () => void; onAction?: (a: Action) => void }) {
    const delivery = deliveryOf(order);
    const driver = delivery?.driver_id ? drivers.find(d => d.id === delivery.driver_id) : undefined;
    const driverName = delivery?.drivers?.full_name ?? driver?.full_name;
    const primary = readOnly ? null : primaryFor(order);
    const live = !readOnly && ['confirmed', 'preparing', 'ready', 'awaiting_driver', 'driver_assigned'].includes(order.status);
    const events = [...(order.order_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const destructive = readOnly ? null
        : order.status === 'confirmed' ? { action: 'reject' as const, label: 'Reject order', question: 'Reject this order? The customer will see it as rejected.', confirm: 'Reject' }
            : order.status === 'preparing' ? { action: 'cancel' as const, label: 'Cancel order', question: 'Cancel this order? Food in progress will not go out.', confirm: 'Cancel order' }
                : null;

    return (
        <Drawer onClose={onClose} title={<>
            <span className="panel-code">{shortCode(order.order_number)}</span>
            <span className="panel-status">{live && order.status !== 'confirmed' && order.status !== 'preparing' && order.status !== 'ready' ? (stageOf(order) === 'driver_search' ? 'Finding a driver' : driverLine(order)) : statusName(order.status)}{live && <> · {timer(now - new Date(stageStart(order)).getTime())}</>}</span>
        </>} footer={primary && onAction ? (primary.hold
            ? <HoldButton label={primary.label} disabled={busy} onConfirm={() => onAction(primary.action)} className="panel-action" />
            : <button className="primary panel-action" disabled={busy} onClick={() => onAction(primary.action)}>{primary.label}</button>) : undefined}>

            <div className="print-ticket">
                <p className="print-only print-code">{shortCode(order.order_number)}</p>
                <section className="panel-block">
                    <h3 className="customer">{order.customer_name}</h3>
                    <p className="muted">{order.order_type === 'pickup' ? 'Pickup at the branch' : order.delivery_address}</p>
                    {order.customer_phone && <a className="call-link no-print" href={`tel:${order.customer_phone.replace(/\s/g, '')}`}>Call {order.customer_phone}</a>}
                </section>

                {order.notes && <section className="note-box"><span className="label">Note</span><p>{order.notes}</p></section>}

                {order.order_type === 'delivery' && (delivery || order.status === 'ready') && (
                    <section className="panel-block driver-block no-print">
                        <span className="label">Driver</span>
                        {driverName
                            ? <p><strong>{driverName}</strong> · {stageOf(order) === 'driver_here' ? 'at the counter' : stageOf(order) === 'driver_collected' ? 'collected' : order.status === 'on_the_way' ? 'on the way' : order.status === 'delivered' ? 'delivered' : 'on the way in'}</p>
                            : <p>{order.status === 'ready' ? 'Not requested yet' : 'Waiting for a driver to accept'}</p>}
                        {driver?.phone && <a className="call-link" href={`tel:${driver.phone.replace(/\s/g, '')}`}>Call {driver.phone}</a>}
                        {stageOf(order) === 'driver_here' && <p className="match-hint">Match the code <strong>{shortCode(order.order_number)}</strong> with the driver before handing over.</p>}
                    </section>
                )}

                <section className="panel-block">
                    <ul className="items">
                        {order.order_items.map(item => (
                            <li key={item.id}>
                                <span className="qty">{item.quantity}×</span>
                                <span className="item-name">{item.item_name}{item.variant_name && <small>{item.variant_name}</small>}</span>
                                <span className="price">{money(item.total_price)}</span>
                            </li>
                        ))}
                    </ul>
                    <dl className="totals">
                        {!!Number(order.delivery_fee) && <><dt>Delivery</dt><dd>{money(order.delivery_fee!)}</dd></>}
                        <dt className="grand">Total · cash</dt><dd className="grand">{money(order.total)}</dd>
                    </dl>
                    <p className="muted small">{order.payment_status === 'collected' ? 'Cash collected' : 'Cash to collect'}</p>
                </section>
            </div>

            <section className="panel-block no-print">
                <span className="label">Timeline</span>
                <ol className="timeline">
                    {events.map(e => <li key={e.id}><span>{eventName(e.status)}</span><time>{clock(e.created_at)}</time></li>)}
                </ol>
                <p className="muted small selectable">{order.order_number}</p>
            </section>

            <div className="panel-tools no-print">
                <button className="text-button" onClick={() => window.print()}>Print ticket</button>
                {destructive && onAction && <ConfirmAction label={destructive.label} question={destructive.question} confirmLabel={destructive.confirm} disabled={busy} onConfirm={() => onAction(destructive.action)} />}
            </div>
        </Drawer>
    );
}
