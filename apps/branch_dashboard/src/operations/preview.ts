// UI preview mode (VITE_UI_PREVIEW=1): an in-memory branch that follows the same
// status rules as backend/migrations/002_atomic_workflows.sql. No network calls.
import type { Branch, Delivery, Driver, MenuItem, Order, OrderDelivery } from './api';

const min = 60000;
const ago = (minutes: number) => new Date(Date.now() - minutes * min).toISOString();
let seq = 0;
const uid = () => `p${(++seq).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const orderNo = () => `SIG-${Math.random().toString(16).slice(2, 10).toUpperCase()}${Math.random().toString(16).slice(2, 10).toUpperCase()}`.slice(0, 20);

const branch: Branch = { id: 'b-cbd', code: 'CBD', name: 'Paramount Signature · CBD', address: 'Cnr G. Silundika & 5th Street, Harare', phone: '+263 77 443 0419', accepting_orders: true, is_open: true };

const drivers: Driver[] = [
    { id: 'd1', driver_code: 'D-014', full_name: 'Tendai Mhlanga', phone: '+263 77 210 4471', is_online: true, status: 'busy' },
    { id: 'd2', driver_code: 'D-022', full_name: 'Simba Gumbo', phone: '+263 78 330 1902', is_online: true, status: 'busy' },
    { id: 'd3', driver_code: 'D-031', full_name: 'Tafadzwa Ndlovu', phone: '+263 71 554 2210', is_online: true, status: 'available' },
    { id: 'd4', driver_code: 'D-027', full_name: 'Kuda Mavhunga', phone: '+263 77 908 3321', is_online: true, status: 'busy' },
    { id: 'd5', driver_code: 'D-008', full_name: 'Brian Chiweshe', phone: '+263 78 112 6654', is_online: false, status: 'available' },
];

const item = (name: string, department: 'Food' | 'Drinks', category: string, price: number, variants: [string, number][] = [], available = true, description = ''): MenuItem =>
    ({ id: uid(), name, department, category, description, image_url: '', price, available, menu_variants: variants.map(([label, p]) => ({ id: uid(), label, price: p })) });

const menu: MenuItem[] = [
    item('T-bone steak', 'Food', 'Grill', 18, [['350 g', 18], ['500 g', 24]], true, 'Flame-grilled, served with chips or sadza.'),
    item('Beef short ribs', 'Food', 'Grill', 16),
    item('Peri-peri chicken', 'Food', 'Grill', 12, [['Half', 12], ['Whole', 21]]),
    item('Lamb chops', 'Food', 'Grill', 19, [], false),
    item('Boerewors roll', 'Food', 'Grill', 7),
    item('Oxtail with sadza', 'Food', 'Traditional', 14),
    item('Road-runner chicken & sadza', 'Food', 'Traditional', 13),
    item('Mhunga with beef stew', 'Food', 'Traditional', 12, [], false),
    item('Chips', 'Food', 'Sides', 3, [['Regular', 3], ['Large', 4.5]]),
    item('Garden salad', 'Food', 'Sides', 5),
    item('Zambezi lager', 'Drinks', 'Beer', 3),
    item('Castle Lite', 'Drinks', 'Beer', 3),
    item('Savanna dry', 'Drinks', 'Cider', 4),
    item('Coca-Cola 500 ml', 'Drinks', 'Soft drinks', 1.5),
    item('Mazoe orange', 'Drinks', 'Soft drinks', 2),
    item('House red', 'Drinks', 'Wine', 5, [['Glass', 5], ['Bottle', 22]]),
];

type Line = [string, number, string?];
const priceOf = (name: string, variant?: string) => {
    const m = menu.find(i => i.name === name)!;
    return variant ? m.menu_variants.find(v => v.label === variant)!.price : m.price;
};

function makeOrder(o: { customer: string; type: 'delivery' | 'pickup'; address?: string; lines: Line[]; events: [string, number][]; notes?: string; driver?: string; deliveryStatus?: string }): Order {
    const id = uid();
    const items = o.lines.map(([name, quantity, variant]) => {
        const unit = priceOf(name, variant);
        return { id: uid(), item_name: name, variant_name: variant ?? '', quantity, total_price: unit * quantity };
    });
    const subtotal = items.reduce((s, i) => s + i.total_price, 0);
    const fee = o.type === 'delivery' ? 2.5 : 0;
    const events = o.events.map(([status, minutes]) => ({ id: uid(), status, created_at: ago(minutes) }));
    const status = [...o.events].filter(([s]) => !['arrived_at_restaurant', 'picked_up'].includes(s)).at(-1)![0];
    const order: Order = {
        id, order_number: orderNo(), customer_name: o.customer, customer_phone: `+263 7${Math.floor(1 + Math.random() * 8)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}`,
        status, order_type: o.type, subtotal, delivery_fee: fee, total: subtotal + fee,
        payment_status: ['delivered', 'completed'].includes(status) ? 'collected' : 'pending', notes: o.notes ?? '',
        delivery_address: o.type === 'delivery' ? o.address ?? '' : '', created_at: events[0].created_at, order_items: items, order_events: events,
    };
    if (o.deliveryStatus) {
        const driver = drivers.find(d => d.full_name === o.driver);
        order.deliveries = { id: uid(), status: o.deliveryStatus, driver_id: driver?.id ?? null, created_at: since(order, 'awaiting_driver'), accepted_at: driver ? since(order, 'driver_assigned') : null, drivers: driver ? { id: driver.id, full_name: driver.full_name, driver_code: driver.driver_code } : null };
    }
    return order;
}
const since = (order: Order, status: string) => order.order_events.find(e => e.status === status)?.created_at ?? order.created_at;

const orders: Order[] = [
    makeOrder({ customer: 'Kudzai Ncube', type: 'delivery', address: '14 King George Road, Avondale', lines: [['Peri-peri chicken', 1, 'Whole'], ['Chips', 2, 'Large'], ['Coca-Cola 500 ml', 2]], events: [['confirmed', 0.4]] }),
    makeOrder({ customer: 'Farai Chikwanha', type: 'pickup', lines: [['Boerewors roll', 2], ['Mazoe orange', 1]], events: [['confirmed', 3.6]], notes: 'Coming in 20 minutes.' }),
    makeOrder({ customer: 'Rudo Sibanda', type: 'delivery', address: '3 Lomagundi Road, Belgravia', lines: [['Oxtail with sadza', 2], ['Garden salad', 1], ['Zambezi lager', 1]], events: [['confirmed', 11], ['preparing', 8]] }),
    makeOrder({ customer: 'Blessing Dube', type: 'pickup', lines: [['T-bone steak', 1, '500 g'], ['Chips', 1, 'Regular']], events: [['confirmed', 20], ['preparing', 17]] }),
    makeOrder({ customer: 'Nyasha Banda', type: 'delivery', address: '88 Samora Machel Avenue, Eastlea', lines: [['Beef short ribs', 2], ['Peri-peri chicken', 1, 'Half'], ['Garden salad', 1], ['Castle Lite', 2]], events: [['confirmed', 31], ['preparing', 27]], notes: 'No onions on the salad. Extra peri-peri sauce please.' }),
    makeOrder({ customer: 'Tatenda Phiri', type: 'pickup', lines: [['Road-runner chicken & sadza', 1], ['Coca-Cola 500 ml', 1]], events: [['confirmed', 26], ['preparing', 22], ['ready', 6]] }),
    makeOrder({ customer: 'Chipo Mutasa', type: 'delivery', address: '21 Fife Avenue, Avenues', lines: [['T-bone steak', 1, '350 g'], ['Savanna dry', 2]], events: [['confirmed', 30], ['preparing', 27], ['ready', 7], ['awaiting_driver', 6.5]], deliveryStatus: 'awaiting_driver' }),
    makeOrder({ customer: 'Tariro Moyo', type: 'delivery', address: '5 Josiah Tongogara Avenue, Milton Park', lines: [['Boerewors roll', 3], ['Chips', 3, 'Regular']], events: [['confirmed', 24], ['preparing', 21], ['ready', 5], ['awaiting_driver', 5], ['driver_assigned', 3]], driver: 'Tendai Mhlanga', deliveryStatus: 'heading_to_restaurant' }),
    makeOrder({ customer: 'Munashe Zhou', type: 'delivery', address: '17 Harare Drive, Mount Pleasant', lines: [['Lamb chops', 1], ['House red', 1, 'Bottle']], events: [['confirmed', 35], ['preparing', 32], ['ready', 12], ['awaiting_driver', 12], ['driver_assigned', 10], ['arrived_at_restaurant', 4]], driver: 'Simba Gumbo', deliveryStatus: 'arrived_at_restaurant' }),
    makeOrder({ customer: 'Ruvimbo Chari', type: 'delivery', address: '9 Enterprise Road, Highlands', lines: [['Oxtail with sadza', 1]], events: [['confirmed', 40], ['preparing', 37], ['ready', 20], ['awaiting_driver', 20], ['driver_assigned', 18], ['arrived_at_restaurant', 14], ['picked_up', 12], ['on_the_way', 11]], driver: 'Kuda Mavhunga', deliveryStatus: 'on_the_way' }),
];

const history: Order[] = [
    ['Tinashe Gora', 'delivery', 'delivered', 70], ['Vimbai Shumba', 'pickup', 'completed', 95], ['Panashe Dziva', 'delivery', 'delivered', 130],
    ['Kelvin Marufu', 'pickup', 'cancelled', 160], ['Shamiso Hove', 'delivery', 'delivered', 210], ['Gift Nyoni', 'delivery', 'rejected', 250],
    ['Anesu Mpofu', 'pickup', 'completed', 300], ['Ropafadzo Kufa', 'delivery', 'delivered', 1500], ['Taurai Chuma', 'pickup', 'completed', 1560],
].map(([customer, type, status, minutes]) => {
    const m = minutes as number;
    const steps: [string, number][] = status === 'rejected' ? [['confirmed', m], ['rejected', m - 2]]
        : status === 'cancelled' ? [['confirmed', m], ['preparing', m - 2], ['cancelled', m - 9]]
            : type === 'pickup' ? [['confirmed', m], ['preparing', m - 2], ['ready', m - 20], ['completed', m - 26]]
                : [['confirmed', m], ['preparing', m - 3], ['ready', m - 22], ['awaiting_driver', m - 22], ['driver_assigned', m - 21], ['arrived_at_restaurant', m - 17], ['picked_up', m - 16], ['on_the_way', m - 16], ['delivered', m - 2]];
    return makeOrder({ customer: customer as string, type: type as 'delivery' | 'pickup', address: '42 Second Street, Harare', lines: [['Peri-peri chicken', 1, 'Half'], ['Chips', 1, 'Regular']], events: steps, driver: status === 'delivered' ? 'Tafadzwa Ndlovu' : undefined, deliveryStatus: status === 'delivered' ? 'delivered' : undefined });
});

/* Arrivals and driver progress, so the board moves on its own in preview. */
const arrivals: Parameters<typeof makeOrder>[0][] = [
    { customer: 'Tsitsi Mangena', type: 'delivery', address: '30 Churchill Avenue, Alexandra Park', lines: [['T-bone steak', 2, '350 g'], ['Chips', 2, 'Regular']], events: [] },
    { customer: 'Lloyd Sithole', type: 'pickup', lines: [['Beef short ribs', 1], ['Castle Lite', 2]], events: [] },
];
let lastArrival = Date.now();
function tick() {
    const now = Date.now();
    if (arrivals.length && now - lastArrival > 75000 && branch.accepting_orders) {
        lastArrival = now;
        const next = arrivals.shift()!;
        orders.unshift(makeOrder({ ...next, events: [['confirmed', 0]] }));
    }
    for (const order of orders) {
        const d = order.deliveries as OrderDelivery | undefined;
        if (!d) continue;
        const waited = (now - new Date(since(order, d.status === 'awaiting_driver' ? 'awaiting_driver' : 'driver_assigned')).getTime()) / min;
        if (d.status === 'awaiting_driver' && waited > 1.5 && new Date(since(order, 'awaiting_driver')).getTime() > now - 3 * min) {
            const free = drivers.find(x => x.is_online && x.status === 'available');
            if (free) {
                free.status = 'busy';
                Object.assign(d, { status: 'heading_to_restaurant', driver_id: free.id, accepted_at: new Date().toISOString(), drivers: { id: free.id, full_name: free.full_name, driver_code: free.driver_code } });
                order.status = 'driver_assigned';
                order.order_events.push({ id: uid(), status: 'driver_assigned', created_at: new Date().toISOString() });
            }
        }
    }
}

const terminal = ['delivered', 'completed', 'cancelled', 'rejected'];
const wait = () => new Promise(r => setTimeout(r, 120));
const fail = (message: string) => { throw new Error(message); };

export async function previewApi<T>(path: string, body: unknown, method: string): Promise<{ data: T; count?: number }> {
    await wait();
    tick();
    const [route, query = ''] = path.split('?');
    const q = new URLSearchParams(query);
    const input = (body ?? {}) as Record<string, unknown>;
    const out = (data: unknown, count?: number) => ({ data: structuredClone(data) as T, count });

    if (route === '/me') return out({ role: 'staff', branch, email: 'staff@cbd.paramount.test' });
    if (route === '/overview') {
        const counts: Record<string, number> = {};
        orders.filter(o => !terminal.includes(o.status)).forEach(o => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
        return out(counts);
    }
    if (route === '/orders' && method === 'GET') {
        const page = Number(q.get('page') ?? 0);
        let list = q.get('history') === '1' ? [...orders.filter(o => terminal.includes(o.status)), ...history] : orders.filter(o => !terminal.includes(o.status));
        if (q.get('status')) list = list.filter(o => o.status === q.get('status'));
        if (q.get('search')) list = list.filter(o => o.order_number.toLowerCase().includes(q.get('search')!.toLowerCase()));
        if (q.get('from')) list = list.filter(o => new Date(o.created_at) >= new Date(`${q.get('from')}T00:00:00+02:00`));
        if (q.get('to')) list = list.filter(o => new Date(o.created_at) <= new Date(`${q.get('to')}T23:59:59+02:00`));
        list.sort((a, b) => b.created_at.localeCompare(a.created_at));
        return out(list.slice(page * 25, page * 25 + 25), list.length);
    }
    const action = route.match(/^\/orders\/([^/]+)\/(status|dispatch)$/);
    if (action) {
        const order = orders.find(o => o.order_number === decodeURIComponent(action[1])) ?? fail('Order not available');
        const stamp = (status: string) => order.order_events.push({ id: uid(), status, created_at: new Date().toISOString() });
        if (action[2] === 'dispatch') {
            if (order.deliveries) return out(order.deliveries);
            if (order.status !== 'ready' || order.order_type !== 'delivery') fail('Only ready delivery orders can be dispatched');
            order.deliveries = { id: uid(), status: 'awaiting_driver', driver_id: null, created_at: new Date().toISOString(), accepted_at: null, drivers: null };
            order.status = 'awaiting_driver';
            stamp('awaiting_driver');
            return out(order.deliveries);
        }
        const next = String(input.status);
        if (order.status === next) return out(order);
        const allowed = (order.status === 'confirmed' && ['preparing', 'rejected'].includes(next)) || (order.status === 'preparing' && ['ready', 'cancelled'].includes(next)) || (order.status === 'ready' && order.order_type === 'pickup' && next === 'completed');
        if (!allowed) fail('Order changed or this transition is not allowed');
        if (next === 'completed' && input.cashCollected !== true) fail('Confirm cash collection before completing pickup');
        order.status = next;
        if (next === 'completed') order.payment_status = 'collected';
        stamp(next);
        return out(order);
    }
    if (route === '/menu' && method === 'GET') return out([...menu].sort((a, b) => a.name.localeCompare(b.name)));
    if (route === '/menu' && method === 'POST') {
        const variants = ((input.variants ?? []) as { id?: string; label: string; price: number }[]).map(v => ({ id: v.id || uid(), label: v.label, price: Number(v.price) }));
        const saved = { ...(input as unknown as MenuItem), menu_variants: variants };
        delete (saved as Record<string, unknown>).variants;
        const index = menu.findIndex(m => m.id === saved.id);
        if (index >= 0) menu[index] = saved;
        else menu.push({ ...saved, id: uid() });
        return out(saved);
    }
    if (route === '/drivers') {
        const deliveries = orders.filter(o => o.deliveries && !terminal.includes(o.status)).map(o => {
            const d = o.deliveries as OrderDelivery;
            return { id: d.id, status: d.status, driver_id: d.driver_id, created_at: d.created_at, accepted_at: d.accepted_at, picked_up_at: d.picked_up_at, orders: o } satisfies Delivery;
        });
        return out({ drivers, deliveries });
    }
    if (route === '/branch' && method === 'PATCH') {
        Object.assign(branch, { phone: input.phone, address: input.address, accepting_orders: input.accepting_orders === true });
        return out(branch);
    }
    return fail('Not available in preview.');
}
