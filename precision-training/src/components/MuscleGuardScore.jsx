import { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWeekStart() {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  d.setDate(d.getDate() - ((day + 6) % 7)) // Monday
  d.setHours(0,0,0,0)
  return d
}

function toDateStr(d) { return d.toISOString().split('T')[0] }

function getMacroHistoryForWeek(slug) {
  // Pull 7 days of macro data from localStorage (same pattern as MacroTracker)
  const entries = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(getWeekStart())
    d.setDate(d.getDate() + i)
    const key = `pt_macro_${slug}_${toDateStr(d)}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) entries.push(JSON.parse(raw))
    } catch {}
  }
  return entries
}

function getScoreStorageKey(slug) { return `pt_musclescore_${slug}` }

// ── Score Calculator ───────────────────────────────────────────────────────────

function computeScore(inputs) {
  /**
   * Each sub-score is optional.
   * We track which signals are present and weight accordingly.
   * Returns { score: 0-100, accuracy: 0-100, filledFields: string[], missingFields: string[] }
   */

  const signals = []
  const filledFields = []
  const missingFields = []

  // 1) TRAINING PROGRESSION (weight logs from Supabase history)
  if (inputs.progressionScore !== null) {
    signals.push({ weight: 30, value: inputs.progressionScore })
    filledFields.push('Training weights & progression')
  } else {
    missingFields.push('Training weights (log in Progress Tracker)')
  }

  // 2) PROTEIN INTAKE
  if (inputs.avgProtein !== null && inputs.proteinTarget !== null) {
    const ratio = Math.min(inputs.avgProtein / inputs.proteinTarget, 1.3)
    // Sweet spot 0.9–1.15 of target → full points
    let protScore
    if (ratio >= 0.9 && ratio <= 1.15) protScore = 100
    else if (ratio >= 0.75) protScore = 60 + (ratio - 0.75) / 0.15 * 40
    else if (ratio > 1.15) protScore = Math.max(70, 100 - (ratio - 1.15) * 200)
    else protScore = ratio / 0.75 * 60
    signals.push({ weight: 30, value: Math.round(protScore) })
    filledFields.push(`Protein intake (avg ${Math.round(inputs.avgProtein)}g/day)`)
  } else {
    missingFields.push('Protein intake (log meals in Macro Tracker)')
  }

  // 3) LOW-ENERGY DAYS
  if (inputs.lowEnergyDays !== null) {
    // 0 = 100pts, 1 = 80, 2 = 60, 3+ = 40
    const le = inputs.lowEnergyDays
    const leScore = le === 0 ? 100 : le === 1 ? 80 : le === 2 ? 60 : 40
    signals.push({ weight: 15, value: leScore })
    filledFields.push('Low-energy days')
  } else {
    missingFields.push('Low-energy days this week')
  }

  // 4) CALORIC DEFICIT ESTIMATE
  if (inputs.avgKcal !== null && inputs.kcalTarget !== null) {
    const deficit = inputs.kcalTarget - inputs.avgKcal
    // Ideal deficit for GLP-1: 300–600 kcal
    let defScore
    if (deficit >= 300 && deficit <= 600) defScore = 100
    else if (deficit < 300) defScore = Math.max(60, 100 - (300 - deficit) * 0.1)
    else defScore = Math.max(40, 100 - (deficit - 600) * 0.1)
    signals.push({ weight: 15, value: Math.round(defScore) })
    filledFields.push('Caloric deficit estimate')
  } else {
    missingFields.push('Calorie intake (log meals in Macro Tracker)')
  }

  // 5) INJECTION DOSE (optional bonus signal)
  if (inputs.injectionDose !== null) {
    // Higher dose = higher suppression = more muscle risk → slightly penalize if very high
    // We just acknowledge it was entered for accuracy purposes
    signals.push({ weight: 10, value: inputs.injectionDose <= 5 ? 90 : inputs.injectionDose <= 10 ? 75 : 60 })
    filledFields.push('Injection dose')
  } else {
    missingFields.push('Injection dose (optional)')
  }

  if (signals.length === 0) return { score: 50, accuracy: 0, filledFields, missingFields }

  const totalWeight = signals.reduce((s, x) => s + x.weight, 0)
  const maxPossibleWeight = 30 + 30 + 15 + 15 + 10 // 100
  const weighted = signals.reduce((s, x) => s + x.value * x.weight, 0)
  const score = Math.round(weighted / totalWeight)
  const accuracy = Math.round((totalWeight / maxPossibleWeight) * 100)

  return { score, accuracy, filledFields, missingFields }
}

// ── Generate AI-style prediction & tips based on score ───────────────────────

function getScoreMessage(score) {
  if (score >= 85) return 'Excellent muscle protection. You\'re doing almost everything right.'
  if (score >= 70) return 'Good – your muscles are well protected this week. Small tweaks could push it higher.'
  if (score >= 55) return 'Moderate. Your muscles are at some risk. Targeted improvements will help quickly.'
  if (score >= 40) return 'Below average. Without changes, you may be losing more muscle than necessary.'
  return 'Low score. Take action now – passive weight loss on GLP-1 without intervention causes significant muscle loss.'
}

function getMuscleOutlook(score, progressionScore) {
  if (score >= 85) return '4-week outlook: On current trajectory you\'re likely preserving or even gaining muscle.'
  if (score >= 70) return '4-week outlook: Likely preserving most muscle. Minor improvements could tip it to gain.'
  if (score >= 55) return '4-week outlook: Possible 0.2–0.4 kg muscle loss if no changes are made.'
  return '4-week outlook: Risk of 0.5–1.0 kg muscle loss over 4 weeks without action.'
}

function getScoreColor(score) {
  if (score >= 85) return '#6db88a'
  if (score >= 70) return '#8dc86e'
  if (score >= 55) return '#c8a96e'
  if (score >= 40) return '#c87e4e'
  return '#c85e5e'
}

function getRecommendations(inputs, score) {
  const tips = []

  if (inputs.avgProtein !== null && inputs.proteinTarget !== null) {
    const gap = inputs.proteinTarget - inputs.avgProtein
    if (gap > 15) tips.push(`Add +${Math.round(gap)}g protein on training days – e.g. add 200g Greek yogurt or 1 protein shake.`)
    else if (gap > 5) tips.push(`You're ${Math.round(gap)}g short of your protein target. A handful of cottage cheese at night fills that gap.`)
  } else {
    tips.push('Start logging your meals in the Macro Tracker – it takes 2 min and improves your score accuracy significantly.')
  }

  if (inputs.progressionScore !== null && inputs.progressionScore < 60) {
    tips.push('Your training weights haven\'t increased recently. Try adding 1 rep or +2.5 kg on your main compound lift this week.')
  } else if (inputs.progressionScore === null) {
    tips.push('Log your weights in the Progress Tracker after each session – this is the strongest signal for muscle preservation.')
  }

  if (inputs.lowEnergyDays !== null && inputs.lowEnergyDays >= 2) {
    tips.push('High-energy-low days detected. On these days: still train, but cut volume in half. Showing up is what protects muscle.')
  }

  if (tips.length === 0) tips.push('Keep it up. Consistency over the next 4 weeks is your biggest lever now.')

  return tips.slice(0, 3)
}

// ── Ring SVG ───────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 140 }) {
  const r = 50
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
      />
    </svg>
  )
}

// ── Accuracy Bar ───────────────────────────────────────────────────────────────

function AccuracyBar({ accuracy }) {
  const color = accuracy >= 80 ? '#6db88a' : accuracy >= 50 ? '#c8a96e' : '#c87e4e'
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Score accuracy
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'Montserrat,sans-serif' }}>{accuracy}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${accuracy}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
      {accuracy < 80 && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5, fontFamily: 'Montserrat,sans-serif', lineHeight: 1.5 }}>
          Log more data to improve accuracy →
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MuscleGuardScore({ slug, planHtml }) {
  const [inputs, setInputs] = useState({
    lowEnergyDays: null,
    injectionDose: null,
    progressionScore: null,
    avgProtein: null,
    proteinTarget: null,
    avgKcal: null,
    kcalTarget: null,
  })
  const [formValues, setFormValues] = useState({ lowEnergyDays: '', injectionDose: '' })
  const [progressHistory, setProgressHistory] = useState([])
  const [computed, setComputed] = useState(null)
  const [saved, setSaved] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [animScore, setAnimScore] = useState(0)

  // Load progress from Supabase
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/progress?plan_slug=eq.${slug}&select=*&order=week_number.asc`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        )
        const data = await res.json()
        setProgressHistory(Array.isArray(data) ? data : [])
      } catch {}
    }
    loadProgress()
  }, [slug])

  // Auto-populate from localStorage (macro tracker data)
  useEffect(() => {
    const macroEntries = getMacroHistoryForWeek(slug)
    let avgProtein = null, avgKcal = null, proteinTarget = null, kcalTarget = null

    if (macroEntries.length > 0) {
      const proteins = macroEntries.map(e => parseFloat(e.protein)).filter(v => !isNaN(v) && v > 0)
      const kcals = macroEntries.map(e => parseFloat(e.kcal)).filter(v => !isNaN(v) && v > 0)
      if (proteins.length > 0) avgProtein = proteins.reduce((a,b) => a+b, 0) / proteins.length
      if (kcals.length > 0) avgKcal = kcals.reduce((a,b) => a+b, 0) / kcals.length
    }

    // Try to extract protein/kcal targets from plan HTML
    if (planHtml) {
      const protMatch = planHtml.match(/(\d{2,4})\s*g\s*(?:of\s*)?protein\s*(?:per\s*day|\/day|daily|target)/i)
      const kcalMatch = planHtml.match(/(\d{3,5})\s*(?:kcal|calories)\s*(?:per\s*day|\/day|daily|target)/i)
      if (protMatch) proteinTarget = parseInt(protMatch[1])
      if (kcalMatch) kcalTarget = parseInt(kcalMatch[1])
      // Fallback: look for macro summary numbers
      if (!proteinTarget) {
        const m2 = planHtml.match(/protein[^:]*:\s*(\d{2,4})\s*g/i)
        if (m2) proteinTarget = parseInt(m2[1])
      }
      if (!kcalTarget) {
        const m3 = planHtml.match(/calories[^:]*:\s*(\d{3,5})/i)
        if (m3) kcalTarget = parseInt(m3[1])
      }
    }

    // Calculate progression score from history
    let progressionScore = null
    if (progressHistory.length >= 2) {
      const weekNums = [...new Set(progressHistory.map(h => h.week_number))].sort((a,b) => a-b)
      if (weekNums.length >= 2) {
        const lastWeek = weekNums[weekNums.length - 1]
        const prevWeek = weekNums[weekNums.length - 2]
        const lastEntries = progressHistory.filter(h => h.week_number === lastWeek)
        const prevEntries = progressHistory.filter(h => h.week_number === prevWeek)
        let improved = 0, same = 0, declined = 0
        lastEntries.forEach(last => {
          const prev = prevEntries.find(p => p.exercise_name === last.exercise_name)
          if (!prev || !prev.weight_kg || !last.weight_kg) return
          if (last.weight_kg > prev.weight_kg) improved++
          else if (last.weight_kg < prev.weight_kg) declined++
          else same++
        })
        const total = improved + same + declined
        if (total > 0) {
          progressionScore = Math.round((improved * 100 + same * 70 + declined * 30) / total)
        }
      } else if (weekNums.length === 1) {
        // Only one week logged — baseline, give moderate score
        progressionScore = 65
      }
    }

    setInputs(prev => ({
      ...prev,
      avgProtein: avgProtein !== null ? Math.round(avgProtein) : null,
      avgKcal: avgKcal !== null ? Math.round(avgKcal) : null,
      proteinTarget,
      kcalTarget,
      progressionScore,
    }))
  }, [slug, planHtml, progressHistory])

  // Merge form values into inputs
  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      lowEnergyDays: formValues.lowEnergyDays !== '' ? parseInt(formValues.lowEnergyDays) : null,
      injectionDose: formValues.injectionDose !== '' ? parseFloat(formValues.injectionDose) : null,
    }))
  }, [formValues])

  // Recompute whenever inputs change
  useEffect(() => {
    const result = computeScore(inputs)
    setComputed(result)
  }, [inputs])

  // Animate score on mount / change
  useEffect(() => {
    if (!computed) return
    const target = computed.score
    let current = 0
    const step = target / 40
    const id = setInterval(() => {
      current = Math.min(current + step, target)
      setAnimScore(Math.round(current))
      if (current >= target) clearInterval(id)
    }, 25)
    return () => clearInterval(id)
  }, [computed?.score])

  // Load saved score
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getScoreStorageKey(slug))
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
  }, [slug])

  function saveScore() {
    if (!computed) return
    const entry = { ...computed, inputs, savedAt: new Date().toISOString() }
    try { localStorage.setItem(getScoreStorageKey(slug), JSON.stringify(entry)) } catch {}
    setSaved(entry)
  }

  // Always render — show skeleton until computed is ready
  const { score = 0, accuracy = 0, filledFields = [], missingFields = [] } = computed || {}

  if (!computed) return (
    <div style={{ margin: '0 16px 24px', borderRadius: 16, background: 'rgba(109,184,138,0.04)', border: '1px solid rgba(109,184,138,0.15)', padding: '18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>🛡️</span>
      <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>MuscleGuard Score lädt…</div>
    </div>
  )
  const color = getScoreColor(score)
  const recs = getRecommendations(inputs, score)

  return (
    <div data-tour="muscleguard-score" style={{
      margin: '0 16px 24px',
      borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(109,184,138,0.06) 0%, rgba(0,0,0,0) 60%)',
      border: '1px solid rgba(109,184,138,0.2)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px 0',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>🛡️</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6db88a', fontFamily: 'Montserrat,sans-serif' }}>
            MuscleGuard Score
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat,sans-serif', marginTop: 1 }}>
            Weekly muscle preservation index
          </div>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{
            marginLeft: 'auto', padding: '5px 10px', borderRadius: 8,
            background: 'rgba(109,184,138,0.1)', border: '1px solid rgba(109,184,138,0.25)',
            color: '#6db88a', fontSize: 10, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.05em',
          }}
        >
          {showForm ? 'Hide' : '+ Add Data'}
        </button>
      </div>

      {/* Score display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 18px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={animScore} color={color} size={120} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'Montserrat,sans-serif', lineHeight: 1 }}>
              {animScore}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat,sans-serif', marginTop: 2 }}>/ 100</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: 'Montserrat,sans-serif', marginBottom: 10 }}>
            {getScoreMessage(score)}
          </div>
          <AccuracyBar accuracy={accuracy} />
        </div>
      </div>

      {/* Prediction */}
      <div style={{
        margin: '0 16px', padding: '10px 14px', borderRadius: 10,
        background: 'rgba(109,184,138,0.05)', border: '1px solid rgba(109,184,138,0.12)',
        fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
        fontFamily: 'Montserrat,sans-serif', marginBottom: 12,
      }}>
        📈 {getMuscleOutlook(score)}
      </div>

      {/* Input form */}
      {showForm && (
        <div style={{ margin: '0 16px 12px', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat,sans-serif', marginBottom: 12 }}>
            This week's data
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat,sans-serif', display: 'block', marginBottom: 4 }}>
                Low-energy days (0–7)
              </label>
              <input
                type="number" min="0" max="7"
                placeholder="e.g. 2"
                value={formValues.lowEnergyDays}
                onChange={e => setFormValues(p => ({ ...p, lowEnergyDays: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 13, fontFamily: 'Montserrat,sans-serif', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat,sans-serif', display: 'block', marginBottom: 4 }}>
                Injection dose (mg, optional)
              </label>
              <input
                type="number" min="0" step="0.5"
                placeholder="e.g. 2.5"
                value={formValues.injectionDose}
                onChange={e => setFormValues(p => ({ ...p, injectionDose: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 13, fontFamily: 'Montserrat,sans-serif', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Auto-detected data */}
          {(inputs.avgProtein !== null || inputs.progressionScore !== null) && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Auto-detected this week
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {filledFields.map(f => (
                  <span key={f} style={{
                    fontSize: 9, padding: '3px 8px', borderRadius: 20,
                    background: 'rgba(109,184,138,0.1)', border: '1px solid rgba(109,184,138,0.2)',
                    color: '#6db88a', fontFamily: 'Montserrat,sans-serif', fontWeight: 700,
                  }}>✓ {f}</span>
                ))}
              </div>
            </div>
          )}

          {missingFields.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'Montserrat,sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Add to improve accuracy
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {missingFields.map(f => (
                  <span key={f} style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat,sans-serif' }}>
                    ○ {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div style={{ margin: '0 16px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat,sans-serif', marginBottom: 8 }}>
          AI Coach Recommendations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {recs.map((tip, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '9px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 12, marginTop: 1 }}>
                {i === 0 ? '💪' : i === 1 ? '🍳' : '⚡'}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, fontFamily: 'Montserrat,sans-serif' }}>
                {tip}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={saveScore}
          style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            background: 'rgba(109,184,138,0.15)', border: '1px solid rgba(109,184,138,0.3)',
            color: '#6db88a', fontSize: 12, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.05em',
          }}
        >
          💾 Save This Week's Score
        </button>
        {saved && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat,sans-serif', lineHeight: 1.4 }}>
            Last saved:<br/>{new Date(saved.savedAt).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })} — {saved.score}/100
          </div>
        )}
      </div>
    </div>
  )
}
