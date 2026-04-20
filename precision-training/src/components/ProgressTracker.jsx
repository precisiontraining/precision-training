import { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'
import styles from './ProgressTracker.module.css'

const LBS_TO_KG = 0.453592
const KG_TO_LBS = 2.20462
function toKg(val, unit)  { return unit === 'lbs' ? Math.round(parseFloat(val) * LBS_TO_KG * 100) / 100 : parseFloat(val) }
function fromKg(kg, unit) { return unit === 'lbs' ? Math.round(kg * KG_TO_LBS * 10) / 10 : kg }

function getWeekLabel() {
  // Determine current program week based on Mon-based calendar week
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return Math.max(1, (week % 12) || 12)
}

export default function ProgressTracker({ slug, exercises, accentColor }) {
  const accent = accentColor || 'var(--gold)'

  const [week, setWeek]       = useState(() => getWeekLabel())
  const [entries, setEntries] = useState({})
  const [history, setHistory] = useState([])
  const [saving, setSaving]   = useState({})
  const [saved, setSaved]     = useState({}) // which exercises have been saved this session
  const [toast, setToast]     = useState('')
  const [activeEx, setActiveEx] = useState(null) // expanded exercise
  const [unit, setUnit]       = useState(() => {
    try { return localStorage.getItem(`pt_weight_unit_${slug}`) || 'kg' } catch { return 'kg' }
  })

  const filteredExercises = exercises.filter(e =>
    e && e.trim() && !['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(e.toLowerCase())
  )

  useEffect(() => {
    if (filteredExercises.length > 0 && activeEx === null) setActiveEx(filteredExercises[0])
  }, [filteredExercises.length])

  useEffect(() => { loadWeek(week) }, [week, slug])
  useEffect(() => { loadHistory() }, [slug])

  async function loadWeek(w) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/progress?plan_slug=eq.${slug}&week_number=eq.${w}&select=*`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      )
      const data = await res.json()
      const map = {}
      data.forEach(d => {
        map[d.exercise_name] = {
          weight: d.weight_kg ? String(fromKg(d.weight_kg, unit)) : '',
          reps: d.reps ? String(d.reps) : '',
          sets: d.sets_completed ? String(d.sets_completed) : '',
          notes: d.notes || '',
        }
      })
      setEntries(map)
      setSaved({})
    } catch {}
  }

  async function loadHistory() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/progress?plan_slug=eq.${slug}&select=*&order=week_number.asc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      )
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch {}
  }

  function toggleUnit() {
    const next = unit === 'kg' ? 'lbs' : 'kg'
    try { localStorage.setItem(`pt_weight_unit_${slug}`, next) } catch {}
    // Convert all current entries
    setEntries(prev => {
      const converted = {}
      Object.entries(prev).forEach(([ex, e]) => {
        converted[ex] = {
          ...e,
          weight: e.weight ? String(fromKg(toKg(e.weight, unit), next)) : '',
        }
      })
      return converted
    })
    setUnit(next)
  }

  function update(exercise, field, value) {
    setEntries(prev => ({ ...prev, [exercise]: { ...(prev[exercise] || {}), [field]: value } }))
    setSaved(prev => ({ ...prev, [exercise]: false }))
  }

  async function saveEntry(exercise) {
    setSaving(prev => ({ ...prev, [exercise]: true }))
    const e = entries[exercise] || {}
    const weightKg = e.weight ? toKg(e.weight, unit) : null
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/progress`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          plan_slug: slug,
          week_number: week,
          exercise_name: exercise,
          weight_kg: isNaN(weightKg) ? null : weightKg,
          reps: parseInt(e.reps) || null,
          sets_completed: parseInt(e.sets) || null,
          notes: e.notes || null,
        }),
      })
      setSaved(prev => ({ ...prev, [exercise]: true }))
      showToast('Saved ✓')
      loadHistory()
    } catch {}
    setSaving(prev => ({ ...prev, [exercise]: false }))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function getExHistory(exercise) {
    return history.filter(h => h.exercise_name === exercise).sort((a,b) => a.week_number - b.week_number).slice(-6)
  }

  function getTrend(exercise) {
    const h = getExHistory(exercise)
    if (h.length < 2) return null
    const last = h[h.length - 1].weight_kg
    const prev = h[h.length - 2].weight_kg
    if (!last || !prev) return null
    if (last > prev) return 'up'
    if (last < prev) return 'down'
    return 'flat'
  }

  function getPersonalBest(exercise) {
    const h = getExHistory(exercise)
    if (!h.length) return null
    const weights = h.map(x => x.weight_kg).filter(Boolean)
    if (!weights.length) return null
    const best = Math.max(...weights)
    return fromKg(best, unit)
  }

  if (filteredExercises.length === 0) return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: 'Montserrat,sans-serif' }}>
      No exercises found. Make sure your plan has loaded.
    </div>
  )

  return (
    <div className={styles.tracker}>

      {/* ── HEADER ROW ── */}
      <div className={styles.headerRow}>
        <h2 className={styles.title} style={{ color: accent }}>Progress Tracker</h2>
        <button onClick={toggleUnit} className={styles.unitToggle} style={{ borderColor: `${accent}40` }}>
          <span style={{ color: unit === 'kg' ? accent : 'rgba(255,255,255,0.25)', fontWeight: 800 }}>kg</span>
          <span className={styles.unitDivider}>/</span>
          <span style={{ color: unit === 'lbs' ? accent : 'rgba(255,255,255,0.25)', fontWeight: 800 }}>lbs</span>
        </button>
      </div>

      {/* ── WEEK SELECTOR ── */}
      <div className={styles.weekRow}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
          const hasData = history.some(h => h.week_number === w)
          return (
            <button key={w}
              className={`${styles.weekBtn} ${week === w ? styles.weekActive : ''} ${hasData && week !== w ? styles.weekHasData : ''}`}
              style={week === w ? { borderColor: accent, color: accent, background: `${accent}18` } : {}}
              onClick={() => setWeek(w)}
            >
              W{w}
              {hasData && week !== w && <span className={styles.weekDot} />}
            </button>
          )
        })}
      </div>

      {/* ── EXERCISE LIST ── */}
      <div className={styles.exerciseList}>
        {filteredExercises.map(exercise => {
          const e      = entries[exercise] || {}
          const hist   = getExHistory(exercise)
          const trend  = getTrend(exercise)
          const pb     = getPersonalBest(exercise)
          const isOpen = activeEx === exercise
          const isSaved = saved[exercise]
          const hasValues = e.weight || e.reps || e.sets

          return (
            <div key={exercise} className={`${styles.exCard} ${isOpen ? styles.exCardOpen : ''}`}>

              {/* Exercise header — always visible */}
              <button className={styles.exHeader} onClick={() => setActiveEx(isOpen ? null : exercise)}>
                <div className={styles.exLeft}>
                  <div className={styles.exName}>{exercise}</div>
                  {!isOpen && hasValues && (
                    <div className={styles.exSummary}>
                      {e.weight && <span>{e.weight}{unit}</span>}
                      {e.reps   && <span>× {e.reps} reps</span>}
                      {e.sets   && <span>{e.sets} sets</span>}
                    </div>
                  )}
                </div>
                <div className={styles.exRight}>
                  {trend && (
                    <span className={`${styles.trendBadge} ${styles['trend_' + trend]}`}>
                      {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </span>
                  )}
                  {isSaved && <span className={styles.savedBadge}>✓</span>}
                  <span className={styles.chevron} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className={styles.exBody}>

                  {/* PB banner */}
                  {pb && (
                    <div className={styles.pbBanner}>
                      <span>🏆</span>
                      <span>Personal best: <strong>{pb} {unit}</strong></span>
                    </div>
                  )}

                  {/* Input row */}
                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label>Weight <span className={styles.unitHint}>{unit}</span></label>
                      <input type="number" min="0" step="0.5" placeholder="0"
                        value={e.weight || ''}
                        onChange={ev => update(exercise, 'weight', ev.target.value)}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Reps</label>
                      <input type="number" min="0" placeholder="0"
                        value={e.reps || ''}
                        onChange={ev => update(exercise, 'reps', ev.target.value)}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Sets</label>
                      <input type="number" min="0" placeholder="0"
                        value={e.sets || ''}
                        onChange={ev => update(exercise, 'sets', ev.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <input
                    className={`${styles.input} ${styles.notesInput}`}
                    placeholder="Notes — e.g. felt strong, increase next week"
                    value={e.notes || ''}
                    onChange={ev => update(exercise, 'notes', ev.target.value)}
                  />

                  <button
                    className={styles.saveBtn}
                    style={{ background: isSaved ? '#4ade80' : accent, color: '#000' }}
                    onClick={() => saveEntry(exercise)}
                    disabled={saving[exercise]}
                  >
                    {saving[exercise] ? 'Saving…' : isSaved ? '✓ Saved' : 'Save W' + week}
                  </button>

                  {/* Mini sparkline history */}
                  {hist.length > 0 && (
                    <div className={styles.sparkWrap}>
                      <div className={styles.sparkLabel}>Weight history ({unit})</div>
                      <div className={styles.sparkRow}>
                        {hist.map((h, i) => {
                          const w = h.weight_kg ? fromKg(h.weight_kg, unit) : null
                          const maxW = Math.max(...hist.map(x => x.weight_kg || 0))
                          const pct = maxW > 0 && w ? Math.max(15, Math.round((h.weight_kg / maxW) * 100)) : 0
                          return (
                            <div key={i} className={styles.sparkCol}>
                              <div className={styles.sparkBar} style={{ height: `${pct}%`, background: i === hist.length - 1 ? accent : 'rgba(255,255,255,0.15)' }} />
                              <div className={styles.sparkWeek}>W{h.week_number}</div>
                              {w && <div className={styles.sparkVal}>{w}</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── LOCKED PREMIUM ── */}
      <div className={styles.premiumSection}>
        <div className={styles.premiumLabel}>Premium Features</div>
        {[
          { icon: '📊', label: 'Muscle Preservation Trend', sub: 'Visual chart of your strength over time' },
          { icon: '🔔', label: 'Stagnation Detection', sub: 'Auto-alerts when progress plateaus' },
          { icon: '📄', label: 'Doctor-Ready PDF Export', sub: 'Progress report for your healthcare provider' },
        ].map(f => (
          <div key={f.label} className={styles.premiumItem}>
            <span className={styles.premiumIcon}>{f.icon}</span>
            <div className={styles.premiumText}>
              <div className={styles.premiumName}>{f.label}</div>
              <div className={styles.premiumSub}>{f.sub}</div>
            </div>
            <span className={styles.comingSoon}>COMING SOON</span>
          </div>
        ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
