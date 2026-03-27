import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProgressTracker from '../components/ProgressTracker'
import AICoach from '../components/AICoach'
import { SUPABASE_URL, SUPABASE_ANON_KEY, EXERCISE_GIF_URL, PLAN_CHAT_URL, DAYS } from '../constants'
import styles from './PlanView.module.css'

const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }

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
  const planRef = useRef(null)

  async function unlock() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/plans?slug=eq.${slug}&select=*`, { headers: HEADERS })
      const data = await res.json()
      if (!data || data.length === 0) { setError('Plan not found.'); setLoading(false); return }
      const p = data[0]
      if (p.password !== password) { setError('Incorrect password. Please check your email.'); setLoading(false); return }
      setPlan(p)
      setUnlocked(true)
      setTimeout(() => fetchImages(p.html_content), 100)
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  async function fetchImages(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const exerciseNames = new Set()
    doc.querySelectorAll('td:first-child, .exercise-name').forEach(el => {
      const text = el.textContent.trim()
      if (text && !DAYS.some(d => text.toLowerCase().includes(d.toLowerCase())) && text.length > 2) {
        exerciseNames.add(text.toLowerCase())
      }
    })
    // Also extract from text patterns
    const textContent = doc.body.textContent
    const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 50)
    lines.forEach(line => {
      if (!DAYS.some(d => line.toLowerCase().startsWith(d.toLowerCase()))) {
        exerciseNames.add(line.toLowerCase())
      }
    })

    const fetched = {}
    for (const name of exerciseNames) {
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

  function extractExercises(html) {
    if (!html) return []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const names = new Set()
    doc.querySelectorAll('td, li, h3, h4').forEach(el => {
      const t = el.textContent.trim()
      if (t && !DAYS.some(d => t.toLowerCase() === d.toLowerCase()) && t.length > 2 && t.length < 60 && !/^\d/.test(t) && !/^total/i.test(t) && !/^meal/i.test(t) && !/^day/i.test(t)) {
        names.add(t)
      }
    })
    return [...names]
  }

  async function savePlan(html) {
    await fetch(`${SUPABASE_URL}/rest/v1/plans?slug=eq.${slug}`, {
      method: 'PATCH',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ html_content: html }),
    })
    setPlan(prev => ({ ...prev, html_content: html }))
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // SWAP MODAL
  async function openSwap(item, currentSets, currentReps, currentRest) {
    setSwapModal({ item, newName: '', sets: currentSets || '', reps: currentReps || '', rest: currentRest || '', calories: '', protein: '', carbs: '', fats: '', amount: '' })
    setSuggestions([])
    setLoadingSuggestions(true)
    const isNutrition = plan?.plan_type === 'nutrition'
    try {
      const res = await fetch(PLAN_CHAT_URL, {
        method: 'POST',
        headers: { ...HEADERS },
        body: JSON.stringify({
          slug,
          message: isNutrition
            ? `Suggest 3 alternative foods that have similar calories and macros to ${item}. Reply with only the 3 food names, comma separated, no explanation.`
            : `Suggest 3 alternative exercises for ${item}. Reply with only the 3 exercise names, comma separated, no explanation.`,
          history: [],
        }),
      })
      const data = await res.json()
      const suggs = data.reply?.split(',').map(s => s.trim()).filter(Boolean) || []
      setSuggestions(suggs)
    } catch {}
    setLoadingSuggestions(false)
  }

  async function applySwap() {
    if (!swapModal?.newName) return
    const html = plan.html_content
    const updated = html.replace(new RegExp(swapModal.item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), swapModal.newName)
    await savePlan(updated)
    setSwapModal(null)
    showToast('Swapped successfully ✓')
    setTimeout(() => fetchImages(updated), 200)
  }

  // ADD MODAL
  async function openAdd(dayName) {
    setAddModal({ day: dayName, name: '', sets: '3', reps: '8-12', rest: '90 sec', notes: '', calories: '', protein: '', carbs: '', fats: '', amount: '' })
    setSuggestions([])
    setLoadingSuggestions(true)
    const isNutrition = plan?.plan_type === 'nutrition'
    try {
      const res = await fetch(PLAN_CHAT_URL, {
        method: 'POST',
        headers: { ...HEADERS },
        body: JSON.stringify({
          slug,
          message: isNutrition
            ? `Suggest 3 foods that fit well in a ${dayName} meal for my nutrition plan. Reply with only the 3 food names, comma separated, no explanation.`
            : `Suggest 3 exercises that fit well with the other exercises on ${dayName} in my plan. Reply with only the 3 exercise names, comma separated, no explanation.`,
          history: [],
        }),
      })
      const data = await res.json()
      const suggs = data.reply?.split(',').map(s => s.trim()).filter(Boolean) || []
      setSuggestions(suggs)
    } catch {}
    setLoadingSuggestions(false)
  }

  async function applyAdd() {
    if (!addModal?.name) return
    const isNutrition = plan?.plan_type === 'nutrition'
    let newRow = ''
    if (isNutrition) {
      newRow = `<tr><td>${addModal.name}</td><td>${addModal.amount || '—'}</td><td>${addModal.calories || '—'}</td><td>${addModal.protein || '—'}</td><td>${addModal.carbs || '—'}</td><td>${addModal.fats || '—'}</td></tr>`
    } else {
      newRow = `<tr><td>${addModal.name}</td><td>${addModal.sets}</td><td>${addModal.reps}</td><td>${addModal.rest}</td><td>${addModal.notes}</td></tr>`
    }
    const dayPattern = new RegExp(`(${addModal.day}[^<]*<[^>]*>.*?</table>)`, 'si')
    const updated = plan.html_content.replace(dayPattern, m => m.replace('</table>', newRow + '</table>'))
    await savePlan(updated)
    setAddModal(null)
    showToast(isNutrition ? 'Food added ✓' : 'Exercise added ✓')
    setTimeout(() => fetchImages(updated), 200)
  }

  async function removeItem(item) {
    const rowPattern = new RegExp(`<tr[^>]*>\\s*<td[^>]*>\\s*${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</td>[^<]*(?:<td[^>]*>[^<]*</td>\\s*)*</tr>`, 'gi')
    const updated = plan.html_content.replace(rowPattern, '')
    await savePlan(updated)
    setConfirmRemove(null)
    showToast('Removed ✓')
  }

  const isNutrition = plan?.plan_type === 'nutrition'
  const planTitle = isNutrition ? 'Your Personal Nutrition Plan' : 'Your Personal Training Plan'

  if (!unlocked) {
    return (
      <div className={styles.lockPage}>
        <div className={styles.lockCard}>
          <div className={styles.lockIcon}>🔒</div>
          <h1>Your Plan is Ready</h1>
          <p>Enter the password from your email to access your personalized plan.</p>
          <input
            className={styles.lockInput}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
          />
          {error && <div className={styles.lockError}>{error}</div>}
          <button className={styles.lockBtn} onClick={unlock} disabled={loading}>
            {loading ? 'Loading…' : '👁 View My Plan'}
          </button>
          <Link to="/" className={styles.lockBack}>← Back to Precision Training</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <Link to="/" className={styles.logo}><span className={styles.gold}>Precision</span> Training</Link>
        <h1 className={styles.planTitle}>{planTitle}</h1>
      </header>

      {/* STATS BAR */}
      <div className={styles.statsBar}>
        {plan?.plan_type === 'training' && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>TYPE</span>
            <span className={styles.statValue}>Training</span>
          </div>
        )}
        {plan?.plan_type === 'nutrition' && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>TYPE</span>
            <span className={styles.statValue}>Nutrition</span>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'plan' ? styles.tabActive : ''}`} onClick={() => setTab('plan')}>My Plan</button>
        <button className={`${styles.tab} ${tab === 'tracker' ? styles.tabActive : ''}`} onClick={() => setTab('tracker')}>Progress Tracker</button>
        <button className={`${styles.tab} ${tab === 'coach' ? styles.tabActive : ''}`} onClick={() => setTab('coach')}>AI Coach</button>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {tab === 'plan' && (
          <PlanContent
            plan={plan}
            images={images}
            isNutrition={isNutrition}
            onSwap={openSwap}
            onAdd={openAdd}
            onRemove={name => setConfirmRemove(name)}
          />
        )}
        {tab === 'tracker' && (
          <ProgressTracker slug={slug} exercises={extractExercises(plan?.html_content)} />
        )}
        {tab === 'coach' && <AICoach slug={slug} />}
      </div>

      {/* SWAP MODAL */}
      {swapModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSwapModal(null)}>
          <div className="modal">
            <h3>Swap "{swapModal.item}"</h3>
            <div className="modal-label">Replace with</div>
            <input className="modal-input" value={swapModal.newName} onChange={e => setSwapModal(p => ({ ...p, newName: e.target.value }))} placeholder={isNutrition ? 'e.g. Brown Rice' : 'e.g. Dumbbell Press'} />
            {loadingSuggestions && <div style={{ color: 'var(--gray)', fontSize: 12, marginBottom: 8 }}>Loading suggestions…</div>}
            {suggestions.length > 0 && (
              <div className="suggestion-chips">
                {suggestions.map(s => <button key={s} className="chip" onClick={() => setSwapModal(p => ({ ...p, newName: s }))}>{s}</button>)}
              </div>
            )}
            {isNutrition ? (
              <div className="modal-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {[['Calories (kcal)', 'calories'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fats (g)', 'fats'], ['Amount (g)', 'amount']].map(([label, key]) => (
                  <div key={key}>
                    <div className="modal-label">{label}</div>
                    <input className="modal-input" type="number" value={swapModal[key]} onChange={e => setSwapModal(p => ({ ...p, [key]: e.target.value }))} placeholder="0" style={{ marginBottom: 0 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="modal-row">
                {[['Sets', 'sets'], ['Reps', 'reps'], ['Rest', 'rest']].map(([label, key]) => (
                  <div key={key}>
                    <div className="modal-label">{label}</div>
                    <input className="modal-input" value={swapModal[key]} onChange={e => setSwapModal(p => ({ ...p, [key]: e.target.value }))} placeholder={label} style={{ marginBottom: 0 }} />
                  </div>
                ))}
              </div>
            )}
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
            <h3>{isNutrition ? `Add Food to ${addModal.day}` : `Add Exercise to ${addModal.day}`}</h3>
            <div className="modal-label">{isNutrition ? 'Food name' : 'Exercise name'}</div>
            <input className="modal-input" value={addModal.name} onChange={e => setAddModal(p => ({ ...p, name: e.target.value }))} placeholder={isNutrition ? 'e.g. Avocado' : 'e.g. Cable Fly'} />
            {loadingSuggestions && <div style={{ color: 'var(--gray)', fontSize: 12, marginBottom: 8 }}>Loading suggestions…</div>}
            {suggestions.length > 0 && (
              <div className="suggestion-chips">
                {suggestions.map(s => <button key={s} className="chip" onClick={() => setAddModal(p => ({ ...p, name: s }))}>{s}</button>)}
              </div>
            )}
            {isNutrition ? (
              <div className="modal-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                {[['Amount (g)', 'amount'], ['Calories', 'calories'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fats (g)', 'fats']].map(([label, key]) => (
                  <div key={key}>
                    <div className="modal-label">{label}</div>
                    <input className="modal-input" type="number" value={addModal[key]} onChange={e => setAddModal(p => ({ ...p, [key]: e.target.value }))} placeholder="0" style={{ marginBottom: 0 }} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="modal-row">
                  {[['Sets', 'sets', '3'], ['Reps', 'reps', '8-12'], ['Rest', 'rest', '90 sec']].map(([label, key, ph]) => (
                    <div key={key}>
                      <div className="modal-label">{label}</div>
                      <input className="modal-input" value={addModal[key]} onChange={e => setAddModal(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{ marginBottom: 0 }} />
                    </div>
                  ))}
                </div>
                <div className="modal-label">Notes (optional)</div>
                <input className="modal-input" value={addModal.notes} onChange={e => setAddModal(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Focus on form" />
              </>
            )}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={applyAdd}>{isNutrition ? 'Add Food' : 'Add Exercise'}</button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE CONFIRM */}
      {confirmRemove && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmRemove(null)}>
          <div className="modal">
            <h3>Remove "{confirmRemove}"?</h3>
            <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 16 }}>This will permanently remove it from your plan.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmRemove(null)}>Cancel</button>
              <button className="btn-confirm" style={{ background: '#ef4444' }} onClick={() => removeItem(confirmRemove)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function PlanContent({ plan, images, isNutrition, onSwap, onAdd, onRemove }) {
  const [parsedDays, setParsedDays] = useState([])
  const [rawSections, setRawSections] = useState([])

  useEffect(() => {
    if (!plan?.html_content) return
    parseContent(plan.html_content)
  }, [plan?.html_content])

  function parseContent(html) {
    // Parse the HTML to extract structured data
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Try to find day sections - look for heading elements that contain day names or meal names
    const sections = []
    const allElements = doc.body.children

    // Just render the HTML directly with enhancement overlay
    setRawSections(html)
  }

  function getImageForExercise(name) {
    const lower = name.toLowerCase()
    return images[lower] || Object.entries(images).find(([k]) => k.includes(lower) || lower.includes(k))?.[1] || null
  }

  return (
    <div className={styles.planContent}>
      <EnhancedPlanRenderer 
        html={plan?.html_content || ''} 
        isNutrition={isNutrition}
        images={images}
        onSwap={onSwap}
        onAdd={onAdd}
        onRemove={onRemove}
        getImage={getImageForExercise}
      />
    </div>
  )
}

function EnhancedPlanRenderer({ html, isNutrition, images, onSwap, onAdd, onRemove, getImage }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !html) return
    containerRef.current.innerHTML = html
    enhanceContent()
  }, [html, images])

  function enhanceContent() {
    const container = containerRef.current
    if (!container) return

    // Add images to exercise rows
    const tables = container.querySelectorAll('table')
    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr')
      rows.forEach(row => {
        const firstCell = row.querySelector('td:first-child')
        if (!firstCell) return
        const exerciseName = firstCell.textContent.trim()
        if (!exerciseName || exerciseName.toLowerCase() === 'total') return
        if (DAYS.some(d => exerciseName.toLowerCase().startsWith(d.toLowerCase()))) return

        // Check if it's a nutrition table (has Food Item column)
        const headers = table.querySelectorAll('th')
        const isNutritionTable = [...headers].some(h => h.textContent.toLowerCase().includes('food') || h.textContent.toLowerCase().includes('calories'))

        if (!isNutritionTable) {
          // Exercise table - add image
          const img = getImage(exerciseName)
          if (img && !firstCell.querySelector('img')) {
            const imgWrap = document.createElement('div')
            imgWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;'
            const imgEl = document.createElement('img')
            imgEl.src = img
            imgEl.alt = exerciseName
            imgEl.style.cssText = 'width:100px;height:100px;object-fit:contain;background:#1a1a1a;border-radius:8px;'
            imgEl.onerror = () => imgEl.style.display = 'none'
            imgWrap.appendChild(imgEl)
            const nameEl = document.createElement('span')
            nameEl.textContent = exerciseName
            imgWrap.appendChild(nameEl)
            
            // Add swap button
            const swapBtn = addSwapBtn(exerciseName, row, isNutritionTable, imgWrap)
            
            firstCell.textContent = ''
            firstCell.appendChild(imgWrap)
          } else if (!firstCell.querySelector('.pt-swap-btn')) {
            addSwapBtn(exerciseName, row, isNutritionTable, firstCell)
          }
          
          // Add remove button to last cell
          addRemoveBtn(exerciseName, row)
        } else {
          // Nutrition table
          if (exerciseName.toLowerCase() === 'total') return
          if (!firstCell.querySelector('.pt-swap-btn')) {
            addSwapBtn(exerciseName, row, isNutritionTable, firstCell)
          }
          addRemoveBtn(exerciseName, row)
        }
      })

      // Add "Add" button after each table
      if (!table.nextElementSibling?.classList?.contains('pt-add-btn-wrap')) {
        const parent = table.parentElement
        const dayHeading = findPrecedingDayHeading(table)
        const addWrap = document.createElement('div')
        addWrap.className = 'pt-add-btn-wrap'
        addWrap.style.cssText = 'margin:12px 0 24px;'
        const addBtn = document.createElement('button')
        addBtn.textContent = isNutrition ? '+ Add Food' : '+ Add Exercise'
        addBtn.className = 'pt-add-btn'
        addBtn.style.cssText = `
          width:100%;padding:14px;
          border:1px dashed var(--gold);
          background:transparent;color:var(--gold);
          border-radius:10px;font-size:14px;font-weight:700;
          cursor:pointer;font-family:'Montserrat',sans-serif;
          transition:all 0.2s;
        `
        addBtn.onmouseenter = () => { addBtn.style.background = 'rgba(200,169,110,0.1)' }
        addBtn.onmouseleave = () => { addBtn.style.background = 'transparent' }
        addBtn.onclick = () => onAdd(dayHeading || 'this section')
        addWrap.appendChild(addBtn)
        table.parentNode.insertBefore(addWrap, table.nextSibling)
      }
    })
  }

  function findPrecedingDayHeading(el) {
    let prev = el.previousElementSibling
    while (prev) {
      const text = prev.textContent.trim()
      if (DAYS.some(d => text.toLowerCase().includes(d.toLowerCase()))) return text
      if (/meal \d/i.test(text)) return text
      prev = prev.previousElementSibling
    }
    return null
  }

  function addSwapBtn(name, row, isNutrition, container) {
    const btn = document.createElement('button')
    btn.className = 'pt-swap-btn'
    btn.title = 'Swap'
    btn.innerHTML = '⇄'
    btn.style.cssText = `
      background:transparent;border:none;color:var(--gold);
      cursor:pointer;font-size:14px;padding:2px 4px;
      opacity:0.7;transition:opacity 0.2s;margin-left:4px;
    `
    btn.onmouseenter = () => { btn.style.opacity = '1' }
    btn.onmouseleave = () => { btn.style.opacity = '0.7' }
    const cells = row.querySelectorAll('td')
    btn.onclick = () => onSwap(name, cells[1]?.textContent, cells[2]?.textContent, cells[3]?.textContent)
    container.appendChild(btn)
    return btn
  }

  function addRemoveBtn(name, row) {
    if (name.toLowerCase() === 'total') return
    const lastCell = row.querySelector('td:last-child')
    if (!lastCell || lastCell.querySelector('.pt-remove-btn')) return
    const btn = document.createElement('button')
    btn.className = 'pt-remove-btn'
    btn.innerHTML = '🗑'
    btn.title = 'Remove'
    btn.style.cssText = `
      background:transparent;border:none;cursor:pointer;
      font-size:13px;opacity:0;padding:2px 4px;
      transition:opacity 0.2s;margin-left:6px;
    `
    row.onmouseenter = () => { btn.style.opacity = '1' }
    row.onmouseleave = () => { btn.style.opacity = '0' }
    btn.onclick = (e) => { e.stopPropagation(); onRemove(name) }
    lastCell.appendChild(btn)
  }

  return <div ref={containerRef} className={styles.planHtml} />
}
