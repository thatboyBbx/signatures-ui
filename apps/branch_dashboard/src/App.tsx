import { useCallback, useEffect, useState } from 'react';
import { api, clearSession, setExpiredHandler, signOut } from './operations/api';
import type { Branch, Identity } from './operations/api';
import { ServiceBoard } from './ui/Board';
import { Switch } from './ui/controls';
import { branchLabel, chime, clock, readStore, soundReady, unlockSound, writeStore } from './ui/lib';
import { BranchView, DriversView, HistoryView, MenuView, SignIn } from './ui/Views';
import './App.css';

type View = 'Service' | 'Menu' | 'Drivers' | 'History' | 'Branch';
const views: View[] = ['Service', 'Menu', 'Drivers', 'History', 'Branch'];

export default function App() {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [message, setMessage] = useState('');
    useEffect(() => setExpiredHandler(() => { setIdentity(null); setMessage('Your session expired. Sign in again.'); }), []);
    if (!identity) return <SignIn notice={message} onSignedIn={id => { setMessage(''); setIdentity(id); }} />;
    return <Workspace identity={identity} setBranch={branch => setIdentity({ ...identity, branch })} onSignOut={() => { void signOut(); clearSession(); setIdentity(null); }} />;
}

function Workspace({ identity, setBranch, onSignOut }: { identity: Identity; setBranch: (b: Branch) => void; onSignOut: () => void }) {
    const [view, setView] = useState<View>('Service');
    const [soundOn, setSoundOn] = useState(() => readStore('branch.sound', true));
    const [audioOk, setAudioOk] = useState(soundReady());
    const [sync, setSync] = useState({ error: '', updated: 0 });
    const [pauseBusy, setPauseBusy] = useState(false);
    const [pauseError, setPauseError] = useState('');
    const branch = identity.branch;

    // Browsers only allow sound after a tap. Any tap on the page unlocks it.
    useEffect(() => {
        const unlock = () => { unlockSound(); setTimeout(() => setAudioOk(soundReady()), 100); };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
        return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    }, []);

    const onSync = useCallback((state: { error: string; updated: number }) => setSync(state), []);

    function toggleSound() {
        const next = !soundOn;
        setSoundOn(next);
        writeStore('branch.sound', next);
        if (next) { unlockSound(); setTimeout(() => { chime(); setAudioOk(soundReady()); }, 80); }
    }

    async function setAccepting(accepting_orders: boolean) {
        setPauseBusy(true);
        setPauseError('');
        try {
            const { data } = await api<Branch>('/branch', { phone: branch.phone, address: branch.address, accepting_orders }, 'PATCH');
            setBranch(data);
        }
        catch (e) { setPauseError((e as Error).message); }
        finally { setPauseBusy(false); }
    }

    const offline = !!sync.error && sync.updated > 0;
    const paused = !branch.accepting_orders;

    return (
        <div className={`app ${paused ? 'is-paused' : ''}`}>
            <header className="topbar">
                <p className="topbar-branch">{branchLabel(branch.name)}</p>
                <nav className="topbar-nav" aria-label="Sections">
                    {views.map(v => <button key={v} className={view === v ? 'active' : ''} aria-current={view === v ? 'page' : undefined} onClick={() => setView(v)}>{v}</button>)}
                </nav>
                <div className="topbar-status">
                    <span className={`sync ${offline ? 'sync-off' : ''}`} role="status">{offline ? 'Offline' : sync.updated ? 'Live' : 'Connecting'}</span>
                    <button className="topbar-button" aria-pressed={soundOn} onClick={toggleSound}>{!soundOn ? 'Sound off' : audioOk ? 'Sound on' : 'Tap for sound'}</button>
                    <span className="taking">
                        <span>{paused ? 'Paused' : 'Taking orders'}</span>
                        <Switch tone="dark" checked={!paused} disabled={pauseBusy} label="Taking new orders" onChange={next => void setAccepting(next)} />
                    </span>
                </div>
            </header>

            {paused && (
                <div className="banner banner-paused" role="status">
                    <span>New orders are paused. Orders already in progress carry on.</span>
                    <button disabled={pauseBusy} onClick={() => void setAccepting(true)}>Resume</button>
                </div>
            )}
            {pauseError && <div className="banner banner-error" role="alert"><span>{pauseError}</span><button onClick={() => setPauseError('')}>Dismiss</button></div>}
            {offline && <div className="banner banner-error" role="alert"><span>Connection lost. Showing the board from {clock(new Date(sync.updated).toISOString())}. Trying again…</span></div>}

            <main className="workspace">
                <div hidden={view !== 'Service'} className="service"><ServiceBoard soundOn={soundOn} onSync={onSync} /></div>
                {view === 'Menu' && <MenuView />}
                {view === 'Drivers' && <DriversView />}
                {view === 'History' && <HistoryView />}
                {view === 'Branch' && <BranchView branch={branch} email={identity.email} onSaved={setBranch} onSignOut={onSignOut} />}
            </main>
        </div>
    );
}
