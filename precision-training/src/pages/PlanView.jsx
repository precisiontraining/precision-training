import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProgressTracker from '../components/ProgressTracker'
import AICoach from '../components/AICoach'
import { SUPABASE_URL, SUPABASE_ANON_KEY, EXERCISE_GIF_URL, PLAN_CHAT_URL, DAYS } from '../constants'
import styles from './PlanView.module.css'

const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }

// ── PARSE AI HTML → STRUCTURED DATA ──────────────────────────────────────────
function parseTrainingPlan(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result = { meta: {}, days: [], extras: [] }

  // Extract meta info from first table (weekly split)
  const allTables = [...doc.querySelectorAll('table')]
  
  // Find day sections by looking for headings + tables
  const body = doc.body
  const elements = [...body.querySelectorAll('h1,h2,h3,h4,h5,table,p,ul,li')]

  let currentDay = null
  let inDailySection = false

  elements.forEach(el => {
    const tag = el.tagName.toLowerCase()
    const text = el.textContent.trim()

    if ((tag === 'h2' || tag === 'h3') && DAYS.some(d => text.toLowerCase().includes(d.toLowerCase()))) {
      currentDay = { title: text, exercises: [] }
      result.days.push(currentDay)
      inDailySection = true
      return
    }

    if (tag === 'table' && currentDay) {
      const headers = [...el.querySelectorAll('th')].map(h => h.textContent.toLowerCase().trim())
      const isExTable = headers.some(h => h.includes('set') || h.includes('rep') || h.includes('exercise'))
      if (!isExTable) return
      el.querySelectorAll('tbody tr').forEach(row => {
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (!cells[0] || cells[0].toLowerCase() === 'total') return
        currentDay.exercises.push({
          name: cells[0],
          sets: cells[1] || '',
          reps: cells[2] || '',
          rest: cells[3] || '',
          notes: cells[4] || '',
        })
      })
    }
  })

  // If no days found, try different structure (tables only)
  if (result.days.length === 0) {
    allTables.forEach(table => {
      const headers = [...table.querySelectorAll('th')].map(h => h.textContent.toLowerCase())
      const isExTable = headers.some(h => h.includes('set') || h.includes('rep'))
      if (!isExTable) return
      
      // Find preceding heading
      let prev = table.previousElementSibling
      let dayTitle = 'Workout'
      while (prev) {
        if (/h[1-6]/i.test(prev.tagName)) { dayTitle = prev.textContent.trim(); break }
        prev = prev.previousElementSibling
      }

      const day = { title: dayTitle, exercises: [] }
      table.querySelectorAll('tbody tr').forEach(row => {
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (!cells[0] || /^total/i.test(cells[0])) return
        day.exercises.push({ name: cells[0], sets: cells[1]||'', reps: cells[2]||'', rest: cells[3]||'', notes: cells[4]||'' })
      })
      if (day.exercises.length > 0) result.days.push(day)
    })
  }

  return result
}

function parseNutritionPlan(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result = { meals: [], totals: null }

  const allTables = [...doc.querySelectorAll('table')]
  allTables.forEach(table => {
    const headers = [...table.querySelectorAll('th')].map(h => h.textContent.toLowerCase())
    const isMealTable = headers.some(h => h.includes('food') || h.includes('calor') || h.includes('protein') || h.includes('amount'))
    if (!isMealTable) return

    let prev = table.previousElementSibling
    let mealTitle = 'Meal'
    while (prev) {
      if (/h[1-6]/i.test(prev.tagName)) { mealTitle = prev.textContent.trim(); break }
      prev = prev.previousElementSibling
    }

    const items = []
    let totals = null
    table.querySelectorAll('tbody tr, tfoot tr').forEach(row => {
      const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
      if (!cells[0]) return
      if (/^total/i.test(cells[0])) {
        totals = { kcal: cells[2]||cells[1]||'', protein: cells[3]||'', carbs: cells[4]||'', fats: cells[5]||'' }
        return
      }
      items.push({ food: cells[0], amount: cells[1]||'', kcal: cells[2]||'', protein: cells[3]||'', carbs: cells[4]||'', fats: cells[5]||'' })
    })
    if (items.length > 0) result.meals.push({ title: mealTitle, items, totals })
  })

  return result
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
    setTimeout(() => fetchImages(updated, parsedPlan), 200)
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
    setTimeout(() => fetchImages(updated, parsedPlan), 200)
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
        {tab === 'tracker' && <ProgressTracker slug={slug} exercises={extractExercises(plan?.html_content)} />}
        {tab === 'coach' && <AICoach slug={slug} />}
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
          const dayName = d.title.split(/[-–]/)[0].trim().split(' ').slice(-1)[0]
          return (
            <button key={i} className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`}
              onClick={() => setActiveDay(i)}>
              <span className={styles.dayTabLabel}>{dayName}</span>
              <span className={styles.dayTabSub}>{d.title.includes('-') || d.title.includes('–') ? d.title.split(/[-–]/)[1]?.trim() : ''}</span>
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
                    : <div className={styles.exImgPlaceholder}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>
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
  const meals = parsed.meals || []
  if (!meals.length) return <div className={styles.empty}>No nutrition data found in this plan.</div>

  const meal = meals[activeMeal]

  return (
    <div className={styles.trainingView}>
      <div className={styles.dayTabs}>
        {meals.map((m, i) => (
          <button key={i} className={`${styles.dayTab} ${activeMeal === i ? styles.dayTabActive : ''}`}
            onClick={() => setActiveMeal(i)}>
            <span className={styles.dayTabLabel}>{m.title.replace(/meal\s*/i, 'Meal ').split(':')[0]}</span>
            <span className={styles.dayTabSub}>{m.title.includes(':') ? m.title.split(':')[1]?.trim() : ''}</span>
          </button>
        ))}
      </div>

      <div className={styles.dayContent}>
        <div className={styles.dayHeader}>
          <h2 className={styles.dayTitle}>{meal.title}</h2>
          <span className={styles.dayCount}>{meal.items.length} items</span>
        </div>

        <div className={styles.nutritionList}>
          {meal.items.map((item, i) => (
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

        {meal.totals && (
          <div className={styles.mealTotals}>
            <span className={styles.totalsLabel}>Meal Total</span>
            <div className={styles.totalsMeta}>
              {meal.totals.kcal && <span className={styles.totalTag}><span>kcal</span>{meal.totals.kcal}</span>}
              {meal.totals.protein && <span className={styles.totalTag}><span>Protein</span>{meal.totals.protein}</span>}
              {meal.totals.carbs && <span className={styles.totalTag}><span>Carbs</span>{meal.totals.carbs}</span>}
              {meal.totals.fats && <span className={styles.totalTag}><span>Fats</span>{meal.totals.fats}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
