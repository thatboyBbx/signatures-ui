// Sample data for EXPO_PUBLIC_UI_PREVIEW=1 only. Never used against the live API.
import type { Delivery, Earnings, Identity } from './api';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const item = (id: string, quantity: number, item_name: string, variant_name = '') => ({ id, quantity, item_name, variant_name });

export const previewIdentity: Identity = {
  role: 'driver',
  email: 'tendai@paramount.test',
  branch: { id: 'b-cbd', name: 'CBD', address: 'Cnr G. Silundika & 5th Street, Harare', phone: '+263 77 443 0419' },
  driver: { id: 'd-1', full_name: 'Tendai Moyo', phone: '+263 77 123 4567', is_online: true, status: 'available', driver_code: 'CBD-D04' },
};

const job = (id: string, mins: number, address: string, customer: string, total: number, items: ReturnType<typeof item>[], extra: Partial<Delivery> = {}, notes: string | null = null): Delivery => ({
  id, status: 'awaiting_driver', earnings: 2.5, driver_earnings: 2.5, delivery_address: address,
  created_at: minutesAgo(mins), delivered_at: null, accepted_at: null, picked_up_at: null,
  distance_km: null, estimated_minutes: null,
  orders: {
    order_number: `SIG-${id.toUpperCase().padEnd(16, '0').slice(0, 16)}`, customer_name: customer, customer_phone: '+263 78 555 0192',
    total, subtotal: total - 2.5, delivery_fee: 2.5, notes, payment_method: 'cash',
    branches: { name: 'CBD', address: 'Cnr G. Silundika & 5th Street, Harare' }, order_items: items,
  },
  ...extra,
});

export const previewAvailable: Delivery[] = [
  job('7f3a91c2', 2, '14 King George Road, Avondale', 'Rutendo Chikore', 24.5,
    [item('i1', 2, 'Beef ribs', 'Full rack'), item('i2', 1, 'Sadza'), item('i3', 2, 'Coke', '500 ml')],
    { distance_km: 4.2, estimated_minutes: 14 }, 'Blue gate opposite the Spar. Call when outside.'),
  job('b81e04d7', 6, '3 Lomagundi Road, Belgravia', 'Farai Ncube', 41,
    [item('i4', 1, 'Mixed grill platter'), item('i5', 3, 'Chips')], { distance_km: 3.1, estimated_minutes: 11 }),
  job('c02d55aa', 11, '88 Samora Machel Avenue, Eastlea', 'Nyasha Dube', 12.75,
    [item('i6', 1, 'Chicken quarter', 'Peri-peri'), item('i7', 1, 'Mhunga')]),
];

const done = (id: string, mins: number, address: string, total: number, count: number): Delivery => ({
  ...job(id, mins + 30, address, 'Customer', total, Array.from({ length: count }, (_, i) => item(`${id}${i}`, 1, 'Item'))),
  status: 'delivered', delivered_at: minutesAgo(mins), accepted_at: minutesAgo(mins + 28), picked_up_at: minutesAgo(mins + 18),
});

export const previewCompleted: Delivery[] = [
  done('a1c4e902', 48, '21 Fife Avenue, Avenues', 18.5, 2),
  done('e77b2f10', 125, '9 Harare Drive, Mount Pleasant', 33, 4),
  done('f90c1a3b', 210, '5 Josiah Tongogara Ave, Milton Park', 15, 1),
  done('d4b8e6c1', 60 * 26, '40 Enterprise Road, Highlands', 27.25, 3),
];

export function previewEarnings(completed: Delivery[]): Earnings {
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Harare' });
  const today = day(new Date().toISOString());
  const todayJobs = completed.filter(j => j.delivered_at && day(j.delivered_at) === today);
  const sum = (list: Delivery[]) => list.reduce((s, j) => s + Number(j.earnings), 0);
  return { today: sum(todayJobs), todayCount: todayJobs.length, week: sum(completed), weekCount: completed.length, allTime: sum(completed) + 140 };
}
