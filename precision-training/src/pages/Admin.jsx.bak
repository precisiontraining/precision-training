import { useState, useEffect, useMemo } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'

const ADMIN_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? ''

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const H = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function PlanTypeBadge({ type }) {
  const isNut = type?.includes('nutrition')
  const color = isNut ? '#6e9dc8' : '#c8a96e'
  const label = isNut ? 'Nutrition' : 'Training'
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 10,
      background: `${color}18`, border: `1px solid ${color}40`,
      fontSize: 10, fontWeight: 700, letterSpacing: 1, color,
    }}>{label}</span>
  )
}

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      border: `1.5px solid ${checked ? '#c8a96e' : 'rgba(255,255,255,0.15)'}`,
      background: checked ? 'rgba(200,169,110,0.2)' : 'transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}>
      {checked && <span style={{ color: '#c8a96e', fontSize: 10, fontWeight: 800 }}>✓</span>}
      {!checked && indeterminate && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 800 }}>–</span>}
    </div>
  )
}

function BroadcastModal({ selectedEmails, onClose }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const unique = [...new Set(selectedEmails.filter(Boolean))]

  async function send() {
    if (!subject.trim() || !message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/broadcast-email`, {
        method: 'POST',
        headers: { ...H },
        body: JSON.stringify({ emails: unique, subject: subject.trim(), message: message.trim() }),
      })
      const data = await res.json()
      setResult(data)
      setStatus(data.error ? 'error' : 'done')
    } catch (e) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 540, background: '#111', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 20, padding: 32, fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 3 }}>📨 Broadcast Email</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{unique.length} recipient{unique.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* Recipients preview */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, maxHeight: 72, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>To</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
            {unique.slice(0, 6).join(', ')}{unique.length > 6 ? ` +${unique.length - 6} more` : ''}
          </div>
        </div>

        {/* From (readonly) */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>From</div>
          <div style={{ ...inp, color: 'rgba(255,255,255,0.35)', cursor: 'default' }}>info@precision-training.io · Precision Training</div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>Subject</div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your plan is ready 🎯" style={inp} />
        </div>

        {/* Message */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 5 }}>Message</div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={7}
            placeholder={'Hi,\n\nI wanted to personally reach out…\n\n— Flo, Precision Training'}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>Plain text email — simple and personal.</div>
        </div>

        {status === 'done' && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(109,184,138,0.1)', border: '1px solid rgba(109,184,138,0.25)', fontSize: 12, color: '#6db88a' }}>
            ✓ Sent to {result?.sent ?? unique.length} recipient{result?.sent !== 1 ? 's' : ''}{result?.failed > 0 ? ` · ${result.failed} failed` : ''}
          </div>
        )}
        {status === 'error' && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(224,96,96,0.1)', border: '1px solid rgba(224,96,96,0.25)', fontSize: 12, color: '#e06060' }}>
            Error: {result?.error ?? 'Something went wrong'}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>Cancel</button>
          <button onClick={send} disabled={status === 'sending' || status === 'done' || !subject.trim() || !message.trim()}
            style={{ flex: 2, padding: '12px 0', borderRadius: 8, border: 'none', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 800, letterSpacing: 1, cursor: 'pointer',
              background: status === 'done' ? 'rgba(109,184,138,0.15)' : 'linear-gradient(135deg,#b8922e,#c8a96e)',
              color: status === 'done' ? '#6db88a' : '#0a0a0a',
              opacity: (!subject.trim() || !message.trim()) ? 0.4 : 1,
            }}>
            {status === 'sending' ? 'Sending…' : status === 'done' ? '✓ Sent' : `Send to ${unique.length} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [copiedEmail, setCopiedEmail] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [showBroadcast, setShowBroadcast] = useState(false)

  async function login() {
    if (!ADMIN_HASH) { setAuthError('Admin hash not configured.'); return }
    const h = await sha256(pw)
    if (h === ADMIN_HASH) { setAuthed(true); setAuthError('') }
    else setAuthError('Wrong password.')
  }

  useEffect(() => { if (authed) loadPlans() }, [authed])

  async function loadPlans() {
    setLoading(true)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/plans?select=slug,plan_type,created_at,email&order=created_at.desc&limit=500`,
        { headers: H }
      )
      const data = await res.json()
      setPlans(Array.isArray(data) ? data : [])
      setSelected(new Set())
    } catch { setPlans([]) }
    setLoading(false)
  }

  // Per-user map: email → { types: Set, lastActivity, totalPlans }
  const userMap = useMemo(() => {
    const map = {}
    plans.forEach(p => {
      const key = p.email?.toLowerCase()
      if (!key) return
      if (!map[key]) map[key] = { email: key, types: new Set(), lastActivity: p.created_at, count: 0 }
      map[key].types.add(p.plan_type?.includes('nutrition') ? 'nutrition' : 'training')
      map[key].count++
      if (p.created_at > map[key].lastActivity) map[key].lastActivity = p.created_at
    })
    return map
  }, [plans])

  const userList = useMemo(() => Object.values(userMap), [userMap])

  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now - 7 * 86400000)
    const monthAgo = new Date(now - 30 * 86400000)
    const trainingOnly = userList.filter(u => u.types.has('training') && !u.types.has('nutrition'))
    const nutritionOnly = userList.filter(u => u.types.has('nutrition') && !u.types.has('training'))
    return {
      totalPlans: plans.length,
      uniqueUsers: userList.length,
      today: plans.filter(p => p.created_at && new Date(p.created_at).toDateString() === now.toDateString()).length,
      thisWeek: plans.filter(p => p.created_at && new Date(p.created_at) > weekAgo).length,
      thisMonth: plans.filter(p => p.created_at && new Date(p.created_at) > monthAgo).length,
      trainingOnly: trainingOnly.length,
      nutritionOnly: nutritionOnly.length,
      bundle: userList.filter(u => u.types.has('training') && u.types.has('nutrition')).length,
      trainingOnlyEmails: trainingOnly.map(u => u.email),
      nutritionOnlyEmails: nutritionOnly.map(u => u.email),
    }
  }, [plans, userList])

  const filtered = useMemo(() => {
    return plans
      .filter(p => {
        const u = userMap[p.email?.toLowerCase()]
        // Segment filters
        if (filter === 'training-only') return u?.types.has('training') && !u?.types.has('nutrition')
        if (filter === 'nutrition-only') return u?.types.has('nutrition') && !u?.types.has('training')
        if (filter === 'bundle') return u?.types.has('training') && u?.types.has('nutrition')
        if (filter === 'training') {
          if (!p.plan_type?.includes('training')) return false
        } else if (filter === 'nutrition') {
          if (!p.plan_type?.includes('nutrition')) return false
        }
        // Search
        if (search) {
          const q = search.toLowerCase()
          return p.email?.toLowerCase().includes(q) || p.slug?.includes(q) || p.plan_type?.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => sort === 'newest'
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
      )
  }, [plans, filter, search, sort, userMap])

  const filteredEmails = filtered.map(p => p.email).filter(Boolean)
  const allSel = filteredEmails.length > 0 && filteredEmails.every(e => selected.has(e))
  const someSel = filteredEmails.some(e => selected.has(e))

  function toggleAll() {
    if (allSel) setSelected(prev => { const n = new Set(prev); filteredEmails.forEach(e => n.delete(e)); return n })
    else setSelected(prev => new Set([...prev, ...filteredEmails]))
  }
  function toggleRow(email) {
    if (!email) return
    setSelected(prev => { const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n })
  }
  function quickSelect(emails) {
    setSelected(new Set(emails))
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }
  function copyEmail(email) {
    navigator.clipboard.writeText(email).then(() => { setCopiedEmail(email); setTimeout(() => setCopiedEmail(null), 2000) })
  }
  function exportCSV() {
    const rows = [['Email', 'Plan Type', 'Created At', 'Slug', 'Has Both Plans']]
    filtered.forEach(p => {
      const u = userMap[p.email?.toLowerCase()]
      rows.push([p.email || '', p.plan_type || '', p.created_at || '', p.slug || '',
        (u?.types.has('training') && u?.types.has('nutrition')) ? 'Yes' : 'No'])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'precision-training-leads.csv'; a.click()
  }

  const gold = '#c8a96e'
  const blue = '#6e9dc8'
  const base = {
    page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Montserrat, Arial, sans-serif', paddingBottom: 80 },
    header: { background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body: { maxWidth: 1240, margin: '0 auto', padding: '32px 24px' },
    label: { fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 10 },
    btn: (c = gold) => ({ padding: '9px 16px', borderRadius: 8, background: `${c}15`, border: `1px solid ${c}28`, color: c, fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }),
    inp: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: 13, outline: 'none' },
    th: { padding: '9px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    td: { padding: '11px 12px', fontSize: 12, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' },
  }

  // ── Login ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: 40, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Admin Access</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Precision Training · Owner only</div>
        <input style={{ ...base.inp, width: '100%', boxSizing: 'border-box', marginBottom: 12 }} type="password" placeholder="Admin password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        {authError && <div style={{ fontSize: 12, color: '#e06060', marginBottom: 12 }}>{authError}</div>}
        <button style={{ width: '100%', padding: 15, borderRadius: 50, background: 'linear-gradient(135deg,#b8922e,#c8a96e)', color: '#0a0a0a', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, border: 'none', cursor: 'pointer' }} onClick={login}>Enter →</button>
      </div>
    </div>
  )

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div style={base.page}>
      {showBroadcast && <BroadcastModal selectedEmails={[...selected]} onClose={() => setShowBroadcast(false)} />}

      {/* Header */}
      <div style={base.header}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          <span style={{ color: gold }}>Precision</span> Training
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: gold }}>ADMIN DASHBOARD</span>
        <button onClick={() => setAuthed(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>LOGOUT</button>
      </div>

      <div style={base.body}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Overview</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>All plan activity · Select users to broadcast emails directly.</p>
        </div>

        {/* ── Stats Row ── */}
        <div style={base.label}>Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { num: stats.totalPlans,   label: 'Total\nPlans',     color: '#fff' },
            { num: stats.uniqueUsers,  label: 'Unique\nUsers',    color: gold },
            { num: stats.today,        label: 'Plans\nToday',     color: gold },
            { num: stats.thisWeek,     label: 'This\nWeek',       color: gold },
            { num: stats.thisMonth,    label: 'This\nMonth',      color: gold },
            { num: stats.trainingOnly, label: 'Training\nOnly',   color: gold },
            { num: stats.nutritionOnly,label: 'Nutrition\nOnly',  color: blue },
            { num: stats.bundle,       label: 'Bundle\nUsers',    color: '#6db88a' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: `1px solid ${s.color}15`, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 5 }}>{loading ? '…' : s.num}</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Upsell Cards ── */}
        <div style={base.label}>Upsell Opportunities</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {[
            { count: stats.trainingOnly, emails: stats.trainingOnlyEmails, color: blue, title: `${stats.trainingOnly} users without Nutrition`, sub: 'Have training plan · no nutrition plan yet', cta: 'Select → Email them' },
            { count: stats.nutritionOnly, emails: stats.nutritionOnlyEmails, color: gold, title: `${stats.nutritionOnly} users without Training`, sub: 'Have nutrition plan · no training plan yet', cta: 'Select → Email them' },
          ].map(card => (
            <div key={card.title} style={{ padding: '16px 18px', borderRadius: 12, background: `${card.color}07`, border: `1px solid ${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{card.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{card.sub}</div>
              </div>
              <button onClick={() => quickSelect(card.emails)} style={{ ...base.btn(card.color), whiteSpace: 'nowrap', fontSize: 9 }}>{card.cta} →</button>
            </div>
          ))}
        </div>

        {/* ── Controls ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...base.inp, flex: 1, minWidth: 200 }} placeholder="Search by email or slug…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...base.inp, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All plans</option>
            <option value="training">Training plans</option>
            <option value="nutrition">Nutrition plans</option>
            <option value="training-only">Training-only users</option>
            <option value="nutrition-only">Nutrition-only users</option>
            <option value="bundle">Bundle users</option>
          </select>
          <select style={{ ...base.inp, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button style={base.btn(gold)} onClick={exportCSV}>⬇ CSV</button>
          <button style={base.btn('rgba(255,255,255,0.3)')} onClick={loadPlans}>↺ Refresh</button>
        </div>

        {/* Selection bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, minHeight: 28 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {selected.size > 0 && <span style={{ color: gold, marginLeft: 10 }}>· {selected.size} selected</span>}
          </div>
          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelected(new Set())} style={{ ...base.btn('rgba(255,255,255,0.3)'), padding: '7px 12px' }}>Clear</button>
              <button onClick={() => setShowBroadcast(true)} style={{ ...base.btn(gold), padding: '7px 16px', background: 'linear-gradient(135deg,rgba(184,146,46,0.18),rgba(200,169,110,0.18))' }}>
                📨 Send Email to {selected.size}
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ ...base.th, width: 44, paddingLeft: 16 }}>
                  <Checkbox checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll} />
                </th>
                <th style={base.th}>Email</th>
                <th style={base.th}>Plan Type</th>
                <th style={base.th}>User Status</th>
                <th style={base.th}>Plans</th>
                <th style={base.th}>Created</th>
                <th style={base.th}>Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ ...base.td, textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.15)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...base.td, textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.15)' }}>No plans found</td></tr>
              ) : filtered.map((p, i) => {
                const u = userMap[p.email?.toLowerCase()]
                const isBundle = u?.types.has('training') && u?.types.has('nutrition')
                const isSelected = selected.has(p.email)
                const missingType = u?.types.has('training') ? 'Nutrition' : 'Training'
                return (
                  <tr key={i} onClick={() => toggleRow(p.email)} style={{
                    background: isSelected ? `${gold}09` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}>
                    <td style={{ ...base.td, paddingLeft: 16, width: 44 }} onClick={e => { e.stopPropagation(); toggleRow(p.email) }}>
                      <Checkbox checked={isSelected} onChange={() => toggleRow(p.email)} />
                    </td>
                    <td style={base.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: '#fff', fontSize: 12 }}>{p.email || '—'}</span>
                        {p.email && (
                          <button onClick={e => { e.stopPropagation(); copyEmail(p.email) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 5px', borderRadius: 4, color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                            {copiedEmail === p.email ? '✓' : '⎘'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={base.td}><PlanTypeBadge type={p.plan_type} /></td>
                    <td style={base.td}>
                      {isBundle
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: '#6db88a', background: 'rgba(109,184,138,0.1)', border: '1px solid rgba(109,184,138,0.2)', padding: '2px 8px', borderRadius: 8 }}>Bundle ✓</span>
                        : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Missing {missingType}</span>
                      }
                    </td>
                    <td style={{ ...base.td, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{u?.count ?? 1}</td>
                    <td style={{ ...base.td, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{formatDate(p.created_at)}</td>
                    <td style={base.td}>
                      {p.slug
                        ? <a href={`/plan/${p.slug}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ color: gold, fontSize: 11, textDecoration: 'none' }}>View →</a>
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {selected.size === 0 && (
          <div style={{ marginTop: 28, padding: '14px 18px', borderRadius: 10, background: `${gold}06`, border: `1px solid ${gold}12`, fontSize: 11, color: 'rgba(255,255,255,0.22)', lineHeight: 1.8 }}>
            💡 Click any row to select · use upsell cards above to select a segment instantly · then hit <strong style={{ color: `${gold}80` }}>Send Email</strong>
          </div>
        )}
      </div>
    </div>
  )
}
