import { useState, useEffect } from 'react'
import styles from './MacroTracker.module.css'

const MACROS = [
  { key: 'kcal',    label: 'Calories', unit: 'kcal', color: '#c8a96e' },
  { key: 'protein', label: 'Protein',  unit: 'g',    color: '#6e9dc8' },
  { key: 'carbs',   label: 'Carbs',    unit: 'g',    color: '#7ec87e' },
  { key: 'fats',    label: 'Fats',     unit: 'g',    color: '#c87e6e' },
]

function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

function getOffsetDate(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

export default function MacroTracker({ slug, dailyTargets }) {
  const [offset, setOffset] = useState(0) // 0 = today
  const [entry, setEntry] = useState({ kcal: '', protein: '', carbs: '', fats: '', weight: '' })
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState('')

  const selectedDate = getOffsetDate(offset)

  function storageKey(d) {
    return `pt_macro_${slug}_${toDateStr(d)}`
  }

  function loadEntry(d) {
    try {
      const stored = localStorage.getItem(storageKey(d))
      setEntry(stored ? JSON.parse(stored) : { kcal: '', protein: '', carbs: '', fats: '', weight: '' })
    } catch {
      setEntry({ kcal: '', protein: '', carbs: '', fats: '', weight: '' })
    }
  }

  function loadHistory() {
    const hist = []
    for (let i = -6; i <= 0; i++) {
      const d = getOffsetDate(i)
      try {
        const stored = localStorage.getItem(storageKey(d))
        hist.push({ date: d, ...(stored ? JSON.parse(stored) : {}) })
      } catch {
        hist.push({ date: d })
      }
    }
    setHistory(hist)
  }

  useEffect(() => { loadEntry(selectedDate) }, [offset, slug])
  useEffect(() => { loadHistory() }, [slug])

  function save() {
    try {
      localStorage.setItem(storageKey(selectedDate), JSON.stringify(entry))
      loadHistory()
      showToast('Saved ✓')
    } catch {}
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  function pct(val, target) {
    if (!val || !target) return 0
    return Math.min(100, Math.round((parseFloat(val) / parseFloat(target)) * 100))
  }

  const hasEntry = MACROS.some(m => parseFloat(entry[m.key]) > 0)

  return (
    <div className={styles.tracker}>

      {/* ── DATE NAV ── */}
      <div className={styles.dateNav}>
        <button className={styles.navBtn} onClick={() => setOffset(o => o - 1)}>‹</button>
        <div className={styles.dateCenter}>
          <span className={styles.dateLabel}>{fmtDate(selectedDate)}</span>
          {offset === 0 && <span className={styles.todayBadge}>Today</span>}
        </div>
        <button
          className={styles.navBtn}
          onClick={() => setOffset(o => Math.min(0, o + 1))}
          disabled={offset === 0}
        >›</button>
      </div>

      {/* ── PROGRESS BARS ── */}
      {dailyTargets && (
        <div className={styles.progressSection}>
          <div className={styles.sectionLabel}>Daily Target Progress</div>
          {MACROS.map(m => {
            const p = pct(entry[m.key], dailyTargets[m.key])
            const over = parseFloat(entry[m.key]) > parseFloat(dailyTargets[m.key])
            return (
              <div key={m.key} className={styles.macroRow}>
                <div className={styles.macroMeta}>
                  <span className={styles.macroName}>{m.label}</span>
                  <span className={styles.macroVals} style={{ color: over ? '#c87e6e' : 'rgba(255,255,255,0.45)' }}>
                    {entry[m.key] || 0} / {dailyTargets[m.key]} {m.unit}
                    {over && <span className={styles.overTag}>over</span>}
                  </span>
                </div>
                <div className={styles.bar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${p}%`, background: over ? '#c87e6e' : m.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── INPUT GRID ── */}
      <div className={styles.inputSection}>
        <div className={styles.sectionLabel}>Log Intake</div>
        <div className={styles.inputGrid}>
          {MACROS.map(m => (
            <div key={m.key} className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                {m.label}
                <span className={styles.unitTag}>{m.unit}</span>
              </label>
              <input
                className={styles.input}
                type="number"
                min="0"
                placeholder="0"
                value={entry[m.key]}
                onChange={e => setEntry(prev => ({ ...prev, [m.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Body Weight
              <span className={styles.unitTag}>kg</span>
            </label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={entry.weight}
              onChange={e => setEntry(prev => ({ ...prev, weight: e.target.value }))}
            />
          </div>
        </div>
        <button className={styles.saveBtn} onClick={save}>
          {hasEntry ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>

      {/* ── 7-DAY HISTORY ── */}
      {history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.sectionLabel}>Last 7 Days</div>
          <div className={styles.historyGrid}>
            {history.map((h, i) => {
              const isSelected = toDateStr(h.date) === toDateStr(selectedDate)
              const kcalVal = parseFloat(h.kcal) || 0
              const target = parseFloat(dailyTargets?.kcal) || 2000
              const fillPct = Math.min(100, Math.round((kcalVal / target) * 100))
              const hasData = kcalVal > 0
              return (
                <div
                  key={i}
                  className={`${styles.historyDay} ${isSelected ? styles.historySelected : ''}`}
                  onClick={() => setOffset(i - 6)}
                >
                  <div className={styles.historyBarWrap}>
                    <div
                      className={styles.historyBarFill}
                      style={{ height: `${fillPct}%`, opacity: hasData ? 1 : 0.15 }}
                    />
                  </div>
                  <div className={styles.historyDayLabel}>
                    {h.date.toLocaleDateString('en', { weekday: 'narrow' })}
                  </div>
                  {hasData && (
                    <div className={styles.historyKcal}>{Math.round(kcalVal / 100) * 100}</div>
                  )}
                </div>
              )
            })}
          </div>
          {dailyTargets && (
            <div className={styles.historyNote}>
              Bar height = % of {dailyTargets.kcal} kcal daily target
            </div>
          )}
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
