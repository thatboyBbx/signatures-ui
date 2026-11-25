import { API_URL } from './apiConfig';

export type Venue = {
  id: string; code: string; name: string; address: string; city: string;
  delivery_fee?: number;
  is_open: boolean; accepting_orders: boolean;
  /** Optional display details. `hours` is "HH:MM-HH:MM" (may run past midnight) or "24h". */
  phone?: string; hours?: string; mapQuery?: string;
};

// UI-preview branch list. Public details gathered 22 Nov 2026 from online listings; confirm with each branch:
// - CBD: address Cnr G.Silundika & 5th Str (confirmed by the team, 22 Nov 2026); listed as open 24 hours.
// - Borrowdale: menus.co.zw "Signatures Restaurant", 72 Ridgeway North, 10:00-21:00 (the source of the preview menu).
// - Hatfield: Facebook / listings, Seke Road, Hatfield; 11:00-05:00 daily.
// - Chitungwiza: no public listing found, so no address, phone or hours are shown.
export const previewVenues: Venue[] = [
  { id: 'preview-cbd', code: 'PREVIEW-CBD', name: 'Paramount Signature · CBD', address: 'Cnr G.Silundika & 5th Str', city: 'Harare', delivery_fee: 2.5, is_open: true, accepting_orders: true,
    phone: '+263 77 443 0419', hours: '24h', mapQuery: 'George Silundika Avenue & Fifth Street, Harare' },
  { id: 'preview-borrowdale', code: 'PREVIEW-BORROWDALE', name: 'Paramount Signature · Borrowdale', address: '72 Ridgeway North, Borrowdale', city: 'Harare', delivery_fee: 2.5, is_open: true, accepting_orders: true,
    hours: '10:00-21:00', mapQuery: '72 Ridgeway North, Borrowdale, Harare' },
  { id: 'preview-hatfield', code: 'PREVIEW-HATFIELD', name: 'Paramount Signature · Hatfield', address: 'Seke Road, Hatfield', city: 'Harare', delivery_fee: 2.5, is_open: true, accepting_orders: true,
    phone: '+263 77 259 1113', hours: '11:00-05:00', mapQuery: '-17.87651,31.06861' },
  { id: 'preview-chitungwiza', code: 'PREVIEW-CHITUNGWIZA', name: 'Paramount Signature · Chitungwiza', address: '', city: 'Chitungwiza', delivery_fee: 2.5, is_open: true, accepting_orders: true },
];

/** Human hours label and whether the branch is open at `now`. */
export function venueHours(hours: string | undefined, now = new Date()): { label: string; open: boolean | null } {
  if (!hours) return { label: '', open: null };
  if (hours === '24h') return { label: 'Open 24 hours', open: true };
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(hours);
  if (!match) return { label: hours, open: null };
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const open = end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  return { label: `${match[1]}:${match[2]} – ${match[3]}:${match[4]} daily`, open };
}

export async function getVenues(signal: AbortSignal): Promise<Venue[]> {
  const response = await fetch(`${API_URL}/branches`, { signal });
  if (!response.ok) throw new Error('Venues unavailable');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('success' in payload) || payload.success !== true || !('data' in payload) || !Array.isArray(payload.data)) throw new Error('Invalid venue response');
  return payload.data.map((item: unknown) => {
    if (!item || typeof item !== 'object' || !('id' in item) || typeof item.id !== 'string' || !('code' in item) || typeof item.code !== 'string' || !('name' in item) || typeof item.name !== 'string' || !('is_open' in item) || typeof item.is_open !== 'boolean' || !('accepting_orders' in item) || typeof item.accepting_orders !== 'boolean') throw new Error('Invalid venue');
    return { delivery_fee: 'delivery_fee' in item ? Number(item.delivery_fee) : 2.5, id: item.id, code: item.code, name: item.name, address: 'address' in item && typeof item.address === 'string' ? item.address : '', city: 'city' in item && typeof item.city === 'string' ? item.city : '', is_open: item.is_open, accepting_orders: item.accepting_orders };
  });
}

/** "Paramount Signature · CBD" → "CBD". The brand is already on screen, so show only the branch. */
export function branchName(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.split('·').map(part => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : name.replace(/^(Paramount\s+)?Signatures?\s+/i, '').trim() || name;
}

/** Location line without repeating the branch name, e.g. "Harare" instead of "CBD · Harare". */
export function branchPlace(venue: { name: string; address?: string | null; city?: string | null } | null | undefined): string {
  if (!venue) return '';
  const short = branchName(venue.name).toLowerCase();
  return [venue.address, venue.city].filter((part): part is string => Boolean(part) && part!.trim().toLowerCase() !== short).join(' · ');
}
