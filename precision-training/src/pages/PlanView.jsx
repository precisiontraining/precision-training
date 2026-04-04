import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProgressTracker from '../components/ProgressTracker'
import MacroTracker from '../components/MacroTracker'
import AICoach from '../components/AICoach'
import { SUPABASE_URL, SUPABASE_ANON_KEY, EXERCISE_GIF_URL, PLAN_CHAT_URL, DAYS } from '../constants'
import styles from './PlanView.module.css'

const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }

// ── PARSE AI HTML → STRUCTURED DATA ──────────────────────────────────────────

// Detects if a heading text looks like a training day
function isDayHeading(text) {
  const t = text.toLowerCase().trim()
  // "Monday", "Tuesday" etc.
  if (DAYS.some(d => t.includes(d.toLowerCase()))) return true
  // "Day 1", "Day 2 – Upper Body" etc.
  if (/^day\s*\d+/i.test(t)) return true
  // "Workout", "Workout 1", "Workout A", "Session 1", "Training Day"
  if (/^(workout|session|training)(\s|$)/i.test(t)) return true
  // "Upper Body", "Lower Body", "Push Day", "Pull Day", "Leg Day" etc.
  if (/\b(upper|lower|push|pull|leg|chest|back|shoulder|arm|full.?body|cardio|core|glute|hamstring)\b/i.test(t)) return true
  return false
}

// Given an element, find the nearest heading walking up + back through the DOM
function findNearestHeading(el) {
  // 1. Walk backwards through siblings
  let prev = el.previousElementSibling
  while (prev) {
    if (/^h[1-6]$/i.test(prev.tagName)) return prev.textContent.trim()
    // If sibling is a container, check its LAST heading child
    const inner = prev.querySelector('h1,h2,h3,h4,h5,h6')
    if (inner) return inner.textContent.trim()
    prev = prev.previousElementSibling
  }
  // 2. Walk up to parent and try again
  const parent = el.parentElement
  if (parent && parent !== document.body) {
    // Check headings inside parent before this element
    const siblings = [...parent.children]
    const idx = siblings.indexOf(el)
    for (let i = idx - 1; i >= 0; i--) {
      const s = siblings[i]
      if (/^h[1-6]$/i.test(s.tagName)) return s.textContent.trim()
      const inner = s.querySelector('h1,h2,h3,h4,h5,h6')
      if (inner) return inner.textContent.trim()
    }
    return findNearestHeading(parent)
  }
  return null
}

// Detects if a table is a non-exercise table (weekly split, progression, recovery etc.)
function isNonExerciseTable(table) {
  const headers = [...table.querySelectorAll('th')].map(h => h.textContent.toLowerCase().trim())
  const text = table.textContent.toLowerCase()
  // Progressive overload / weekly tables: has "week" column
  if (headers.some(h => h.includes('week'))) return true
  // Weekly split tables: has "day" and "muscle" or "focus" columns
  if (headers.some(h => h.includes('day')) && headers.some(h => h.includes('muscle') || h.includes('focus') || h.includes('group'))) return true
  // Recovery / sleep tables
  if (text.includes('sleep') || text.includes('recovery') || text.includes('deload')) return true
  // Very few rows = likely a summary table, not exercise list
  const rows = [...table.querySelectorAll('tbody tr')]
  if (rows.length <= 2 && !headers.some(h => h.includes('exercise'))) return true
  return false
}

function parseTrainingPlan(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result = { meta: {}, days: [], extras: [] }

  const allTables = [...doc.querySelectorAll('table')]

  // Helper: clean a raw heading into a display title
  function cleanTitle(raw) {
    return raw
      .replace(/^day\s*\d+\s*[-–:]+\s*/i, '')    // "Day 1 – Upper Body" → "Upper Body"
      .replace(/^workout\s*\d*\s*[-–:]+\s*/i, '') // "Workout 1 – Push" → "Push"
      .replace(/^session\s*\d*\s*[-–:]+\s*/i, '') // "Session 1 – Legs" → "Legs"
      .trim() || raw.trim()
  }

  // ── Pass 1: scan all headings + tables in document order ──
  const elements = [...doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,table')]
  let currentDay = null

  elements.forEach(el => {
    const tag = el.tagName.toLowerCase()
    const text = el.textContent.trim()

    if (/^h[1-6]$/.test(tag)) {
      if (isDayHeading(text)) {
        const title = cleanTitle(text)
        currentDay = { title, exercises: [] }
        result.days.push(currentDay)
      } else if (/progress|recover|sleep|nutrition|warm.?up|cool.?down|guideline|protocol|overview|split/i.test(text)) {
        currentDay = null
      }
      return
    }

    if (tag === 'table' && currentDay) {
      if (isNonExerciseTable(el)) return
      const headers = [...el.querySelectorAll('th')].map(h => h.textContent.toLowerCase().trim())
      const isExTable = headers.some(h => h.includes('exercise') || h.includes('set') || h.includes('rep'))
      if (!isExTable) return
      el.querySelectorAll('tbody tr').forEach(row => {
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (!cells[0]) return
        if (/^(total|warm.?up|cool.?down|stretch|mobility)/i.test(cells[0])) return
        currentDay.exercises.push({ name: cells[0], sets: cells[1]||'', reps: cells[2]||'', rest: cells[3]||'', notes: cells[4]||'' })
      })
    }
  })

  // ── Pass 2: fallback — use findNearestHeading for each exercise table ──
  if (result.days.length === 0) {
    allTables.forEach(table => {
      if (isNonExerciseTable(table)) return
      const headers = [...table.querySelectorAll('th')].map(h => h.textContent.toLowerCase().trim())
      const isExTable = headers.some(h => h.includes('exercise') || h.includes('set') || h.includes('rep'))
      if (!isExTable) return

      const rawHeading = findNearestHeading(table)
      if (!rawHeading) return
      if (/progress|recover|sleep|nutrition|overview|split|guideline|protocol/i.test(rawHeading)) return

      const title = cleanTitle(rawHeading)
      const exercises = []
      table.querySelectorAll('tbody tr').forEach(row => {
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (!cells[0]) return
        if (/^(total|warm.?up|cool.?down|stretch|mobility)/i.test(cells[0])) return
        exercises.push({ name: cells[0], sets: cells[1]||'', reps: cells[2]||'', rest: cells[3]||'', notes: cells[4]||'' })
      })
      if (exercises.length === 0) return

      // Merge into existing day with same title, or create new
      const existing = result.days.find(d => d.title === title)
      if (existing) {
        existing.exercises.push(...exercises)
      } else {
        result.days.push({ title, exercises })
      }
    })
  }

  // ── Number duplicate titles (e.g. 3× "Workout" → "Workout 1/2/3") ──
  const titleCount = {}
  result.days.forEach(d => { titleCount[d.title] = (titleCount[d.title] || 0) + 1 })
  const titleSeen = {}
  result.days.forEach(d => {
    if (titleCount[d.title] > 1) {
      titleSeen[d.title] = (titleSeen[d.title] || 0) + 1
      d.title = d.title + ' ' + titleSeen[d.title]
    }
  })

  return result
}

function parseNutritionPlan(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result = { intro: '', meals: [] }

  // Extract coaching intro — must be a real sentence paragraph, not table text
  const allEls = [...doc.body.querySelectorAll('p, div')]
  for (const el of allEls) {
    if (el.querySelector('table, h1, h2, h3, h4, h5, h6')) continue
    const txt = el.textContent.trim()
    if (txt.length < 60 || txt.length > 600) continue
    if (/\d{3,}\s*\d{2,}/.test(txt)) continue
    if (/Food Item|Amount \(g\)|Calories|Protein \(g\)/i.test(txt)) continue
    if (txt.split(' ').length < 8) continue
    result.intro = txt
    break
  }

  // Walk all elements in order to build meal + option structure
  const elements = [...doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,table,p')]
  let currentMeal = null
  let currentOption = null

  function isMealHeading(text) {
    return /breakfast|lunch|dinner|snack|pre.?workout|post.?workout|meal\s*\d/i.test(text)
  }
  function isOptionHeading(text) {
    return /option\s*[abc1-3]|simple|standard|exciting|quick|classic|advanced|variation/i.test(text)
  }
  function isSummaryHeading(text) {
    return /daily total|nutrition summary|total summary|daily summary|overview/i.test(text)
  }

  function saveOption() {
    if (currentOption && currentOption.items.length > 0 && currentMeal) {
      currentMeal.options.push(currentOption)
    }
    currentOption = null
  }
  function saveMeal() {
    saveOption()
    if (currentMeal && currentMeal.options.length > 0) {
      result.meals.push(currentMeal)
    }
    currentMeal = null
  }

  elements.forEach(el => {
    const tag = el.tagName.toLowerCase()
    const text = el.textContent.trim()

    if (/^h[1-6]$/.test(tag)) {
      if (isSummaryHeading(text)) { saveMeal(); return }

      if (isMealHeading(text) && !isOptionHeading(text)) {
        saveMeal()
        const cleanTitle = text.replace(/^meal\s*\d+\s*[-\u2013:]+\s*/i, '').trim() || text
        currentMeal = { title: cleanTitle, purposeNote: '', options: [] }
        return
      }

      if (isOptionHeading(text) && currentMeal) {
        saveOption()
        const labelMatch = text.match(/option\s*[abc1-3]\s*[-\u2013:]+\s*(.+)/i)
        const label = labelMatch ? labelMatch[1].trim() : text.replace(/^option\s*[abc1-3]\s*/i, '').trim() || text
        currentOption = { label, items: [], totals: null }
        return
      }
      return
    }

    if (tag === 'p' && currentMeal && !currentOption) {
      if (text.length > 10 && text.length < 300) currentMeal.purposeNote = text
      return
    }

    if (tag === 'table') {
      if (!currentMeal) return

      // Detect meal table — check th headers OR first row td content
      const thHeaders = [...el.querySelectorAll('th')].map(h => h.textContent.toLowerCase())
      const firstRowTds = [...el.querySelectorAll('tr:first-child td')].map(c => c.textContent.toLowerCase())
      const allHeaders = [...thHeaders, ...firstRowTds]
      const isMealTable = allHeaders.some(h =>
        h.includes('food') || h.includes('calor') || h.includes('protein') ||
        h.includes('amount') || h.includes('carb') || h.includes('fat')
      )
      // Also accept tables with no headers at all if inside a meal context (model skipped headers)
      const hasNoHeaders = thHeaders.length === 0
      const looksLikeFoodTable = hasNoHeaders && el.querySelectorAll('tr').length >= 2

      if (!isMealTable && !looksLikeFoodTable) return

      if (!currentOption) {
        currentOption = { label: 'Option A', items: [], totals: null }
      }

      // Skip the header row if it contains th-like content in tds
      let skipFirst = false
      if (thHeaders.length === 0 && firstRowTds.some(h =>
        h.includes('food') || h.includes('calor') || h.includes('protein') || h.includes('amount')
      )) {
        skipFirst = true
      }

      const allRows = [...el.querySelectorAll('tr')]
      allRows.forEach((row, rowIdx) => {
        if (skipFirst && rowIdx === 0) return
        // skip th rows
        if (row.querySelector('th')) return
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (cells.length < 2 || !cells[0]) return
        if (/^total/i.test(cells[0])) {
          currentOption.totals = { kcal: cells[2]||cells[1]||'', protein: cells[3]||'', carbs: cells[4]||'', fats: cells[5]||'' }
          return
        }
        if (/^daily|^supplement|^hydration|^grocery/i.test(cells[0])) return
        // cells[1] should be a number (amount in g) — skip non-food rows
        if (cells[1] && isNaN(parseFloat(cells[1])) && cells[1].length > 6) return
        currentOption.items.push({ food: cells[0], amount: cells[1]||'', kcal: cells[2]||'', protein: cells[3]||'', carbs: cells[4]||'', fats: cells[5]||'' })
      })
    }
  })

  saveMeal()
  return result
}


// ── EXTRACT DAILY MACRO TARGETS FROM PARSED NUTRITION PLAN ───────────────────
function getDailyTargets(parsedPlan) {
  if (!parsedPlan?.meals?.length) return null
  let kcal = 0, protein = 0, carbs = 0, fats = 0
  parsedPlan.meals.forEach(meal => {
    // Use first option only to avoid multiplying by number of options
    const totals = meal.options?.[0]?.totals || meal.totals
    if (!totals) return
    kcal    += parseFloat(totals.kcal)    || 0
    protein += parseFloat(totals.protein) || 0
    carbs   += parseFloat(totals.carbs)   || 0
    fats    += parseFloat(totals.fats)    || 0
  })
  if (kcal === 0) return null
  return {
    kcal:    Math.round(kcal),
    protein: Math.round(protein),
    carbs:   Math.round(carbs),
    fats:    Math.round(fats),
  }
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PlanView() {
  const { slug } = useParams()
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('plan')
  const [images, setImages] = useState({})
  const [toast, setToast] = useState('')
  const [swapModal, setSwapModal] = useState(null)
  const [addModal, setAddModal] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [parsedPlan, setParsedPlan] = useState(null)

  async function unlock() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/plans?slug=eq.${slug}&select=*`, { headers: HEADERS })
      const data = await res.json()
      if (!data?.length) { setError('Plan not found.'); setLoading(false); return }
      const p = data[0]
      if (p.password !== password) { setError('Incorrect password. Please check your email.'); setLoading(false); return }
      setPlan(p)
      setUnlocked(true)
      const parsed = p.plan_type === 'nutrition' ? parseNutritionPlan(p.html_content) : parseTrainingPlan(p.html_content)
      setParsedPlan(parsed)
      setTimeout(() => fetchImages(p.html_content, parsed), 100)
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  async function fetchImages(html, parsed) {
    const names = new Set()
    if (parsed?.days) {
      parsed.days.forEach(day => day.exercises.forEach(ex => names.add(ex.name.toLowerCase().trim())))
    } else {
      // fallback: parse from HTML
      const doc = new DOMParser().parseFromString(html, 'text/html')
      doc.querySelectorAll('table').forEach(table => {
        const headers = [...table.querySelectorAll('th')].map(h => h.textContent.toLowerCase())
        if (!headers.some(h => h.includes('set') || h.includes('rep'))) return
        table.querySelectorAll('tbody tr td:first-child').forEach(cell => {
          const t = cell.textContent.trim()
          if (t && t.length > 2 && t.length < 50 && !/^\d/.test(t) && !/^total/i.test(t)) names.add(t.toLowerCase())
        })
      })
    }

    const fetched = {}
    for (const name of names) {
      try {
        const res = await fetch(EXERCISE_GIF_URL, {
          method: 'POST',
          headers: { ...HEADERS },
          body: JSON.stringify({ name }),
        })
        const data = await res.json()
        if (data.gifUrl) fetched[name] = data.gifUrl
      } catch {}
    }
    setImages(fetched)
  }

  function getImage(name) {
    if (!name) return null
    const lower = name.toLowerCase().trim()
    if (images[lower]) return images[lower]
    const norm = lower.replace(/s$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
    const entries = Object.entries(images)
    return (
      images[norm] ||
      entries.find(([k]) => k.replace(/s$/, '').replace(/-/g,' ') === norm)?.[1] ||
      entries.find(([k]) => lower.includes(k) || k.includes(lower))?.[1] ||
      entries.find(([k]) => norm.split(' ')[0].length > 3 && k.includes(norm.split(' ')[0]))?.[1] ||
      null
    )
  }

  function extractExercises(html) {
    if (!parsedPlan?.days) return []
    const names = new Set()
    parsedPlan.days.forEach(day => day.exercises.forEach(ex => names.add(ex.name)))
    return [...names]
  }

  async function savePlan(html) {
    await fetch(`${SUPABASE_URL}/rest/v1/plans?slug=eq.${slug}`, {
      method: 'PATCH',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ html_content: html }),
    })
    setPlan(prev => ({ ...prev, html_content: html }))
    const parsed = plan?.plan_type === 'nutrition' ? parseNutritionPlan(html) : parseTrainingPlan(html)
    setParsedPlan(parsed)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function openSwap(exercise) {
    setSwapModal({ item: exercise.name, newName: '', sets: exercise.sets, reps: exercise.reps, rest: exercise.rest })
    setSuggestions([]); setLoadingSuggestions(true)
    try {
      const res = await fetch(PLAN_CHAT_URL, { method: 'POST', headers: { ...HEADERS },
        body: JSON.stringify({ slug, message: `Suggest 3 alternative exercises for ${exercise.name}. Reply with only the 3 exercise names, comma separated.`, history: [] }) })
      const data = await res.json()
      setSuggestions(data.reply?.split(',').map(s => s.trim()).filter(Boolean) || [])
    } catch {}
    setLoadingSuggestions(false)
  }

  async function applySwap() {
    if (!swapModal?.newName) return
    const updated = plan.html_content.replace(
      new RegExp(swapModal.item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      swapModal.newName
    )
    await savePlan(updated)
    setSwapModal(null); showToast('Swapped ✓')
    setTimeout(() => fetchImages(updated, parseTrainingPlan(updated)), 200)
  }

  async function openAdd(dayTitle) {
    setAddModal({ day: dayTitle, name: '', sets: '3', reps: '8-12', rest: '90s', notes: '' })
    setSuggestions([]); setLoadingSuggestions(true)
    try {
      const res = await fetch(PLAN_CHAT_URL, { method: 'POST', headers: { ...HEADERS },
        body: JSON.stringify({ slug, message: `Suggest 3 exercises for ${dayTitle}. Reply with only the 3 exercise names, comma separated.`, history: [] }) })
      const data = await res.json()
      setSuggestions(data.reply?.split(',').map(s => s.trim()).filter(Boolean) || [])
    } catch {}
    setLoadingSuggestions(false)
  }

  async function applyAdd() {
    if (!addModal?.name) return
    const newRow = `<tr><td>${addModal.name}</td><td>${addModal.sets}</td><td>${addModal.reps}</td><td>${addModal.rest}</td><td>${addModal.notes}</td></tr>`
    const dayPattern = new RegExp(`(${addModal.day.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*(?:<[^>]*>)*.*?</table>)`, 'si')
    const updated = plan.html_content.replace(dayPattern, m => m.replace('</table>', newRow + '</table>'))
    await savePlan(updated); setAddModal(null); showToast('Exercise added ✓')
    setTimeout(() => fetchImages(updated, parseTrainingPlan(updated)), 200)
  }

  async function removeItem(name) {
    const rowPattern = new RegExp(`<tr[^>]*>\\s*<td[^>]*>\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</td>[\\s\\S]*?</tr>`, 'gi')
    const updated = plan.html_content.replace(rowPattern, '')
    await savePlan(updated); setConfirmRemove(null); showToast('Removed ✓')
  }

  const isNutrition = plan?.plan_type === 'nutrition'

  if (!unlocked) return (
    <div className={styles.lockPage}>
      <div className={styles.lockCard}>
        <img src="/logo.png" alt="Precision Training" className={styles.lockLogo} />
        <h1>Your Plan is Ready</h1>
        <p>Enter the password from your email to access your personalized plan.</p>
        <input className={styles.lockInput} type="password" placeholder="Enter your password"
          value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && unlock()} />
        {error && <div className={styles.lockError}>{error}</div>}
        <button className={styles.lockBtn} onClick={unlock} disabled={loading}>
          {loading ? 'Loading…' : 'View My Plan →'}
        </button>
        <Link to="/" className={styles.lockBack}>← Back to Precision Training</Link>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}><span className={styles.gold}>Precision</span> Training</Link>
        <h1 className={styles.planTitle}>{isNutrition ? 'Your Personal Nutrition Plan' : 'Your Personal Training Plan'}</h1>
      </header>

      <div className={styles.tabs}>
        {['plan','tracker','coach'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'plan' ? 'My Plan' : t === 'tracker' ? 'Progress Tracker' : 'AI Coach'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {tab === 'plan' && parsedPlan && (
          isNutrition
            ? <NutritionView parsed={parsedPlan} />
            : <TrainingView parsed={parsedPlan} images={images} getImage={getImage}
                onSwap={openSwap} onAdd={openAdd} onRemove={name => setConfirmRemove(name)} />
        )}
        {tab === 'tracker' && (
          isNutrition
            ? <MacroTracker slug={slug} dailyTargets={getDailyTargets(parsedPlan)} />
            : <ProgressTracker slug={slug} exercises={extractExercises(plan?.html_content)} />
        )}
        {tab === 'coach' && <AICoach slug={slug} isNutrition={isNutrition} />}
      </div>

      {/* SWAP MODAL */}
      {swapModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSwapModal(null)}>
          <div className="modal">
            <h3>Swap "{swapModal.item}"</h3>
            <div className="modal-label">Replace with</div>
            <input className="modal-input" value={swapModal.newName}
              onChange={e => setSwapModal(p => ({ ...p, newName: e.target.value }))} placeholder="e.g. Dumbbell Press" />
            {loadingSuggestions && <div style={{color:'var(--gray)',fontSize:12,marginBottom:8}}>Loading suggestions…</div>}
            {suggestions.length > 0 && (
              <div className="suggestion-chips">
                {suggestions.map(s => <button key={s} className="chip" onClick={() => setSwapModal(p => ({ ...p, newName: s }))}>{s}</button>)}
              </div>
            )}
            <div className="modal-row">
              {[['Sets','sets'],['Reps','reps'],['Rest','rest']].map(([label,key]) => (
                <div key={key}>
                  <div className="modal-label">{label}</div>
                  <input className="modal-input" value={swapModal[key]} onChange={e => setSwapModal(p => ({ ...p, [key]: e.target.value }))} placeholder={label} style={{marginBottom:0}} />
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSwapModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={applySwap}>Apply Swap</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {addModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(null)}>
          <div className="modal">
            <h3>Add Exercise to {addModal.day}</h3>
            <div className="modal-label">Exercise name</div>
            <input className="modal-input" value={addModal.name}
              onChange={e => setAddModal(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cable Fly" />
            {loadingSuggestions && <div style={{color:'var(--gray)',fontSize:12,marginBottom:8}}>Loading suggestions…</div>}
            {suggestions.length > 0 && (
              <div className="suggestion-chips">
                {suggestions.map(s => <button key={s} className="chip" onClick={() => setAddModal(p => ({ ...p, name: s }))}>{s}</button>)}
              </div>
            )}
            <div className="modal-row">
              {[['Sets','sets','3'],['Reps','reps','8-12'],['Rest','rest','90s']].map(([label,key,ph]) => (
                <div key={key}>
                  <div className="modal-label">{label}</div>
                  <input className="modal-input" value={addModal[key]} onChange={e => setAddModal(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{marginBottom:0}} />
                </div>
              ))}
            </div>
            <div className="modal-label">Notes (optional)</div>
            <input className="modal-input" value={addModal.notes} onChange={e => setAddModal(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Focus on form" />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={applyAdd}>Add Exercise</button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE CONFIRM */}
      {confirmRemove && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmRemove(null)}>
          <div className="modal">
            <h3>Remove "{confirmRemove}"?</h3>
            <p style={{color:'var(--gray)',fontSize:14,marginBottom:16}}>This will permanently remove it from your plan.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmRemove(null)}>Cancel</button>
              <button className="btn-confirm" style={{background:'#ef4444'}} onClick={() => removeItem(confirmRemove)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}


// ── EXERCISE FALLBACK IMAGE ───────────────────────────────────────────────────
const FALLBACK_IMAGES = {
  chest:     'https://upload.wikimedia.org/wikipedia/commons/1/1a/Push-ups-2.png',
  back:      'https://upload.wikimedia.org/wikipedia/commons/b/bd/Chin-ups-1.png',
  shoulders: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Dumbbell-shoulder-press-2.png',
  biceps:    'https://upload.wikimedia.org/wikipedia/commons/f/fd/Dumbbell-lateral-raises-1.png',
  triceps:   'https://upload.wikimedia.org/wikipedia/commons/0/05/Triceps-pushdown-2.gif',
  legs:      'https://upload.wikimedia.org/wikipedia/commons/8/8e/Lunges-2-2.png',
  core:      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Decline-sit-up-2.png',
  general:   'https://upload.wikimedia.org/wikipedia/commons/1/1a/Push-ups-2.png',
}

function getMuscleGroup(name) {
  const n = name.toLowerCase()
  if (/chest|bench|fly|flies|flyes|push.?up|pec/.test(n)) return 'chest'
  if (/back|row|pull|lat|deadlift|rdl|hyperext|good.?morn/.test(n)) return 'back'
  if (/shoulder|press|delt|lateral|front.?raise|shrug|upright/.test(n)) return 'shoulders'
  if (/bicep|curl|hammer|chin/.test(n)) return 'biceps'
  if (/tricep|pushdown|skull|kickback|dips|extension/.test(n)) return 'triceps'
  if (/squat|lunge|leg.?press|calf|glute|hip.?thrust|step.?up|leg.?curl|leg.?ext|burpee/.test(n)) return 'legs'
  if (/crunch|plank|core|ab |sit.?up|russian|oblique|side.?bend|mountain|climber/.test(n)) return 'core'
  return 'general'
}

function ExerciseFallback({ name }) {
  const src = FALLBACK_IMAGES[getMuscleGroup(name)]
  return (
    <div style={{ width:'100%', height:'100%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <img src={src} alt={name} style={{ width:'90%', height:'90%', objectFit:'contain' }} />
    </div>
  )
}
// ── TRAINING VIEW ─────────────────────────────────────────────────────────────
function TrainingView({ parsed, images, getImage, onSwap, onAdd, onRemove }) {
  const [activeDay, setActiveDay] = useState(0)
  const days = parsed.days || []
  if (!days.length) return <div className={styles.empty}>No workout data found in this plan.</div>

  const day = days[activeDay]

  return (
    <div className={styles.trainingView}>
      {/* Day selector */}
      <div className={styles.dayTabs}>
        {days.map((d, i) => {
          // Title is already cleaned by parser (e.g. "Upper Body", "Push Day", "Chest & Triceps")
          // For tab label: use first 2 words max to keep tabs compact
          const words = d.title.split(' ')
          const label = words.length > 2 ? words[0] + ' ' + words[1] : d.title
          const sub = words.length > 2 ? words.slice(2).join(' ') : ''
          return (
            <button key={i} className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`}
              onClick={() => setActiveDay(i)}>
              <span className={styles.dayTabLabel}>{label}</span>
              {sub && <span className={styles.dayTabSub}>{sub}</span>}
            </button>
          )
        })}
      </div>

      {/* Active day */}
      <div className={styles.dayContent}>
        <div className={styles.dayHeader}>
          <h2 className={styles.dayTitle}>{day.title}</h2>
          <span className={styles.dayCount}>{day.exercises.length} exercises</span>
        </div>

        <div className={styles.exerciseList}>
          {day.exercises.map((ex, i) => {
            const img = getImage(ex.name)
            return (
              <div key={i} className={styles.exerciseCard}>
                <div className={styles.exerciseNum}>{String(i + 1).padStart(2, '0')}</div>
                <div className={styles.exerciseImg}>
                  {img
                    ? <img src={img} alt={ex.name} className={styles.exImg} onError={e => e.target.style.display='none'} />
                    : <div className={styles.exImgPlaceholder}><ExerciseFallback name={ex.name} /></div>
                  }
                </div>
                <div className={styles.exerciseInfo}>
                  <div className={styles.exerciseName}>{ex.name}</div>
                  {ex.notes && <div className={styles.exerciseNotes}>{ex.notes}</div>}
                  <div className={styles.exerciseMeta}>
                    {ex.sets && <span className={styles.metaTag}><span className={styles.metaKey}>Sets</span>{ex.sets}</span>}
                    {ex.reps && <span className={styles.metaTag}><span className={styles.metaKey}>Reps</span>{ex.reps}</span>}
                    {ex.rest && <span className={styles.metaTag}><span className={styles.metaKey}>Rest</span>{ex.rest}</span>}
                  </div>
                </div>
                <div className={styles.exerciseActions}>
                  <button className={styles.actionBtn} onClick={() => onSwap(ex)} title="Swap exercise">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </button>
                  <button className={styles.actionBtn} style={{color:'#e05555'}} onClick={() => onRemove(ex.name)} title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button className={styles.addExBtn} onClick={() => onAdd(day.title)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Exercise
        </button>
      </div>
    </div>
  )
}

// ── NUTRITION VIEW ────────────────────────────────────────────────────────────
function NutritionView({ parsed }) {
  const [activeMeal, setActiveMeal] = useState(0)
  const [activeOption, setActiveOption] = useState(0)
  const meals = parsed.meals || []
  if (!meals.length) return <div className={styles.empty}>No nutrition data found in this plan.</div>

  const meal = meals[activeMeal]
  const options = meal.options || []
  const option = options[Math.min(activeOption, options.length - 1)] || options[0]

  function shortLabel(title) {
    const clean = title.replace(/^meal\s*\d*\s*[-\u2013:]*\s*/i, '').trim()
    return clean.split(/[-\u2013:]/)[0].trim() || title
  }

  const OPTION_COLORS = ['#c8a96e', '#6e9dc8', '#7ec87e']
  const OPTION_BG    = ['rgba(200,169,110,0.12)', 'rgba(110,157,200,0.12)', 'rgba(126,200,126,0.12)']

  return (
    <div className={styles.trainingView}>
      {parsed.intro && (
        <div className={styles.coachingIntro}>
          <div className={styles.coachingIntroIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className={styles.coachingIntroText}>{parsed.intro}</p>
        </div>
      )}

      {/* Meal tabs */}
      <div className={styles.dayTabs}>
        {meals.map((m, i) => (
          <button key={i}
            className={`${styles.dayTab} ${activeMeal === i ? styles.dayTabActive : ''}`}
            onClick={() => { setActiveMeal(i); setActiveOption(0) }}>
            <span className={styles.dayTabLabel}>{shortLabel(m.title)}</span>
          </button>
        ))}
      </div>

      <div className={styles.dayContent}>
        {/* Meal header */}
        <div className={styles.dayHeader}>
          <h2 className={styles.dayTitle}>{meal.title}</h2>
          {option && <span className={styles.dayCount}>{option.items.length} items</span>}
        </div>

        {meal.purposeNote && (
          <div className={styles.mealPurpose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>{meal.purposeNote}</span>
          </div>
        )}

        {/* Option selector */}
        {options.length > 1 && (
          <div className={styles.optionRow}>
            <span className={styles.optionLabel}>Choose your option:</span>
            <div className={styles.optionBtns}>
              {options.map((opt, i) => (
                <button key={i}
                  className={styles.optionBtn}
                  style={{
                    borderColor: activeOption === i ? OPTION_COLORS[i % OPTION_COLORS.length] : 'var(--border)',
                    background:  activeOption === i ? OPTION_BG[i % OPTION_BG.length] : 'transparent',
                    color:       activeOption === i ? OPTION_COLORS[i % OPTION_COLORS.length] : 'var(--gray)',
                  }}
                  onClick={() => setActiveOption(i)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Food items */}
        {option && (
          <>
            <div className={styles.nutritionList}>
              {option.items.map((item, i) => (
                <div key={i} className={styles.nutritionCard}>
                  <div className={styles.nutritionNum}>{String(i + 1).padStart(2, '0')}</div>
                  <div className={styles.nutritionInfo}>
                    <div className={styles.exerciseName}>{item.food}</div>
                    <div className={styles.exerciseMeta}>
                      {item.amount && <span className={styles.metaTag}><span className={styles.metaKey}>Amount</span>{item.amount}</span>}
                      {item.kcal && <span className={styles.metaTag}><span className={styles.metaKey}>kcal</span>{item.kcal}</span>}
                      {item.protein && <span className={styles.metaTag}><span className={styles.metaKey}>Protein</span>{item.protein}</span>}
                      {item.carbs && <span className={styles.metaTag}><span className={styles.metaKey}>Carbs</span>{item.carbs}</span>}
                      {item.fats && <span className={styles.metaTag}><span className={styles.metaKey}>Fats</span>{item.fats}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {option.totals && (
              <div className={styles.mealTotalBar}>
                <div className={styles.mealTotalLeft}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <span>Meal Total</span>
                </div>
                <div className={styles.mealTotalMacros}>
                  {option.totals.kcal && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.kcal}</span><span className={styles.mealTotalKey}>kcal</span></div>}
                  {option.totals.protein && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.protein}</span><span className={styles.mealTotalKey}>protein</span></div>}
                  {option.totals.carbs && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.carbs}</span><span className={styles.mealTotalKey}>carbs</span></div>}
                  {option.totals.fats && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.fats}</span><span className={styles.mealTotalKey}>fats</span></div>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
