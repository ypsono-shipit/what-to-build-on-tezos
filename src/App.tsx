import { useState, useEffect, useRef, useCallback } from 'react';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { ABI, CONTRACT_ADDRESS, ETHERLINK_CHAIN, CATEGORIES, CATEGORY_COLORS, type Category } from './abi';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Suggestion {
  id: number;
  author: string;
  name: string;
  text: string;
  category: string;
  timestamp: number;
  votes: number;
}

interface NotePos {
  x: number;
  y: number;
  rotation: number;
  color: string;
}

interface DragState {
  id: number;
  startMx: number;
  startMy: number;
  startPx: number;
  startPy: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const NOTE_COLORS = ['#FFF176', '#B3E5FC', '#C8E6C9', '#F8BBD9', '#FFE0B2'];
const STORAGE_KEY = 'wtbot_positions_v3';

const DEMO_SUGGESTIONS: Suggestion[] = [
  { id: 0, author: '0x1234...5678', name: 'Alice', text: 'A decentralised lending protocol with XTZ as collateral', category: 'defi', timestamp: Date.now() / 1000 - 86400 * 3, votes: 14 },
  { id: 1, author: '0xabcd...ef01', name: 'Bob', text: 'NFT marketplace for digital art with royalty splits on Etherlink', category: 'nft', timestamp: Date.now() / 1000 - 86400 * 2, votes: 9 },
  { id: 2, author: '0xdead...beef', name: '', text: 'On-chain governance dashboard for Tezos bakers', category: 'infra', timestamp: Date.now() / 1000 - 86400, votes: 22 },
  { id: 3, author: '0xcafe...babe', name: 'Carol', text: 'Cross-chain bridge UI between Tezos L1 and Etherlink with one click', category: 'wallet', timestamp: Date.now() / 1000 - 3600, votes: 7 },
  { id: 4, author: '0x9876...4321', name: 'Dave', text: 'DEX aggregator pulling from all Etherlink liquidity sources', category: 'defi', timestamp: Date.now() / 1000 - 1800, votes: 18 },
  { id: 5, author: '0x5555...aaaa', name: '', text: 'Real-world asset tokenisation platform on Tezos', category: 'consumer', timestamp: Date.now() / 1000 - 900, votes: 31 },
  { id: 6, author: '0x7777...cccc', name: 'Eve', text: 'Web3 game with on-chain leaderboard and XTZ rewards', category: 'gaming', timestamp: Date.now() / 1000 - 600, votes: 11 },
  { id: 7, author: '0x8888...dddd', name: 'Frank', text: 'Generative art collection with programmable traits on Etherlink', category: 'art', timestamp: Date.now() / 1000 - 300, votes: 5 },
];

function loadPositions(): Record<number, NotePos> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

function savePositions(p: Record<number, NotePos>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function defaultPos(id: number): NotePos {
  const cols = Math.max(3, Math.floor((window.innerWidth - 120) / 210));
  const col = id % cols;
  const row = Math.floor(id / cols);
  return {
    x: 60 + col * 210 + Math.random() * 20 - 10,
    y: 40 + row * 220 + Math.random() * 20 - 10,
    rotation: (Math.random() - 0.5) * 8,
    color: NOTE_COLORS[id % NOTE_COLORS.length],
  };
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function timeAgo(ts: number) {
  const secs = Math.floor(Date.now() / 1000 - ts);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Category badge ─────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const cat = category as Category;
  const colors = CATEGORY_COLORS[cat] ?? { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: '1px 7px',
      fontSize: 10,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [positions, setPositions] = useState<Record<number, NotePos>>({});
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<Category | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState<Category>('defi');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const isDemo = !CONTRACT_ADDRESS;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Load suggestions ─────────────────────────────────────────────────────────
  const loadSuggestions = useCallback(async () => {
    if (isDemo) { setSuggestions(DEMO_SUGGESTIONS); return; }
    try {
      setLoading(true);
      const client = createPublicClient({ chain: ETHERLINK_CHAIN, transport: http() });
      const raw = await client.readContract({ address: CONTRACT_ADDRESS!, abi: ABI, functionName: 'getSuggestions' });
      const list = (raw as unknown as Suggestion[]).map((s) => ({
        id: Number(s.id),
        author: s.author,
        name: s.name,
        text: s.text,
        category: s.category,
        timestamp: Number(s.timestamp),
        votes: Number(s.votes),
      }));
      setSuggestions(list);
      if (account) {
        const checks = await Promise.all(
          list.map((s) => client.readContract({ address: CONTRACT_ADDRESS!, abi: ABI, functionName: 'voted', args: [BigInt(s.id), account] }))
        );
        setVotedIds(new Set(list.filter((_, i) => checks[i]).map((s) => s.id)));
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, [account, isDemo, showToast]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  // ── Sync positions ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!suggestions.length) return;
    const stored = loadPositions();
    const merged: Record<number, NotePos> = {};
    suggestions.forEach((s) => { merged[s.id] = stored[s.id] ?? defaultPos(s.id); });
    setPositions(merged);
  }, [suggestions]);

  // ── Connect wallet ────────────────────────────────────────────────────────────
  async function connect() {
    if (!window.ethereum) { showToast('Please install MetaMask'); return; }
    try {
      const walletClient = createWalletClient({ transport: custom(window.ethereum) });
      const [addr] = await walletClient.requestAddresses();
      setAccount(addr);
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa729' }] });
      } catch {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: '0xa729', chainName: 'Etherlink', nativeCurrency: { name: 'Tez', symbol: 'XTZ', decimals: 18 }, rpcUrls: ['https://node.mainnet.etherlink.com'], blockExplorerUrls: ['https://explorer.etherlink.com'] }],
        });
      }
      showToast('Wallet connected');
    } catch (e) { console.error(e); }
  }

  // ── Add suggestion ────────────────────────────────────────────────────────────
  async function submitSuggestion() {
    if (!draftText.trim()) return;
    if (isDemo) {
      const newNote: Suggestion = { id: suggestions.length, author: '0xdemo...0000', name: draftName.trim(), text: draftText.trim(), category: draftCategory, timestamp: Date.now() / 1000, votes: 0 };
      setSuggestions((prev) => [...prev, newNote]);
      setDraftText(''); setDraftName(''); setShowModal(false);
      showToast('Note pinned! (demo mode)');
      return;
    }
    if (!account) { showToast('Connect your wallet first'); return; }
    try {
      setSubmitting(true);
      const walletClient = createWalletClient({ chain: ETHERLINK_CHAIN, transport: custom(window.ethereum) });
      const hash = await walletClient.writeContract({ address: CONTRACT_ADDRESS!, abi: ABI, functionName: 'addSuggestion', args: [draftText.trim(), draftName.trim(), draftCategory], account });
      showToast(`Tx submitted: ${hash.slice(0, 10)}…`);
      setDraftText(''); setDraftName(''); setShowModal(false);
      setTimeout(loadSuggestions, 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed';
      showToast(msg.length > 60 ? msg.slice(0, 60) + '…' : msg);
    } finally { setSubmitting(false); }
  }

  // ── Upvote ────────────────────────────────────────────────────────────────────
  async function upvote(id: number) {
    if (isDemo) {
      setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, votes: s.votes + 1 } : s));
      setVotedIds((prev) => new Set([...prev, id]));
      return;
    }
    if (!account) { showToast('Connect your wallet first'); return; }
    if (votedIds.has(id)) { showToast('Already voted'); return; }
    try {
      const walletClient = createWalletClient({ chain: ETHERLINK_CHAIN, transport: custom(window.ethereum) });
      const hash = await walletClient.writeContract({ address: CONTRACT_ADDRESS!, abi: ABI, functionName: 'upvote', args: [BigInt(id)], account });
      setVotedIds((prev) => new Set([...prev, id]));
      showToast(`Upvoted! Tx: ${hash.slice(0, 10)}…`);
      setTimeout(loadSuggestions, 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upvote failed';
      showToast(msg.length > 60 ? msg.slice(0, 60) + '…' : msg);
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent, id: number) {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { id, startMx: e.clientX, startMy: e.clientY, startPx: positions[id]?.x ?? 0, startPy: positions[id]?.y ?? 0 };
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const { id, startMx, startMy, startPx, startPy } = dragRef.current;
      setPositions((prev) => ({ ...prev, [id]: { ...prev[id], x: startPx + e.clientX - startMx, y: startPy + e.clientY - startMy } }));
    }
    function onMouseUp() {
      if (dragRef.current) { setPositions((prev) => { savePositions(prev); return prev; }); dragRef.current = null; }
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  const visible = activeFilter === 'all' ? suggestions : suggestions.filter((s) => s.category === activeFilter);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 4 }}>
            <img src="/tezos-logo.png" alt="Tezos" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="header-title">What to Build on Tezos</div>
            <div className="header-subtitle">On-chain idea board · Etherlink · {isDemo ? 'demo mode' : 'live'}</div>
          </div>
        </div>
        <div className="header-actions">
          <span className="note-count">{suggestions.length} idea{suggestions.length !== 1 ? 's' : ''}</span>
          {account ? (
            <span className="wallet-pill">{shortAddr(account)}</span>
          ) : (
            <button className="btn btn-secondary" onClick={connect}>Connect Wallet</button>
          )}
          <button className="btn btn-primary" onClick={() => { if (!account && !isDemo) { showToast('Connect wallet to post an idea'); return; } setShowModal(true); }}>
            + Pin Idea
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="filter-bar">
        <button className={`filter-btn${activeFilter === 'all' ? ' active' : ''}`} onClick={() => setActiveFilter('all')}>
          All <span className="filter-count">{suggestions.length}</span>
        </button>
        {CATEGORIES.map((cat) => {
          const count = suggestions.filter((s) => s.category === cat).length;
          const colors = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              className={`filter-btn${activeFilter === cat ? ' active' : ''}`}
              style={activeFilter === cat ? { background: colors.bg, color: colors.text, borderColor: colors.border } : {}}
              onClick={() => setActiveFilter(activeFilter === cat ? 'all' : cat)}
            >
              {cat} {count > 0 && <span className="filter-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Cork board */}
      <div className="cork-board">
        {loading && <div className="empty-hint"><p>Loading ideas from chain…</p></div>}
        {!loading && visible.length === 0 && (
          <div className="empty-hint">
            <p>{activeFilter === 'all' ? 'No ideas yet.\nBe the first to pin one!' : `No ${activeFilter} ideas yet.`}</p>
          </div>
        )}

        {visible.map((s) => {
          const pos = positions[s.id];
          if (!pos) return null;
          return (
            <div
              key={s.id}
              className={`postit${dragRef.current?.id === s.id ? ' dragging' : ''}`}
              style={{ left: pos.x, top: pos.y, transform: `rotate(${pos.rotation}deg)`, backgroundColor: pos.color }}
              onMouseDown={(e) => onMouseDown(e, s.id)}
            >
              <div className="postit-pin" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <CategoryBadge category={s.category} />
                {s.name && <span style={{ fontFamily: 'Caveat, cursive', fontSize: 13, color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>{s.name}</span>}
              </div>
              <p className="postit-text">{s.text}</p>
              <div className="postit-meta">
                <span>{shortAddr(s.author)} · {timeAgo(s.timestamp)}</span>
                <button className={`postit-vote-btn${votedIds.has(s.id) ? ' voted' : ''}`} onClick={() => upvote(s.id)}>
                  ▲ {s.votes}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add note modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2>Pin a new idea</h2>

            {/* Name */}
            <label className="modal-label">Your name <span style={{ color: 'rgba(255,255,255,0.35)' }}>(optional)</span></label>
            <input
              className="modal-input"
              placeholder="e.g. Alice"
              maxLength={50}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />

            {/* Category */}
            <label className="modal-label" style={{ marginTop: 14 }}>Category</label>
            <div className="category-grid">
              {CATEGORIES.map((cat) => {
                const colors = CATEGORY_COLORS[cat];
                const selected = draftCategory === cat;
                return (
                  <button
                    key={cat}
                    className={`category-chip${selected ? ' selected' : ''}`}
                    style={selected ? { background: colors.bg, color: colors.text, borderColor: colors.border } : {}}
                    onClick={() => setDraftCategory(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Idea text */}
            <label className="modal-label" style={{ marginTop: 14 }}>Your idea</label>
            <textarea
              autoFocus
              placeholder="What should someone build on Tezos or Etherlink…?"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value.slice(0, 280))}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitSuggestion(); }}
            />
            <div className="char-count">{draftText.length}/280</div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitSuggestion} disabled={submitting || !draftText.trim()}>
                {submitting ? 'Submitting…' : 'Pin it →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}
