import { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'

const LINK_KEY_PREFIX = 'pt_link_key_'

function getLinkKey(slug) {
  try { return localStorage.getItem(LINK_KEY_PREFIX + slug) || '' } catch { return '' }
}
function setLinkKey(slug, key) {
  try { localStorage.setItem(LINK_KEY_PREFIX + slug, key.trim()) } catch {}
}
function toDateStr(d) { return d.toISOString().split('T')[0] }

function getWeekDates() {
  const dates = []
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function getMacroHistoryForSlug(slug) {
  const entries = []
  for (const d of getWeekDates()) {
    const key = `pt_macro_${slug}_${toDateStr(d)}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) entries.push(JSON.parse(raw))
    } catch {}
  }
  return entries
}

function computeScore({ progressionScore, avgProtein, proteinTarget, avgKcal, kcalTarget, lowEnergyDays, injectionDose }) {
  const signals = []
  const filledFields = []
  const missingFields = []

  if (progressionScore !== null) {
    signals.push({ weight: 30, value: progressionScore })
    filledFields.push('Training progression')
  } else {
    missingFields.push('Training weights — log in Progress Tracker')
  }

  if (avgProtein !== null && proteinTarget !== null && proteinTarget > 0) {
    const ratio = Math.min(avgProtein / proteinTarget, 1.3)
    let s
    if (ratio >= 0.9 && ratio <= 1.15) s = 100
    else if (ratio >= 0.75) s = 60 + ((ratio - 0.75) / 0.15) * 40
    else if (ratio > 1.15) s = Math.max(70, 100 - (ratio - 1.15) * 200)
    else s = (ratio / 0.75) * 60
    signals.push({ weight: 30, value: Math.round(s) })
    filledFields.push(`Protein: avg ${Math.round(avgProtein)}g / target ${Math.round(proteinTarget)}g`)
  } else {
    missingFields.push('Protein intake — log meals in Macro Tracker')
  }

  if (lowEnergyDays !== null) {
    const s = lowEnergyDays === 0 ? 100 : lowEnergyDays === 1 ? 80 : lowEnergyDays === 2 ? 60 : 40
    signals.push({ weight: 15, value: s })
    filledFields.push(`Low-energy days: ${lowEnergyDays}`)
  } else {
    missingFields.push('Low-energy days this week')
  }

  if (avgKcal !== null && kcalTarget !== null && kcalTarget > 0) {
    const deficit = kcalTarget - avgKcal
    let s
    if (deficit >= 300 && deficit <= 600) s = 100
    else if (deficit < 300) s = Math.max(60, 100 - (300 - deficit) * 0.1)
    else s = Math.max(40, 100 - (deficit - 600) * 0.1)
    signals.push({ weight: 15, value: Math.round(s) })
    filledFields.push(`Caloric deficit: ~${Math.round(deficit)} kcal/day`)
  } else {
    missingFields.push('Calorie intake — log meals in Macro Tracker')
  }

  if (injectionDose !== null) {
    signals.push({ weight: 10, value: injectionDose <= 5 ? 90 : injectionDose <= 10 ? 75 : 60 })
    filledFields.push(`Injection dose: ${injectionDose}mg`)
  } else {
    missingFields.push('Injection dose (optional)')
  }

  if (signals.length === 0) return { score: 50, accuracy: 0, filledFields, missingFields }
  const totalWeight = signals.reduce((s, x) => s + x.weight, 0)
  const score = Math.round(signals.reduce((s, x) => s + x.value * x.weight, 0) / totalWeight)
  const accuracy = Math.round((totalWeight / 100) * 100)
  return { score, accuracy, filledFields, missingFields }
}

function getScoreColor(s) {
  if (s >= 85) return '#6db88a'
  if (s >= 70) return '#8dc86e'
  if (s >= 55) return '#c8a96e'
  if (s >= 40) return '#c87e4e'
  return '#c85e5e'
}
function getScoreLabel(s) {
  if (s >= 85) return 'Excellent muscle protection this week.'
  if (s >= 70) return 'Good – muscles are well protected. Small tweaks push it higher.'
  if (s >= 55) return 'Moderate. Targeted improvements will help quickly.'
  if (s >= 40) return 'Below average. Without changes, you may lose more muscle than necessary.'
  return 'Low. Take action now — passive GLP-1 weight loss causes significant muscle loss.'
}
function getOutlook(s) {
  if (s >= 85) return 'At this rate you are likely preserving or even gaining muscle over the next 4 weeks.'
  if (s >= 70) return 'Likely preserving most muscle. Minor improvements could tip it to net gain.'
  if (s >= 55) return 'Possible 0.2–0.4 kg muscle loss over 4 weeks if no changes are made.'
  return 'Risk of 0.5–1.0 kg muscle loss over 4 weeks without action.'
}

function getTips({ hasProtein, proteinGap, hasProgression, progressionLow, lowEnergyHigh, isTrainingPlan, linkedSlug }) {
  const tips = []
  if (hasProtein && proteinGap > 15) {
    tips.push(`Add +${Math.round(proteinGap)}g protein on training days — e.g. 200g Greek yogurt or 1 shake closes that gap.`)
  } else if (isTrainingPlan && !linkedSlug) {
    tips.push('Link your Nutrition Plan below — protein and calorie data will then feed this score automatically.')
  } else if (isTrainingPlan && linkedSlug && !hasProtein) {
    tips.push('Open your Nutrition Plan and log this week\'s meals — data syncs here within seconds.')
  }
  if (!hasProgression) {
    tips.push('Log your weights in the Progress Tracker after each session — it\'s the strongest signal for muscle preservation.')
  } else if (progressionLow) {
    tips.push('Your training weights haven\'t progressed recently. Try +1 rep or +2.5 kg on your main compound lift this week.')
  }
  if (lowEnergyHigh) {
    tips.push('High low-energy days detected. Still train, but halve the volume. Showing up is what protects muscle.')
  } else if (tips.length < 2) {
    tips.push('Keep consistency over the next 4 weeks — it\'s your biggest lever now.')
  }
  return tips.slice(0, 3)
}

function ScoreRing({ score, color, size = 110 }) {
  const r = 46
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
      />
    </svg>
  )
}

function LinkPanel({ slug, linkedSlug, onLink }) {
  const [input, setInput] = useState(linkedSlug || '')
  const [open, setOpen] = useState(false)

  function handleSave() {
    setLinkKey(slug, input)
    onLink(input.trim())
    setOpen(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      width: '100%', padding: '9px 12px', borderRadius: 9, marginBottom: 10,
      background: linkedSlug ? 'rgba(109,184,138,0.08)' : 'rgba(255,255,255,0.03)',
      border: linkedSlug ? '1px solid rgba(109,184,138,0.25)' : '1px dashed rgba(255,255,255,0.12)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
    }}>
      <span style={{ fontSize: 15 }}>{linkedSlug ? '🔗' : '🔌'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: linkedSlug ? '#6db88a' : 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat,sans-serif' }}>
          {linkedSlug ? 'Connected to Nutrition Plan ✓' : 'Connect your Nutrition Plan'}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: 'Montserrat,sans-serif', marginTop: 1 }}>
          {linkedSlug ? `Slug: ${linkedSlug} · Tap to change` : 'Protein & calories sync to your score automatically'}
        </div>
      </div>
      {!linkedSlug && <span style={{ fontSize: 10, color: '#6db88a', fontFamily: 'Montserrat,sans-serif', fontWeight: 700 }}>Connect →</span>}
    </button>
  )

  return (
    <div style={{ padding: '12px', borderRadius: 9, marginBottom: 10, background: 'rgba(109,184,138,0.06)', border: '1px solid rgba(109,184,138,0.2)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6db88a', fontFamily: 'Montserrat,sans-serif', marginBottom: 4 }}>🔗 Enter your Nutrition Plan slug</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat,sans-serif', lineHeight: 1.6, marginBottom: 8 }}>
        Find it in the URL: <span style={{ color: 'rgba(255,255,255,0.45)' }}>…/plan/<strong>your-slug-here</strong></span>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="your-nutrition-plan-slug"
          style={{ flex: 1, padding: '7px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 11, fontFamily: 'Montserrat,sans-serif' }}
        />
        <button onClick={handleSave} style={{ padding: '7px 12px', borderRadius: 7, background: '#6db88a', border: 'none', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>Save</button>
        <button onClick={() => setOpen(false)} style={{ padding: '7px 10px', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  )
}

export default function MuscleGuardScore({ slug, planHtml, isTrainingPlan = false }) {
  const [linkedSlug, setLinkedSlug] = useState(() => getLinkKey(slug))
  const [progressHistory, setProgressHistory] = useState([])
  const [formValues, setFormValues] = useState({ lowEnergyDays: '', injectionDose: '' })
  const [computed, setComputed] = useState(null)
  const [meta, setMeta] = useState({})
  const [saved, setSaved] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [animScore, setAnimScore] = useState(0)
  const [dataSource, setDataSource] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/progress?plan_slug=eq.${slug}&select=*&order=week_number.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        )
        const data = await res.json()
        setProgressHistory(Array.isArray(data) ? data : [])
      } catch {}
    }
    load()
  }, [slug])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pt_musclescore_${slug}`)
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
  }, [slug])

  useEffect(() => {
    const ownMacros = getMacroHistoryForSlug(slug)
    const linkedMacros = linkedSlug ? getMacroHistoryForSlug(linkedSlug) : []
    const macros = linkedMacros.length > 0 ? linkedMacros : ownMacros
    setDataSource(linkedMacros.length > 0 ? 'linked' : ownMacros.length > 0 ? 'self' : null)

    let avgProtein = null, avgKcal = null
    if (macros.length > 0) {
      const ps = macros.map(e => parseFloat(e.protein)).filter(v => !isNaN(v) && v > 0)
      const ks = macros.map(e => parseFloat(e.kcal)).filter(v => !isNaN(v) && v > 0)
      if (ps.length > 0) avgProtein = Math.round(ps.reduce((a, b) => a + b, 0) / ps.length)
      if (ks.length > 0) avgKcal = Math.round(ks.reduce((a, b) => a + b, 0) / ks.length)
    }

    let proteinTarget = null, kcalTarget = null
    if (planHtml) {
      const pm = planHtml.match(/(\d{2,4})\s*g\s*(?:of\s*)?protein\s*(?:per\s*day|\/day|daily|target)/i)
        || planHtml.match(/protein[^:]*:\s*(\d{2,4})\s*g/i)
      const km = planHtml.match(/(\d{3,5})\s*(?:kcal|calories)\s*(?:per\s*day|\/day|daily|target)/i)
        || planHtml.match(/calories[^:]*:\s*(\d{3,5})/i)
      if (pm) proteinTarget = parseInt(pm[1])
      if (km) kcalTarget = parseInt(km[1])
    }

    let progressionScore = null
    if (progressHistory.length >= 2) {
      const weeks = [...new Set(progressHistory.map(h => h.week_number))].sort((a, b) => a - b)
      if (weeks.length >= 2) {
        const last = progressHistory.filter(h => h.week_number === weeks[weeks.length - 1])
        const prev = progressHistory.filter(h => h.week_number === weeks[weeks.length - 2])
        let up = 0, same = 0, down = 0
        last.forEach(l => {
          const p = prev.find(x => x.exercise_name === l.exercise_name)
          if (!p || !p.weight_kg || !l.weight_kg) return
          if (l.weight_kg > p.weight_kg) up++
          else if (l.weight_kg < p.weight_kg) down++
          else same++
        })
        const total = up + same + down
        if (total > 0) progressionScore = Math.round((up * 100 + same * 70 + down * 30) / total)
      } else {
        progressionScore = 65
      }
    }

    const lowEnergyDays = formValues.lowEnergyDays !== '' ? parseInt(formValues.lowEnergyDays) : null
    const injectionDose = formValues.injectionDose !== '' ? parseFloat(formValues.injectionDose) : null

    setMeta({ avgProtein, proteinTarget, progressionScore, lowEnergyDays })
    setComputed(computeScore({ progressionScore, avgProtein, proteinTarget, avgKcal, kcalTarget, lowEnergyDays, injectionDose }))
  }, [slug, linkedSlug, planHtml, progressHistory, formValues])

  useEffect(() => {
    if (!computed) return
    const target = computed.score
    let cur = 0
    const step = Math.max(1, target / 40)
    const id = setInterval(() => {
      cur = Math.min(cur + step, target)
      setAnimScore(Math.round(cur))
      if (cur >= target) clearInterval(id)
    }, 22)
    return () => clearInterval(id)
  }, [computed?.score])

  if (!computed) return (
    <div style={{ margin: '0 0 14px', padding: '14px 16px', borderRadius: 12, background: 'rgba(109,184,138,0.04)', border: '1px solid rgba(109,184,138,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
      <span>🛡️</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat,sans-serif' }}>MuscleGuard Score loading…</span>
    </div>
  )

  const { score, accuracy, filledFields, missingFields } = computed
  const color = getScoreColor(score)
  const tips = getTips({
    hasProtein: meta.avgProtein !== null && meta.proteinTarget !== null,
    proteinGap: meta.proteinTarget !== null && meta.avgProtein !== null ? meta.proteinTarget - meta.avgProtein : 0,
    hasProgression: meta.progressionScore !== null,
    progressionLow: meta.progressionScore !== null && meta.progressionScore < 60,
    lowEnergyHigh: meta.lowEnergyDays !== null && meta.lowEnergyDays >= 2,
    isTrainingPlan,
    linkedSlug,
  })

  function saveScore() {
    const entry = { score, accuracy, savedAt: new Date().toISOString() }
    try { localStorage.setItem(`pt_musclescore_${slug}`, JSON.stringify(entry)) } catch {}
    setSaved(entry)
  }

  return (
    <div data-tour="muscleguard-score" style={{ margin: '0 0 14px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(109,184,138,0.07) 0%, rgba(0,0,0,0) 70%)', border: '1px solid rgba(109,184,138,0.18)', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>🛡️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6db88a', fontFamily: 'Montserrat,sans-serif' }}>MuscleGuard Score</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat,sans-serif', marginTop: 1 }}>
            Weekly muscle preservation index
            {dataSource === 'linked' && <span style={{ marginLeft: 6, color: '#6db88a', fontWeight: 700 }}>· synced from nutrition plan ✓</span>}
          </div>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={{ padding: '4px 10px', borderRadius: 7, background: showForm ? 'rgba(109,184,138,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(109,184,138,0.2)', color: showForm ? '#6db88a' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
          {showForm ? 'Done' : '+ Data'}
        </button>
      </div>

      {/* SCORE ROW */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={animScore} color={color} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'Montserrat,sans-serif', lineHeight: 1 }}>{animScore}</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat,sans-serif', marginTop: 1 }}>/100</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, fontFamily: 'Montserrat,sans-serif', marginBottom: 8 }}>{getScoreLabel(score)}</div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score accuracy</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: accuracy >= 80 ? '#6db88a' : accuracy >= 50 ? '#c8a96e' : '#c87e4e', fontFamily: 'Montserrat,sans-serif' }}>{accuracy}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
              <div style={{ height: '100%', width: `${accuracy}%`, background: accuracy >= 80 ? '#6db88a' : accuracy >= 50 ? '#c8a96e' : '#c87e4e', borderRadius: 2, transition: 'width 1s ease' }} />
            </div>
            {accuracy < 80 && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 3, fontFamily: 'Montserrat,sans-serif' }}>Log more data to improve accuracy</div>}
          </div>
        </div>
      </div>

      {/* OUTLOOK */}
      <div style={{ margin: '0 14px 10px', padding: '8px 12px', borderRadius: 8, background: 'rgba(109,184,138,0.05)', border: '1px solid rgba(109,184,138,0.1)', fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontFamily: 'Montserrat,sans-serif' }}>
        📈 {getOutlook(score)}
      </div>

      {/* FORM */}
      {showForm && (
        <div style={{ margin: '0 14px 10px', padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {isTrainingPlan && <LinkPanel slug={slug} linkedSlug={linkedSlug} onLink={k => setLinkedSlug(k)} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'Montserrat,sans-serif', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Low-energy days (0–7)</label>
              <input type="number" min="0" max="7" placeholder="e.g. 2" value={formValues.lowEnergyDays} onChange={e => setFormValues(p => ({ ...p, lowEnergyDays: e.target.value }))}
                style={{ width: '100%', padding: '7px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontFamily: 'Montserrat,sans-serif', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'Montserrat,sans-serif', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Injection dose mg (opt.)</label>
              <input type="number" min="0" step="0.5" placeholder="e.g. 2.5" value={formValues.injectionDose} onChange={e => setFormValues(p => ({ ...p, injectionDose: e.target.value }))}
                style={{ width: '100%', padding: '7px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontFamily: 'Montserrat,sans-serif', boxSizing: 'border-box' }} />
            </div>
          </div>
          {filledFields.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Auto-detected</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {filledFields.map(f => <span key={f} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(109,184,138,0.1)', border: '1px solid rgba(109,184,138,0.2)', color: '#6db88a', fontFamily: 'Montserrat,sans-serif', fontWeight: 700 }}>✓ {f}</span>)}
              </div>
            </div>
          )}
          {missingFields.length > 0 && (
            <div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>To improve accuracy</div>
              {missingFields.map(f => <div key={f} style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: 'Montserrat,sans-serif', marginBottom: 3 }}>○ {f}</div>)}
            </div>
          )}
        </div>
      )}

      {/* RECOMMENDATIONS */}
      <div style={{ margin: '0 14px 12px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontFamily: 'Montserrat,sans-serif', marginBottom: 6 }}>AI Coach Recommendations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 11, marginTop: 1, flexShrink: 0 }}>{i === 0 ? '🥩' : i === 1 ? '💪' : '⚡'}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, fontFamily: 'Montserrat,sans-serif' }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SAVE */}
      <div style={{ padding: '0 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={saveScore} style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: 'rgba(109,184,138,0.12)', border: '1px solid rgba(109,184,138,0.25)', color: '#6db88a', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
          💾 Save Week's Score
        </button>
        {saved && (
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat,sans-serif', lineHeight: 1.5 }}>
            Last saved:<br />{new Date(saved.savedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} — {saved.score}/100
          </div>
        )}
      </div>
    </div>
  )
}
