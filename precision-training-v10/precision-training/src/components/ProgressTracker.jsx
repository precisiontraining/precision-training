import { useState, useEffect } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'
import styles from './ProgressTracker.module.css'

export default function ProgressTracker({ slug, exercises }) {
  const [week, setWeek] = useState(1)
  const [entries, setEntries] = useState({})
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState({})
  const [toast, setToast] = useState('')

  const filteredExercises = exercises.filter(e => e && e.trim() && !['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(e.toLowerCase()))

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
      data.forEach(d => { map[d.exercise_name] = { weight: d.weight_kg || '', reps: d.reps || '', sets: d.sets_completed || '', notes: d.notes || '' } })
      setEntries(map)
    } catch {}
  }

  async function loadHistory() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/progress?plan_slug=eq.${slug}&select=*&order=week_number.asc`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      )
      const data = await res.json()
      setHistory(data)
    } catch {}
  }

  function updateEntry(exercise, field, value) {
    setEntries(prev => ({ ...prev, [exercise]: { ...(prev[exercise] || {}), [field]: value } }))
  }

  async function saveEntry(exercise) {
    setSaving(prev => ({ ...prev, [exercise]: true }))
    const e = entries[exercise] || {}
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
          weight_kg: parseFloat(e.weight) || null,
          reps: parseInt(e.reps) || null,
          sets_completed: parseInt(e.sets) || null,
          notes: e.notes || null,
        }),
      })
      showToast('Saved ✓')
      loadHistory()
    } catch {}
    setSaving(prev => ({ ...prev, [exercise]: false }))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function getExerciseHistory(exercise) {
    return history.filter(h => h.exercise_name === exercise).slice(-4)
  }

  function getTrend(exercise) {
    const h = getExerciseHistory(exercise)
    if (h.length < 2) return null
    const last = h[h.length - 1].weight_kg
    const prev = h[h.length - 2].weight_kg
    if (last > prev) return '↑'
    if (last < prev) return '↓'
    return '→'
  }

  return (
    <div className={styles.tracker}>
      <h2 className={styles.title}>Track Your Progress</h2>

      <div className={styles.weekRow}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
          <button
            key={w}
            className={`${styles.weekBtn} ${week === w ? styles.weekActive : ''}`}
            onClick={() => setWeek(w)}
          >
            W{w}
          </button>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <p className={styles.empty}>No exercises found. Make sure your plan has loaded.</p>
      )}

      {filteredExercises.map(exercise => {
        const e = entries[exercise] || {}
        const hist = getExerciseHistory(exercise)
        const trend = getTrend(exercise)
        return (
          <div key={exercise} className={styles.exerciseCard}>
            <div className={styles.exerciseName}>
              {exercise}
              {trend && <span className={`${styles.trend} ${trend === '↑' ? styles.trendUp : trend === '↓' ? styles.trendDown : styles.trendFlat}`}>{trend}</span>}
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Weight (kg)</label>
                <input type="number" value={e.weight || ''} onChange={ev => updateEntry(exercise, 'weight', ev.target.value)} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label>Reps</label>
                <input type="number" value={e.reps || ''} onChange={ev => updateEntry(exercise, 'reps', ev.target.value)} placeholder="0" />
              </div>
              <div className={styles.inputGroup}>
                <label>Sets</label>
                <input type="number" value={e.sets || ''} onChange={ev => updateEntry(exercise, 'sets', ev.target.value)} placeholder="0" />
              </div>
            </div>
            <input
              className={styles.notesInput}
              placeholder="Notes (optional) – e.g. felt easy, increase next week"
              value={e.notes || ''}
              onChange={ev => updateEntry(exercise, 'notes', ev.target.value)}
            />
            <button className={styles.saveBtn} onClick={() => saveEntry(exercise)} disabled={saving[exercise]}>
              {saving[exercise] ? 'Saving…' : 'Save'}
            </button>

            {hist.length > 0 && (
              <div className={styles.history}>
                <div className={styles.historyTitle}>Progress</div>
                <table className={styles.historyTable}>
                  <thead><tr><th>Week</th><th>Weight</th><th>Reps</th><th>Sets</th></tr></thead>
                  <tbody>
                    {hist.map((h, i) => (
                      <tr key={i}>
                        <td>W{h.week_number}</td>
                        <td>{h.weight_kg ? `${h.weight_kg}kg` : '—'}</td>
                        <td>{h.reps || '—'}</td>
                        <td>{h.sets_completed || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
