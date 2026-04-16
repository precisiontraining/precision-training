import { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'

// Admin password — stored as SHA-256 hash only, never as plaintext
// To generate your hash: https://emn178.github.io/online-tools/sha256.html
// Set VITE_ADMIN_PASSWORD_HASH in Vercel environment variables
const ADMIN_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? ''

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const HEADERS = {
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
  const isGlp = type?.includes('glp') || type?.includes('guard')
  const isNut = type?.includes('nutrition')
  const color = isGlp ? '#6db88a' : isNut ? '#6e9dc8' : '#c8a96e'
  const label = isGlp
    ? (isNut ? 'GLP-1 Nutrition' : 'GLP-1 Training')
    : isNut ? 'Nutrition' : 'Training'
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 10,
      background: `${color}18`, border: `1px solid ${color}40`,
      fontSize: 10, fontWeight: 700, letterSpacing: 1, color,
    }}>{label}</span>
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

  async function login() {
    if (!ADMIN_HASH) { setAuthError('Admin hash not configured. See .env.example for setup instructions.'); return }
    const inputHash = await sha256(pw)
    if (inputHash === ADMIN_HASH) { setAuthed(true); setAuthError('') }
    else setAuthError('Wrong password.')
  }

  useEffect(() => { if (authed) loadPlans() }, [authed])

  async function loadPlans() {
    setLoading(true)
    try {
      // Fetch plan metadata — does NOT include html_content (too large, not needed here)
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/plans?select=slug,plan_type,created_at,email&order=created_at.desc&limit=500`,
        { headers: HEADERS }
      )
      const data = await res.json()
      setPlans(Array.isArray(data) ? data : [])
    } catch { setPlans([]) }
    setLoading(false)
  }

  function copyEmail(email) {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    })
  }

  function exportCSV() {
    const rows = [['Email', 'Plan Type', 'Created At', 'Slug']]
    filtered.forEach(p => rows.push([p.email || '', p.plan_type || '', p.created_at || '', p.slug || '']))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'precision-training-leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = plans
    .filter(p => {
      if (filter !== 'all' && !p.plan_type?.includes(filter)) return false
      if (search) {
        const q = search.toLowerCase()
        return p.email?.toLowerCase().includes(q) || p.slug?.includes(q) || p.plan_type?.includes(q)
      }
      return true
    })
    .sort((a, b) => sort === 'newest'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at)
    )

  const stats = {
    total: plans.length,
    glp1: plans.filter(p => p.plan_type?.includes('glp')).length,
    training: plans.filter(p => p.plan_type?.includes('training') && !p.plan_type?.includes('glp')).length,
    nutrition: plans.filter(p => p.plan_type?.includes('nutrition') && !p.plan_type?.includes('glp')).length,
    today: plans.filter(p => {
      if (!p.created_at) return false
      const d = new Date(p.created_at)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length,
  }

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Montserrat, Arial, sans-serif', padding: '0 0 60px' },
    header: { background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { fontSize: 13, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
    gold: { color: '#c8a96e' },
    adminBadge: { padding: '4px 12px', borderRadius: 20, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#c8a96e' },
    body: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 32 },
    statCard: { padding: '18px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' },
    statNum: { fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 },
    statLabel: { fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' },
    controls: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
    input: { flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: 13, outline: 'none' },
    select: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat, sans-serif', fontSize: 12, outline: 'none', cursor: 'pointer' },
    exportBtn: { padding: '10px 20px', borderRadius: 8, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)', color: '#c8a96e', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    td: { padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' },
    emailCell: { display: 'flex', alignItems: 'center', gap: 8 },
    copyBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 6, color: 'rgba(255,255,255,0.25)', fontSize: 11, transition: 'all 0.15s' },
    lockPage: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, Arial, sans-serif' },
    lockCard: { width: '100%', maxWidth: 360, padding: 40, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, textAlign: 'center' },
    lockTitle: { fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 },
    lockSub: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 },
    lockInput: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    lockBtn: { width: '100%', padding: 15, borderRadius: 50, background: 'linear-gradient(135deg,#b8922e,#c8a96e)', color: '#0a0a0a', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, border: 'none', cursor: 'pointer' },
    lockError: { fontSize: 12, color: '#e06060', marginBottom: 12 },
  }

  if (!authed) return (
    <div style={s.lockPage}>
      <div style={s.lockCard}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
        <div style={s.lockTitle}>Admin Access</div>
        <div style={s.lockSub}>Precision Training · Owner only</div>
        <input style={s.lockInput} type="password" placeholder="Admin password"
          value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} />
        {authError && <div style={s.lockError}>{authError}</div>}
        <button style={s.lockBtn} onClick={login}>Enter →</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo}><span style={s.gold}>Precision</span> Training</div>
        <span style={s.adminBadge}>ADMIN DASHBOARD</span>
        <button onClick={() => setAuthed(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 11, cursor: 'pointer', letterSpacing: 1 }}>LOGOUT</button>
      </div>

      <div style={s.body}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Lead Overview</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>All plans generated — use emails for future outreach & upsell campaigns.</p>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { num: stats.total, label: 'Total Plans', color: '#fff' },
            { num: stats.today, label: 'Today', color: '#c8a96e' },
            { num: stats.glp1, label: 'GLP-1 Plans', color: '#6db88a' },
            { num: stats.training, label: 'Training', color: '#c8a96e' },
            { num: stats.nutrition, label: 'Nutrition', color: '#6e9dc8' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={{ ...s.statNum, color: stat.color }}>{loading ? '…' : stat.num}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <input style={s.input} placeholder="Search by email or slug…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={s.select} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="glp">GLP-1 only</option>
            <option value="training">Training only</option>
            <option value="nutrition">Nutrition only</option>
          </select>
          <select style={s.select} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button style={s.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>
          <button style={{ ...s.exportBtn, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }} onClick={loadPlans}>↺ Refresh</button>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Table */}
        <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Email</th>
                <th style={s.th}>Plan Type</th>
                <th style={s.th}>Created</th>
                <th style={s.th}>Plan Link</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>No plans found</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={s.td}>
                    <div style={s.emailCell}>
                      <span style={{ color: '#fff' }}>{p.email || <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</span>
                      {p.email && (
                        <button style={s.copyBtn} onClick={() => copyEmail(p.email)}
                          title="Copy email">
                          {copiedEmail === p.email ? '✓' : '⎘'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={s.td}><PlanTypeBadge type={p.plan_type} /></td>
                  <td style={{ ...s.td, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{formatDate(p.created_at)}</td>
                  <td style={s.td}>
                    {p.slug
                      ? <a href={`/plan/${p.slug}`} target="_blank" rel="noreferrer"
                          style={{ color: '#c8a96e', fontSize: 11, textDecoration: 'none' }}>
                          View →
                        </a>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 40, padding: '20px 24px', borderRadius: 12, background: 'rgba(200,169,110,0.04)', border: '1px solid rgba(200,169,110,0.12)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c8a96e', marginBottom: 8 }}>📧 Email Outreach Tips</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>
            Export CSV → import into Mailjet or ConvertKit. Segment GLP-1 users separately — they convert better on Premium upsell (muscle preservation angle). Wait 7–14 days after plan delivery before first outreach.
          </div>
        </div>
      </div>
    </div>
  )
}
