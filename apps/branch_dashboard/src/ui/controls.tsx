import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/** Press and hold to confirm. Used where a slip would cost money (cash handover). */
export function HoldButton({ label, onConfirm, disabled = false, ms = 900, className = '' }: { label: string; onConfirm: () => void; disabled?: boolean; ms?: number; className?: string }) {
    const [holding, setHolding] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; setHolding(false); };
    const start = () => {
        if (disabled || timer.current) return;
        setHolding(true);
        timer.current = setTimeout(() => { timer.current = null; setHolding(false); onConfirm(); }, ms);
    };
    useEffect(() => stop, []);
    return (
        <button type="button" className={`hold ${holding ? 'holding' : ''} ${className}`} disabled={disabled} style={{ '--hold-ms': `${ms}ms` } as CSSProperties}
            onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={e => e.preventDefault()}
            onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
            onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') stop(); }}>
            <span className="hold-fill" aria-hidden="true" />
            <span className="hold-label">{holding ? 'Keep holding…' : label}</span>
        </button>
    );
}

export function Switch({ checked, onChange, label, disabled = false, tone = 'light' }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean; tone?: 'light' | 'dark' }) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`switch switch-${tone} ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
            <span className="switch-track" aria-hidden="true"><span className="switch-knob" /></span>
        </button>
    );
}

/** Right-hand panel over the board. Esc closes; focus moves in and back. */
export function Drawer({ title, onClose, children, footer, wide = false }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        ref.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
    }, [onClose]);
    return (
        <div className="drawer-layer">
            <button className="drawer-scrim" aria-label="Close panel" onClick={onClose} tabIndex={-1} />
            <aside ref={ref} className={`drawer ${wide ? 'drawer-wide' : ''}`} role="dialog" aria-modal="true" tabIndex={-1}>
                <header className="drawer-head">
                    <div className="drawer-title">{title}</div>
                    <button className="text-button" onClick={onClose}>Close</button>
                </header>
                <div className="drawer-body">{children}</div>
                {footer && <footer className="drawer-foot">{footer}</footer>}
            </aside>
        </div>
    );
}

/** Two-step destructive action: the confirm sits apart from the primary button. */
export function ConfirmAction({ label, question, confirmLabel, onConfirm, disabled }: { label: string; question: string; confirmLabel: string; onConfirm: () => void; disabled?: boolean }) {
    const [asking, setAsking] = useState(false);
    if (!asking) return <button className="text-button danger-text" disabled={disabled} onClick={() => setAsking(true)}>{label}</button>;
    return (
        <div className="confirm" role="group" aria-label={question}>
            <p>{question}</p>
            <div className="confirm-actions">
                <button onClick={() => setAsking(false)}>Back</button>
                <button className="danger" disabled={disabled} onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
            </div>
        </div>
    );
}

export function LoadState({ loading, error, empty, emptyText, retry }: { loading: boolean; error: string; empty: boolean; emptyText: string; retry: () => void }) {
    if (loading) return <p className="quiet-state" role="status">Loading…</p>;
    if (error && empty) return <div className="quiet-state" role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>;
    if (empty) return <p className="quiet-state">{emptyText}</p>;
    return null;
}
