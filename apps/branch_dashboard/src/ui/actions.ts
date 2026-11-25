import { api } from '../operations/api';
import type { Order } from '../operations/api';
import { shortCode } from './lib';

export type Action = 'accept' | 'reject' | 'ready' | 'dispatch' | 'cancel' | 'handover';

/** Calls the API for one action. "Ready" on a delivery also requests a driver. */
export async function runAction(order: Order, action: Action): Promise<string | null> {
    const number = encodeURIComponent(order.order_number);
    const status = (next: string, cashCollected = false) => api(`/orders/${number}/status`, { status: next, cashCollected }, 'PATCH');
    if (action === 'accept') await status('preparing');
    if (action === 'reject') await status('rejected');
    if (action === 'cancel') await status('cancelled');
    if (action === 'handover') await status('completed', true);
    if (action === 'dispatch') await api(`/orders/${number}/dispatch`, undefined, 'POST');
    if (action === 'ready') {
        await status('ready');
        if (order.order_type === 'delivery') {
            try { await api(`/orders/${number}/dispatch`, undefined, 'POST'); }
            catch { return `${shortCode(order.order_number)} is ready, but the driver request didn't go through. Tap Request driver.`; }
        }
    }
    return null;
}

