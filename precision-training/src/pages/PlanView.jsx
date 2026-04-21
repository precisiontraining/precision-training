import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProgressTracker from '../components/ProgressTracker'
import MacroTracker from '../components/MacroTracker'
import AICoach from '../components/AICoach'
import SuggestionPopup from '../components/SuggestionPopup'
import ExerciseSearchInput from '../components/ExerciseSearchInput'
import UpgradePrompt from '../components/UpgradePrompt'
import LayoutChooser from '../components/LayoutChooser'
import PlanTour, { TRAINING_TOUR_STEPS, NUTRITION_TOUR_STEPS, GLP1_TOUR_STEPS } from '../components/PlanTour'
import MuscleGuardScore from '../components/MuscleGuardScore'
import { analyzeProgress, isSuggestionDismissed } from '../utils/analyzeProgress'
import { canSwap, swapsRemaining, incrementSwap } from '../utils/freeTier'
import { SUPABASE_URL, SUPABASE_ANON_KEY, EXERCISE_GIF_URL, PLAN_CHAT_URL, DAYS } from '../constants'
import styles from './PlanView.module.css'

const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }

const COLOR_MAP = {
  gold:   { value: '#c8a96e', light: '#d4b97e', dark: '#a88a50' },
  blue:   { value: '#4a9eff', light: '#6eb2ff', dark: '#2a7fe6' },
  purple: { value: '#a78bda', light: '#b99de6', dark: '#8a6cc0' },
  green:  { value: '#6db88a', light: '#7fcca0', dark: '#4a9e68' },
}

// ── PARSE AI HTML → STRUCTURED DATA ──────────────────────────────────────────

function isDayHeading(text) {
  const t = text.toLowerCase().trim()
  if (/overview|summary|schedule|split|plan|protocol|guideline|recovery|warm.?up|cool.?down|progression|week\s*\d/i.test(t)) return false
  if (DAYS.some(d => t.includes(d.toLowerCase()))) return true
  if (/^day\s*\d+/i.test(t)) return true
  if (/^(workout|session)\s*(\d+|[a-c])?(\s|$)/i.test(t)) return true
  if (/^training\s+(day\s*\d+|[a-c]\b)/i.test(t)) return true
  if (/\b(upper|lower|push|pull|leg|chest|back|shoulder|arm|full.?body|cardio|core|glute|hamstring)\b/i.test(t)) return true
  return false
}

function findNearestHeading(el) {
  let prev = el.previousElementSibling
  while (prev) {
    if (/^h[1-6]$/i.test(prev.tagName)) return prev.textContent.trim()
    const inner = prev.querySelector('h1,h2,h3,h4,h5,h6')
    if (inner) return inner.textContent.trim()
    prev = prev.previousElementSibling
  }
  const parent = el.parentElement
  if (parent && parent !== document.body) {
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

function isNonExerciseTable(table) {
  const headers = [...table.querySelectorAll('th')].map(h => h.textContent.toLowerCase().trim())
  const text = table.textContent.toLowerCase()
  if (headers.some(h => h.includes('week'))) return true
  if (headers.some(h => h.includes('day')) && headers.some(h => h.includes('muscle') || h.includes('focus') || h.includes('group'))) return true
  if (text.includes('sleep') || text.includes('recovery') || text.includes('deload')) return true
  const rows = [...table.querySelectorAll('tbody tr')]
  if (rows.length <= 2 && !headers.some(h => h.includes('exercise'))) return true
  return false
}

function parseTrainingPlan(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result = { meta: {}, days: [], extras: [] }
  const allTables = [...doc.querySelectorAll('table')]

  function cleanTitle(raw) {
    return raw
      .replace(/^day\s*\d+\s*[-\u2013:]+\s*/i, '')
      .replace(/^workout\s*\d*\s*[-\u2013:]+\s*/i, '')
      .replace(/^session\s*\d*\s*[-\u2013:]+\s*/i, '')
      .trim() || raw.trim()
  }

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
        currentDay.exercises.push({ name: cells[0], sets: cells[1] || '', reps: cells[2] || '', rest: cells[3] || '', notes: cells[4] || '' })
      })
    }
  })

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
        exercises.push({ name: cells[0], sets: cells[1] || '', reps: cells[2] || '', rest: cells[3] || '', notes: cells[4] || '' })
      })
      if (exercises.length === 0) return
      const existing = result.days.find(d => d.title === title)
      if (existing) existing.exercises.push(...exercises)
      else result.days.push({ title, exercises })
    })
  }

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
  const result = { intro: '', meals: [], dailyMacros: null }

  const macroValues = [...doc.querySelectorAll('.macro-value')]
  if (macroValues.length >= 4) {
    const nums = macroValues.map(el => parseFloat(el.textContent.replace(/[^\d.]/g, '')) || 0)
    if (nums[0] > 500) result.dailyMacros = { kcal: nums[0], protein: nums[1], carbs: nums[2], fats: nums[3] }
  }
  if (!result.dailyMacros) {
    const rows = [...doc.querySelectorAll('table tr')]
    let kcal = 0, protein = 0, carbs = 0, fats = 0
    rows.forEach(row => {
      const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
      if (cells.length >= 2) {
        const val = parseFloat(cells[1].replace(/[^\d.]/g, '')) || 0
        if (/calori|kcal/i.test(cells[0])) kcal = val
        if (/protein/i.test(cells[0])) protein = val
        if (/carb/i.test(cells[0])) carbs = val
        if (/fat/i.test(cells[0])) fats = val
      }
    })
    if (kcal > 500) result.dailyMacros = { kcal, protein, carbs, fats }
  }
  if (!result.dailyMacros) {
    const bodyText = doc.body.textContent
    const m = bodyText.match(/(\d{3,5})\s*kcal[^|]*\|\s*(\d{2,4})g?\s*protein[^|]*\|\s*(\d{2,4})g?\s*carbs[^|]*\|\s*(\d{1,3})g?\s*fats/i)
    if (m) result.dailyMacros = { kcal: +m[1], protein: +m[2], carbs: +m[3], fats: +m[4] }
  }

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

  const elements = [...doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,table,p')]
  let currentMeal = null
  let currentOption = null

  function isMealHeading(text) { return /breakfast|lunch|dinner|snack|pre.?workout|post.?workout|meal\s*\d/i.test(text) }
  function isOptionHeading(text) { return /option\s*[abc1-3]|^(light|easy|balanced|standard|exciting|quick|classic|high.?protein|simple|variation)/i.test(text) }
  function isSummaryHeading(text) { return /daily total|nutrition summary|total summary|daily summary|overview|supplement|hydration|meal prep|grocery/i.test(text) }

  const allTables = [...doc.querySelectorAll('table')]
  for (const tbl of allTables) {
    const text = tbl.textContent.toLowerCase()
    const prevEl = tbl.previousElementSibling
    const prevText = (prevEl?.textContent || '').toLowerCase()
    if (/daily total|nutrition summary|daily summary/i.test(prevText) || /daily.*total|total.*daily/i.test(text)) {
      const rows = [...tbl.querySelectorAll('tr')]
      rows.forEach(row => {
        const cells = [...row.querySelectorAll('td,th')].map(c => c.textContent.trim().toLowerCase())
        if (cells.some(c => /calor|kcal/.test(c)) && cells.some(c => /protein/.test(c))) {
          const nums = cells.map(c => parseFloat(c)).filter(n => !isNaN(n) && n > 0)
          if (nums.length >= 4) result.dailyMacros = { kcal: nums[0], protein: nums[1], carbs: nums[2], fats: nums[3] }
        }
      })
      if (result.dailyMacros) break
    }
  }

  if (!result.dailyMacros) {
    const macroLabels = ['calorie', 'protein', 'carb', 'fat']
    const macroVals = {}
    doc.querySelectorAll('div, span, p').forEach(el => {
      const label = el.textContent.toLowerCase().trim()
      macroLabels.forEach(m => {
        if (label.startsWith(m) || label === m + 's') {
          const nextEl = el.nextElementSibling || el.parentElement?.nextElementSibling
          if (nextEl) {
            const val = parseFloat(nextEl.textContent)
            if (!isNaN(val) && val > 0) macroVals[m] = val
          }
        }
      })
    })
    if (macroVals.calorie && macroVals.protein)
      result.dailyMacros = { kcal: macroVals.calorie, protein: macroVals.protein, carbs: macroVals.carb || 0, fats: macroVals.fat || 0 }
  }

  function saveOption() {
    if (currentOption && currentOption.items.length > 0 && currentMeal) currentMeal.options.push(currentOption)
    currentOption = null
  }
  function saveMeal() {
    saveOption()
    if (currentMeal && currentMeal.options.length > 0) result.meals.push(currentMeal)
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
      const thCells = [...el.querySelectorAll('thead th, thead td')]
      const firstTrTds = [...el.querySelectorAll('tr:first-child td')]
      const headerCells = thCells.length > 0 ? thCells : firstTrTds
      const headerTexts = headerCells.map(h => h.textContent.toLowerCase().trim())
      const isMealTable = headerTexts.some(h => h.includes('food') || h.includes('item') || h.includes('calor') || h.includes('protein') || h.includes('amount') || h.includes('carb') || h.includes('fat'))
      const fallbackTable = !isMealTable && el.querySelectorAll('tr').length >= 3
      if (!isMealTable && !fallbackTable) return
      if (/daily total|nutrition summary|supplement|hydration|grocery/i.test(el.closest('div,section')?.previousElementSibling?.textContent || '')) return
      if (!currentOption) currentOption = { label: 'Option A', items: [], totals: null }
      function colIdx(keywords) {
        const idx = headerTexts.findIndex(h => keywords.some(k => h.includes(k)))
        return idx >= 0 ? idx : -1
      }
      const COL_FOOD    = colIdx(['food','item','name']) !== -1 ? colIdx(['food','item','name']) : 0
      const COL_AMOUNT  = colIdx(['amount','weight','gram','qty']) !== -1 ? colIdx(['amount','weight','gram','qty']) : 1
      const COL_KCAL    = colIdx(['calor','kcal','energy']) !== -1 ? colIdx(['calor','kcal','energy']) : 2
      const COL_PROTEIN = colIdx(['protein']) !== -1 ? colIdx(['protein']) : 3
      const COL_CARBS   = colIdx(['carb']) !== -1 ? colIdx(['carb']) : 4
      const COL_FATS    = colIdx(['fat']) !== -1 ? colIdx(['fat']) : 5
      const skipHeaderRow = thCells.length === 0 && firstTrTds.length > 0 && firstTrTds.some(td => /food|calor|protein|amount/i.test(td.textContent))
      const allRows = [...el.querySelectorAll('tr')]
      allRows.forEach((row, rowIdx) => {
        if (skipHeaderRow && rowIdx === 0) return
        if (row.querySelector('th')) return
        const cells = [...row.querySelectorAll('td')].map(c => c.textContent.trim())
        if (cells.length < 2) return
        const food = cells[COL_FOOD] || ''
        if (!food) return
        if (/^total/i.test(food)) {
          currentOption.totals = { kcal: cells[COL_KCAL]||'', protein: cells[COL_PROTEIN]||'', carbs: cells[COL_CARBS]||'', fats: cells[COL_FATS]||'' }
          return
        }
        if (/^daily|^supplement|^hydration|^grocery|^calories$|^protein$|^carbs$|^fats$/i.test(food)) return
        function num(val) { return val ? String(parseFloat(val) || val) : '' }
        currentOption.items.push({ food, amount: num(cells[COL_AMOUNT]), kcal: num(cells[COL_KCAL]), protein: num(cells[COL_PROTEIN]), carbs: num(cells[COL_CARBS]), fats: num(cells[COL_FATS]) })
      })
    }
  })

  saveMeal()

  const extras = { supplement: '', hydration: '', tips: [], grocery: { proteins: '', carbs: '', fats: '' } }
  const allDivs = [...doc.querySelectorAll('.supplement-list, .hydration, .tips, .grocery-list')]
  allDivs.forEach(el => {
    const cls = el.className || ''
    if (/supplement/i.test(cls)) extras.supplement = el.textContent.trim().replace(/^GLP-1 Supplement Stack[:\s]*/i, '').trim()
    if (/hydration/i.test(cls)) extras.hydration = el.textContent.trim().replace(/^Hydration[:\s]*/i, '').trim()
    if (/tips/i.test(cls)) extras.tips = [...el.querySelectorAll('li')].map(li => li.textContent.trim()).filter(Boolean)
    if (/grocery/i.test(cls)) {
      const sections = [...el.querySelectorAll('div')]
      sections.forEach(s => {
        const h = s.querySelector('h4')?.textContent?.toLowerCase() || ''
        const txt = s.textContent.replace(s.querySelector('h4')?.textContent || '', '').trim()
        if (/protein/i.test(h)) extras.grocery.proteins = txt
        else if (/carb/i.test(h)) extras.grocery.carbs = txt
        else if (/fat|veg/i.test(h)) extras.grocery.fats = txt
      })
    }
  })
  if (!extras.supplement) {
    const bodyText = doc.body.textContent
    const supMatch = bodyText.match(/GLP-1 Supplement Stack[:\s]+([^\n]+(?:\n(?![A-Z])[^\n]+)*)/i)
    if (supMatch) extras.supplement = supMatch[1].trim()
    const hydMatch = bodyText.match(/Hydration[:\s]+([^\n]+)/i)
    if (hydMatch) extras.hydration = hydMatch[1].trim()
  }
  result.extras = extras
  return result
}

function getDailyTargets(parsedPlan) {
  if (!parsedPlan) return null
  if (parsedPlan.dailyMacros?.kcal) return parsedPlan.dailyMacros
  if (!parsedPlan.meals?.length) return null
  let kcal = 0, protein = 0, carbs = 0, fats = 0
  parsedPlan.meals.forEach(meal => {
    const totals = meal.options?.[0]?.totals || meal.totals
    if (!totals) return
    kcal    += parseFloat(totals.kcal)    || 0
    protein += parseFloat(totals.protein) || 0
    carbs   += parseFloat(totals.carbs)   || 0
    fats    += parseFloat(totals.fats)    || 0
  })
  if (kcal === 0) return null
  return { kcal: Math.round(kcal), protein: Math.round(protein), carbs: Math.round(carbs), fats: Math.round(fats) }
}

// ── ICON HELPERS ──────────────────────────────────────────────────────────────
function SwapIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
}
function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
}

// ── EXERCISE FALLBACK IMAGE ───────────────────────────────────────────────────
const FALLBACK_IMAGES = {
  chest: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Push-ups-2.png',
  back: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Chin-ups-1.png',
  shoulders: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Dumbbell-shoulder-press-2.png',
  biceps: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Dumbbell-lateral-raises-1.png',
  triceps: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Triceps-pushdown-2.gif',
  legs: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Lunges-2-2.png',
  core: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Decline-sit-up-2.png',
  general: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Push-ups-2.png',
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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PlanView() {
  const { slug } = useParams()
  const [password, setPassword] = useState(() => { try { return sessionStorage.getItem(`pt_pw_${slug}`) || '' } catch { return '' } })
  const [rememberMe, setRememberMe] = useState(() => { try { return !!sessionStorage.getItem(`pt_pw_${slug}`) } catch { return false } })
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('plan')
  const [images, setImages] = useState({})
  const imagesLoadedRef = useRef(false)
  const loadGenerationRef = useRef(0)
  const [toast, setToast] = useState('')
  const [swapModal, setSwapModal] = useState(null)
  const [addModal, setAddModal] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [parsedPlan, setParsedPlan] = useState(null)
  const [activeSuggestion, setActiveSuggestion] = useState(null)
  const [swapLimitModal, setSwapLimitModal] = useState(false)
  const [lockedFeatureModal, setLockedFeatureModal] = useState(null)
  const [unlockAttempts, setUnlockAttempts] = useState(0)
  const [unlockCooldown, setUnlockCooldown] = useState(false)

  // Layout & appearance
  const [layout, setLayout] = useState(() => { try { return localStorage.getItem(`pt_layout_${slug}`) || 'cards' } catch { return 'cards' } })
  const [accentColor, setAccentColor] = useState(() => { try { return localStorage.getItem(`pt_color_${slug}`) || 'gold' } catch { return 'gold' } })
  const [showChooser, setShowChooser] = useState(false)
  const [chooserIsFirst, setChooserIsFirst] = useState(false)
  const [showTour, setShowTour] = useState(false)

  const colorEntry = COLOR_MAP[accentColor] || COLOR_MAP.gold
  const accent = colorEntry.value
  const accentLight = colorEntry.light
  const accentDark = colorEntry.dark

  useEffect(() => {
    const saved = sessionStorage.getItem(`pt_pw_${slug}`)
    if (saved) unlock(saved)
  }, [slug]) // eslint-disable-line

  async function loadImages(parsed, force = false) {
    // Once images are successfully loaded, never reload (unless forced after a swap/add)
    if (!force && imagesLoadedRef.current) return
    if (!parsed?.days) return

    const names = new Set()
    parsed.days.forEach(day => day.exercises.forEach(ex => names.add(ex.name.toLowerCase().trim())))
    if (!names.size) return

    // Increment generation so any older in-flight call can detect it is stale
    // and abort before overwriting state with partial/outdated results.
    // This fixes the race condition where React Strict Mode double-invokes the
    // useEffect, or a swap triggers a second loadImages while the first is still
    // fetching — causing images to flash visible then disappear.
    const myGeneration = loadGenerationRef.current + 1
    loadGenerationRef.current = myGeneration

    // Sequential fetch — one request at a time, respects Supabase edge function limits
    const fetched = {}
    for (const name of names) {
      // Abort early if a newer load has been started
      if (loadGenerationRef.current !== myGeneration) return
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

    // Only commit results if this is still the latest load
    if (loadGenerationRef.current !== myGeneration) return
    if (Object.keys(fetched).length > 0) {
      setImages(fetched)
      imagesLoadedRef.current = true
    }
  }

  async function unlock(savedPw) {
    const pw = savedPw || password
    if (!pw) return
    if (unlockCooldown) { setError('Too many attempts. Please wait 60 seconds.'); return }
    if (!savedPw) {
      const next = unlockAttempts + 1
      setUnlockAttempts(next)
      if (next >= 5) {
        setUnlockCooldown(true)
        setError('Too many attempts. Please wait 60 seconds.')
        setTimeout(() => { setUnlockCooldown(false); setUnlockAttempts(0); setError('') }, 60000)
        return
      }
    }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/plans?slug=eq.${encodeURIComponent(slug)}&select=slug,password,html_content,plan_type`, { headers: HEADERS })
      const data = await res.json()
      if (!data?.length) { setError('Plan not found.'); setLoading(false); return }
      const p = data[0]
      if (p.password !== pw) { setError('Incorrect password. Please check your email.'); setLoading(false); return }
      try {
        if (rememberMe || savedPw) sessionStorage.setItem(`pt_pw_${slug}`, pw)
        else sessionStorage.removeItem(`pt_pw_${slug}`)
      } catch {}
      setPlan(p)
      setUnlocked(true)
      const _isNut = p.plan_type === 'nutrition' || /glp.?1.?nutrition|glp1.?nutrition/i.test(p.plan_type)
      const parsed = _isNut ? parseNutritionPlan(p.html_content) : parseTrainingPlan(p.html_content)
      setParsedPlan(parsed)
      if (!_isNut) loadImages(parsed)
      else loadImages(parsed)
      if (!_isNut) setTimeout(() => loadAndAnalyzeProgress(slug, parsed), 800)

      // First time setup
      try {
        if (!localStorage.getItem(`pt_setup_${slug}`)) {
          const _isGlp1 = /glp.?1|muscle.?guard/i.test(p.html_content || '')
          setAccentColor(_isGlp1 ? 'green' : 'gold')
          setTimeout(() => { setChooserIsFirst(true); setShowChooser(true) }, 500)
        }
      } catch {}
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  function handleChooserConfirm(newLayout, newColor) {
    setLayout(newLayout)
    setAccentColor(newColor)
    try {
      localStorage.setItem(`pt_layout_${slug}`, newLayout)
      localStorage.setItem(`pt_color_${slug}`, newColor)
      if (chooserIsFirst) localStorage.setItem(`pt_setup_${slug}`, 'true')
    } catch {}
    setShowChooser(false)
    if (chooserIsFirst) {
      try {
        if (!localStorage.getItem(`pt_tour_${slug}`)) setTimeout(() => setShowTour(true), 400)
      } catch {}
    }
  }

  function handleTourComplete() {
    setShowTour(false)
    try { localStorage.setItem(`pt_tour_${slug}`, 'true') } catch {}
  }

  async function loadAndAnalyzeProgress(planSlug, parsed) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/progress?plan_slug=eq.${planSlug}&select=*&order=week_number.asc`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
      const history = await res.json()
      if (!Array.isArray(history) || history.length === 0) return
      const exercises = (parsed?.days || []).flatMap(d => d.exercises.map(e => e.name))
      const distinctWeeks = new Set(history.map(h => h.week_number)).size
      const suggestion = analyzeProgress(history, exercises, distinctWeeks)
      if (suggestion && !isSuggestionDismissed(suggestion)) setTimeout(() => setActiveSuggestion(suggestion), 1200)
    } catch {}
  }

  function getImage(name) {
    if (!name) return null
    const lower = name.toLowerCase().trim()
    if (images[lower]) return images[lower]
    const norm = lower.replace(/s$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
    const entries = Object.entries(images)
    return images[norm] || entries.find(([k]) => k.replace(/s$/, '').replace(/-/g, ' ') === norm)?.[1] || entries.find(([k]) => lower.includes(k) || k.includes(lower))?.[1] || entries.find(([k]) => norm.split(' ')[0].length > 3 && k.includes(norm.split(' ')[0]))?.[1] || null
  }

  function extractExercises() {
    if (!parsedPlan?.days) return []
    const names = new Set()
    parsedPlan.days.forEach(day => day.exercises.forEach(ex => names.add(ex.name)))
    return [...names]
  }

  async function savePlan(html) {
    await fetch(`${SUPABASE_URL}/rest/v1/plans?slug=eq.${slug}`, { method: 'PATCH', headers: { ...HEADERS, Prefer: 'return=minimal' }, body: JSON.stringify({ html_content: html }) })
    setPlan(prev => ({ ...prev, html_content: html }))
    const _isNut2 = plan?.plan_type === 'nutrition' || /glp.?1.?nutrition|glp1.?nutrition/i.test(plan?.plan_type)
    const newParsed = _isNut2 ? parseNutritionPlan(html) : parseTrainingPlan(html)
    setParsedPlan(newParsed)
    if (!_isNut2) { imagesLoadedRef.current = false; loadGenerationRef.current = 0; loadImages(newParsed, true) }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function openSwap(exercise) {
    if (!canSwap(slug)) { setSwapLimitModal(true); return }
    setSwapModal({ item: exercise.name, newName: '', sets: exercise.sets, reps: exercise.reps, rest: exercise.rest })
  }

  async function applySwap() {
    if (!swapModal?.newName) return
    incrementSwap(slug)
    const updated = plan.html_content.replace(new RegExp(swapModal.item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), swapModal.newName)
    await savePlan(updated)
    setSwapModal(null); showToast('Swapped ✓')
  }

  async function applyAdd() {
    if (!addModal?.name) return
    const newRow = `<tr><td>${addModal.name}</td><td>${addModal.sets}</td><td>${addModal.reps}</td><td>${addModal.rest}</td><td>${addModal.notes}</td></tr>`
    const dayPattern = new RegExp(`(${addModal.day.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*(?:<[^>]*>)*.*?</table>)`, 'si')
    const updated = plan.html_content.replace(dayPattern, m => m.replace('</table>', newRow + '</table>'))
    await savePlan(updated); setAddModal(null); showToast('Exercise added ✓')
  }

  async function removeItem(name) {
    const rowPattern = new RegExp(`<tr[^>]*>\\s*<td[^>]*>\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</td>[\\s\\S]*?</tr>`, 'gi')
    const updated = plan.html_content.replace(rowPattern, '')
    await savePlan(updated); setConfirmRemove(null); showToast('Removed ✓')
  }

  const isNutrition = plan?.plan_type === 'nutrition' || /glp.?1.?nutrition|glp1.?nutrition/i.test(plan?.plan_type)
  const isGlp1 = /glp.?1|muscle.?guard|muscle.?preservation/i.test(plan?.html_content || '')
  const tourSteps = isNutrition ? NUTRITION_TOUR_STEPS : isGlp1 ? GLP1_TOUR_STEPS : TRAINING_TOUR_STEPS

  // ── LOCK PAGE ──────────────────────────────────────────────────────────────
  if (!unlocked) return (
    <div className={styles.lockPage}>
      <div className={styles.lockCard}>
        <img src="/logo.png" alt="Precision Training" className={styles.lockLogo} />
        <h1>Your Plan is Ready</h1>
        <p>Enter the password from your email to access your personalized plan.</p>
        <input className={styles.lockInput} type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && unlock()} disabled={unlockCooldown} autoComplete="current-password" />
        {error && <div className={styles.lockError}>{error}</div>}
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.4)', margin:'4px 0 12px', userSelect:'none' }}>
          <div onClick={() => setRememberMe(r => !r)} style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${rememberMe ? '#c8a96e' : 'rgba(255,255,255,0.2)'}`, background:rememberMe ? 'rgba(200,169,110,0.15)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
            {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#c8a96e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span onClick={() => setRememberMe(r => !r)}>Remember me on this device</span>
        </label>
        <button className={styles.lockBtn} onClick={() => unlock()} disabled={loading || unlockCooldown}>
          {loading ? 'Loading…' : unlockCooldown ? 'Too many attempts — wait 60s' : 'View My Plan →'}
        </button>
        <Link to="/" className={styles.lockBack}>← Back to Precision Training</Link>
      </div>
    </div>
  )

  // ── PLAN PAGE ──────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.page} ${isGlp1 ? styles.glp1Theme : ''}`} style={{ '--gold': accent, '--gold-light': accentLight, '--gold-dark': accentDark }}>

      {/* HEADER */}
      <header className={styles.header} style={isGlp1 && accentColor === 'green' ? { background:'#060f08', borderBottom:'1px solid rgba(109,184,138,0.15)' } : {}}>
        <Link to="/" className={styles.logo}><span className={styles.gold}>Precision</span> Training</Link>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, justifyContent:'center', flexWrap:'wrap', minWidth:0, padding:'0 12px' }}>
          <h1 className={styles.planTitle} style={{ color: accent }}>
            {isNutrition ? 'Your Nutrition Plan' : isGlp1 ? 'GLP-1 Muscle Guard Plan' : 'Your Training Plan'}
          </h1>
          {isGlp1 && accentColor === 'green' && (
            <span className={styles.glp1Badge}>💊 Muscle Preservation</span>
          )}
        </div>
        <button className={styles.settingsBtn} onClick={() => { setChooserIsFirst(false); setShowChooser(true) }} title="Customize layout" aria-label="Customize plan appearance">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      {/* TABS */}
      <div className={styles.tabs} data-tour="tabs">
        {[
          { key:'plan',    label:'My Plan',        tourId:'plan-tab' },
          { key:'tracker', label: isNutrition ? 'Macro Tracker' : 'Progress Tracker', tourId:'tracker-tab' },
          { key:'coach',   label:'AI Coach',       tourId:'coach-tab' },
        ].map(({ key, label, tourId }) => (
          <button key={key} data-tour={tourId} className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
        <button className={styles.tab} style={{ color:'rgba(255,255,255,0.2)' }} onClick={() => setLockedFeatureModal('Plan Insights & Stagnation Detection')}>
          Plan Insights <UpgradePrompt variant="inline" />
        </button>
      </div>

      {/* Swap counter */}
      {!isNutrition && unlocked && (() => {
        const rem = swapsRemaining(slug)
        return (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'6px 20px', gap:8, fontSize:10, color: rem<=1 ? '#e06060' : 'rgba(255,255,255,0.25)', letterSpacing:'0.5px', fontFamily:'Montserrat,sans-serif' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
            {rem} swap{rem !== 1 ? 's' : ''} left this week
            {rem === 0 && <span style={{ color:'var(--gold)', marginLeft:4 }}>· Premium = unlimited</span>}
          </div>
        )
      })()}

      {/* CONTENT */}
      <div className={styles.content}>
        {tab === 'plan' && parsedPlan && (
          isNutrition
            ? <NutritionView parsed={parsedPlan} layout={layout} accent={accent} />
            : <TrainingView parsed={parsedPlan} images={images} getImage={getImage} isGlp1={isGlp1} accent={accent} layout={layout} onSwap={openSwap} slug={slug} planHtml={plan?.html_content || ''} onAdd={day => setAddModal({ day, name:'', sets:'3', reps:'8-12', rest:'90s', notes:'' })} onRemove={name => setConfirmRemove(name)} />
        )}
        {tab === 'tracker' && (isNutrition ? <MacroTracker slug={slug} dailyTargets={getDailyTargets(parsedPlan)} /> : <ProgressTracker slug={slug} exercises={extractExercises()} accentColor={accent} />)}
        {tab === 'coach' && <AICoach slug={slug} isNutrition={isNutrition} isGlp1={isGlp1} />}
      </div>

      {/* ── MODALS ── */}
      {swapModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSwapModal(null)}>
          <div className="modal">
            <h3>Swap "{swapModal.item}"</h3>
            <div className="modal-label">Replace with</div>
            <ExerciseSearchInput value={swapModal.newName} onChange={name => setSwapModal(p => ({ ...p, newName: name||'' }))} placeholder="Search exercises…" />
            <div className="modal-row">
              {[['Sets','sets'],['Reps','reps'],['Rest','rest']].map(([label,key]) => (
                <div key={key}><div className="modal-label">{label}</div><input className="modal-input" value={swapModal[key]} onChange={e => setSwapModal(p => ({ ...p, [key]: e.target.value }))} placeholder={label} style={{ marginBottom:0 }} /></div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSwapModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={applySwap} disabled={!swapModal.newName}>Apply Swap</button>
            </div>
          </div>
        </div>
      )}

      {addModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(null)}>
          <div className="modal">
            <h3>Add Exercise to {addModal.day}</h3>
            <div className="modal-label">Exercise name</div>
            <ExerciseSearchInput value={addModal.name} onChange={name => setAddModal(p => ({ ...p, name: name||'' }))} placeholder="Search exercises…" />
            <div className="modal-row">
              {[['Sets','sets','3'],['Reps','reps','8-12'],['Rest','rest','90s']].map(([label,key,ph]) => (
                <div key={key}><div className="modal-label">{label}</div><input className="modal-input" value={addModal[key]} onChange={e => setAddModal(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{ marginBottom:0 }} /></div>
              ))}
            </div>
            <div className="modal-label">Notes (optional)</div>
            <input className="modal-input" value={addModal.notes} onChange={e => setAddModal(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Focus on form" />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={applyAdd} disabled={!addModal.name}>Add Exercise</button>
            </div>
          </div>
        </div>
      )}

      {confirmRemove && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmRemove(null)}>
          <div className="modal">
            <h3>Remove "{confirmRemove}"?</h3>
            <p style={{ color:'var(--gray)', fontSize:14, marginBottom:16 }}>This will permanently remove it from your plan.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmRemove(null)}>Cancel</button>
              <button className="btn-confirm" style={{ background:'#ef4444' }} onClick={() => removeItem(confirmRemove)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {swapLimitModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSwapLimitModal(false)}>
          <div className="modal" style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:16 }}>🔄</div>
            <h3 style={{ marginBottom:8 }}>Weekly swap limit reached</h3>
            <p style={{ color:'var(--gray)', fontSize:13, lineHeight:1.7, marginBottom:20 }}>
              You've used all 3 free swaps this week. Your limit resets every Monday.<br/><br/>
              <span style={{ color:'var(--gold)' }}>Premium</span> includes unlimited swaps — launching soon.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-cancel" onClick={() => setSwapLimitModal(false)}>Got it</button>
              <button className="btn-confirm" style={{ opacity:0.5, cursor:'default' }} disabled>Upgrade (Coming Soon)</button>
            </div>
          </div>
        </div>
      )}

      {lockedFeatureModal && <UpgradePrompt variant="modal" feature={lockedFeatureModal} onDismiss={() => setLockedFeatureModal(null)} />}
      {toast && <div className="toast">{toast}</div>}
      {activeSuggestion && (
        <SuggestionPopup suggestion={activeSuggestion} onDismiss={() => setActiveSuggestion(null)} onApply={s => { setActiveSuggestion(null); showToast(`✓ ${s.action}`) }} />
      )}

      {showChooser && (
        <LayoutChooser layout={layout} color={accentColor} isFirstTime={chooserIsFirst} onClose={() => setShowChooser(false)} onConfirm={handleChooserConfirm} />
      )}

      {showTour && (
        <PlanTour steps={tourSteps} accentColor={accent} onComplete={handleTourComplete} />
      )}
    </div>
  )
}

// ── TRAINING VIEW ─────────────────────────────────────────────────────────────
function TrainingView({ parsed, images, getImage, onSwap, onAdd, onRemove, isGlp1, accent, layout, slug, planHtml }) {
  const [activeDay, setActiveDay] = useState(0)
  const days = parsed.days || []
  if (!days.length) return <div className={styles.empty}>No workout data found in this plan.</div>
  const day = days[activeDay]
  const accentBg = `${accent}12`
  const accentBorder = `${accent}40`

  return (
    <div className={styles.trainingView}>

      {isGlp1 && (
        <MuscleGuardScore slug={slug} planHtml={planHtml} isTrainingPlan={true} />
      )}

      <div className={styles.dayTabs} data-tour="day-tabs">
        {days.map((d, i) => {
          const words = d.title.split(' ')
          const label = words.length > 2 ? words[0] + ' ' + words[1] : d.title
          const sub = words.length > 2 ? words.slice(2).join(' ') : ''
          return (
            <button key={i} className={`${styles.dayTab} ${activeDay === i ? styles.dayTabActive : ''}`} onClick={() => setActiveDay(i)}
              style={activeDay === i ? { borderColor:accent, color:accent, background:accentBg } : {}}>
              <span className={styles.dayTabLabel}>{label}</span>
              {sub && <span className={styles.dayTabSub}>{sub}</span>}
            </button>
          )
        })}
      </div>

      <div className={styles.dayContent}>
        <div className={styles.dayHeader}>
          <h2 className={styles.dayTitle} style={{ color:accent }}>{day.title}</h2>
          <span className={styles.dayCount} style={{ color:accent, background:accentBg, borderColor:accentBorder }}>{day.exercises.length} exercises</span>
        </div>

        {isGlp1 && (
          <div style={{ padding:'10px 14px', borderRadius:8, margin:'0 16px 0', background:'rgba(109,184,138,0.06)', border:'1px solid rgba(109,184,138,0.2)', fontSize:11, color:'#6db88a', fontStyle:'italic', lineHeight:1.6 }}>
            Energy low from meds? Drop 1 set per exercise or add 30s extra rest. Do not skip — showing up matters more than perfect reps.
          </div>
        )}

        {/* CARDS layout */}
        {layout !== 'compact' && layout !== 'grid' && (
          <div className={styles.exerciseList}>
            {day.exercises.map((ex, i) => {
              const img = getImage(ex.name)
              return (
                <div key={i} className={styles.exerciseCard} data-tour={i===0 ? 'exercise-card' : undefined}>
                  <div className={styles.exerciseNum} style={{ color:accent }}>{String(i+1).padStart(2,'0')}</div>
                  <div className={styles.exerciseImg}>
                    {img ? <img src={img} alt={ex.name} className={styles.exImg} onError={e => { e.target.src = FALLBACK_IMAGES[getMuscleGroup(ex.name)] }} /> : <div className={styles.exImgPlaceholder}><ExerciseFallback name={ex.name} /></div>}
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
                    <button className={styles.actionBtn} onClick={() => onSwap(ex)} title="Swap"><SwapIcon /></button>
                    <button className={styles.actionBtn} style={{ color:'#e05555' }} onClick={() => onRemove(ex.name)} title="Remove"><TrashIcon /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* COMPACT layout */}
        {layout === 'compact' && (
          <div className={styles.exerciseList}>
            {day.exercises.map((ex, i) => (
              <div key={i} className={styles.exerciseCardCompact} data-tour={i===0 ? 'exercise-card' : undefined}>
                <div className={styles.compactNum} style={{ color:accent }}>{String(i+1).padStart(2,'0')}</div>
                <div className={styles.compactName}>{ex.name}</div>
                <div className={styles.compactMeta}>
                  {[ex.sets && `${ex.sets} sets`, ex.reps && `× ${ex.reps}`, ex.rest && `· ${ex.rest}`].filter(Boolean).join(' ')}
                </div>
                <div className={styles.compactActions}>
                  <button className={styles.actionBtn} style={{ color:accent }} onClick={() => onSwap(ex)} title="Swap"><SwapIcon /></button>
                  <button className={styles.actionBtn} style={{ color:'#e05555' }} onClick={() => onRemove(ex.name)} title="Remove"><TrashIcon /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GRID layout */}
        {layout === 'grid' && (
          <div className={styles.exerciseGrid}>
            {day.exercises.map((ex, i) => {
              const img = getImage(ex.name)
              return (
                <div key={i} className={styles.exerciseCardGrid} data-tour={i===0 ? 'exercise-card' : undefined}>
                  <div className={styles.exerciseImgGrid}>
                    {img ? <img src={img} alt={ex.name} className={styles.exImg} onError={e => { e.target.src = FALLBACK_IMAGES[getMuscleGroup(ex.name)] }} /> : <ExerciseFallback name={ex.name} />}
                  </div>
                  <div className={styles.exerciseNameGrid}>{ex.name}</div>
                  {ex.notes && <div className={styles.exerciseNotesGrid}>{ex.notes}</div>}
                  <div className={styles.exerciseMetaGrid}>
                    {ex.sets && <span className={styles.metaTag}><span className={styles.metaKey}>Sets</span>{ex.sets}</span>}
                    {ex.reps && <span className={styles.metaTag}><span className={styles.metaKey}>Reps</span>{ex.reps}</span>}
                  </div>
                  <div className={styles.gridActions}>
                    <button className={styles.actionBtn} style={{ color:accent }} onClick={() => onSwap(ex)} title="Swap"><SwapIcon /></button>
                    <button className={styles.actionBtn} style={{ color:'#e05555' }} onClick={() => onRemove(ex.name)} title="Remove"><TrashIcon /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button className={styles.addExBtn} onClick={() => onAdd(day.title)} data-tour="add-exercise" style={{ borderColor:accentBorder, color:accent }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Exercise
        </button>
      </div>
    </div>
  )
}

// ── NUTRITION VIEW ────────────────────────────────────────────────────────────
function NutritionView({ parsed, layout, accent }) {
  const [activeMeal, setActiveMeal] = useState(0)
  const [activeOption, setActiveOption] = useState(0)
  const meals = parsed.meals || []
  if (!meals.length) return <div className={styles.empty}>No nutrition data found in this plan.</div>
  const meal = meals[activeMeal]
  const options = meal.options || []
  const option = options[Math.min(activeOption, options.length - 1)] || options[0]
  const dm = parsed.dailyMacros

  function shortLabel(title) {
    const clean = title.replace(/^meal\s*\d*\s*[-\u2013:]*\s*/i, '').trim()
    return clean.split(/[-\u2013:]/)[0].trim() || title
  }

  const OPTION_COLORS = [accent, '#6e9dc8', '#7ec87e']
  const OPTION_BG = [`${accent}1a`, 'rgba(110,157,200,0.12)', 'rgba(126,200,126,0.12)']

  return (
    <div className={styles.trainingView}>
      {parsed.intro && (
        <div className={styles.coachingIntro}>
          <div className={styles.coachingIntroIcon} style={{ color:accent, background:`${accent}1a` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className={styles.coachingIntroText}>{parsed.intro}</p>
        </div>
      )}

      {dm && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }} data-tour="macro-summary">
          {[{label:'Calories',value:`${dm.kcal} kcal`},{label:'Protein',value:`${dm.protein}g`},{label:'Carbs',value:`${dm.carbs}g`},{label:'Fats',value:`${dm.fats}g`}].map(m => (
            <div key={m.label} style={{ flex:'1 1 76px', minWidth:72, background:`${accent}0d`, border:`1px solid ${accent}30`, borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:17, fontWeight:800, color:accent }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.dayTabs} data-tour="day-tabs">
        {meals.map((m, i) => (
          <button key={i} className={`${styles.dayTab} ${activeMeal===i ? styles.dayTabActive : ''}`}
            style={activeMeal===i ? { borderColor:accent, color:accent, background:`${accent}12` } : {}}
            onClick={() => { setActiveMeal(i); setActiveOption(0) }}>
            <span className={styles.dayTabLabel}>{shortLabel(m.title)}</span>
          </button>
        ))}
      </div>

      <div className={styles.dayContent}>
        <div className={styles.dayHeader}>
          <h2 className={styles.dayTitle} style={{ color:accent }}>{meal.title}</h2>
          {option && <span className={styles.dayCount} style={{ color:accent, background:`${accent}12`, borderColor:`${accent}40` }}>{option.items.length} items</span>}
        </div>

        {meal.purposeNote && (
          <div className={styles.mealPurpose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>{meal.purposeNote}</span>
          </div>
        )}

        {options.length > 1 && (
          <div className={styles.optionRow} data-tour="option-btns">
            <span className={styles.optionLabel}>Choose option:</span>
            <div className={styles.optionBtns}>
              {options.map((opt, i) => (
                <button key={i} className={styles.optionBtn}
                  style={{ borderColor: activeOption===i ? OPTION_COLORS[i%OPTION_COLORS.length] : 'var(--border)', background: activeOption===i ? OPTION_BG[i%OPTION_BG.length] : 'transparent', color: activeOption===i ? OPTION_COLORS[i%OPTION_COLORS.length] : 'var(--gray)' }}
                  onClick={() => setActiveOption(i)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {option && (
          <>
            {/* CARDS */}
            {layout !== 'compact' && layout !== 'grid' && (
              <div className={styles.nutritionList}>
                {option.items.map((item, i) => (
                  <div key={i} className={styles.nutritionCard}>
                    <div className={styles.nutritionNum}>{String(i+1).padStart(2,'0')}</div>
                    <div className={styles.nutritionInfo}>
                      <div className={styles.exerciseName}>{item.food}</div>
                      <div className={styles.exerciseMeta}>
                        {item.amount  && <span className={styles.metaTag}><span className={styles.metaKey}>Amount</span>{item.amount}</span>}
                        {item.kcal    && <span className={styles.metaTag}><span className={styles.metaKey}>kcal</span>{item.kcal}</span>}
                        {item.protein && <span className={styles.metaTag}><span className={styles.metaKey}>Protein</span>{item.protein}</span>}
                        {item.carbs   && <span className={styles.metaTag}><span className={styles.metaKey}>Carbs</span>{item.carbs}</span>}
                        {item.fats    && <span className={styles.metaTag}><span className={styles.metaKey}>Fats</span>{item.fats}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* COMPACT */}
            {layout === 'compact' && (
              <div className={styles.nutritionList}>
                {option.items.map((item, i) => (
                  <div key={i} className={styles.nutritionCardCompact}>
                    <div className={styles.compactNum}>{String(i+1).padStart(2,'0')}</div>
                    <div className={styles.compactName}>{item.food}</div>
                    <div className={styles.compactMeta}>
                      {[item.amount, item.kcal && `${item.kcal} kcal`, item.protein && `${item.protein}g P`].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* GRID */}
            {layout === 'grid' && (
              <div className={styles.nutritionGrid}>
                {option.items.map((item, i) => (
                  <div key={i} className={styles.nutritionCardGrid}>
                    <div className={styles.nutritionGridName}>{item.food}</div>
                    {item.amount && <div className={styles.nutritionGridAmount}>{item.amount}</div>}
                    <div className={styles.nutritionGridMacros}>
                      {item.kcal    && <span><strong>{item.kcal}</strong> kcal</span>}
                      {item.protein && <span><strong>{item.protein}</strong>g P</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {option.totals && (
              <div className={styles.mealTotalBar} data-tour="meal-total">
                <div className={styles.mealTotalLeft} style={{ color:accent }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span>Meal Total</span>
                </div>
                <div className={styles.mealTotalMacros}>
                  {option.totals.kcal    && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.kcal}</span><span className={styles.mealTotalKey}>kcal</span></div>}
                  {option.totals.protein && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.protein}</span><span className={styles.mealTotalKey}>protein</span></div>}
                  {option.totals.carbs   && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.carbs}</span><span className={styles.mealTotalKey}>carbs</span></div>}
                  {option.totals.fats    && <div className={styles.mealTotalMacro}><span className={styles.mealTotalVal}>{option.totals.fats}</span><span className={styles.mealTotalKey}>fats</span></div>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {parsed.extras && (
        <div style={{ marginTop:32, display:'flex', flexDirection:'column', gap:16 }}>
          {parsed.extras.supplement && (
            <div style={{ background:`${accent}08`, border:`1px solid ${accent}25`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:accent, marginBottom:8 }}>💊 GLP-1 Supplement Stack</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>{parsed.extras.supplement}</div>
            </div>
          )}
          {parsed.extras.hydration && (
            <div style={{ background:`${accent}08`, border:`1px solid ${accent}25`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:accent, marginBottom:8 }}>💧 Hydration</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>{parsed.extras.hydration}</div>
            </div>
          )}
          {parsed.extras.tips?.length > 0 && (
            <div style={{ background:`${accent}06`, border:`1px solid ${accent}20`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:accent, marginBottom:12 }}>📋 Meal Prep Tips</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {parsed.extras.tips.map((tip, i) => (
                  <div key={i} style={{ display:'flex', gap:10, fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
                    <span style={{ color:accent, fontWeight:700, flexShrink:0 }}>{String(i+1).padStart(2,'0')}</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(parsed.extras.grocery?.proteins || parsed.extras.grocery?.carbs || parsed.extras.grocery?.fats) && (
            <div style={{ background:`${accent}08`, border:`1px solid ${accent}25`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:accent, marginBottom:12 }}>🛒 Grocery List</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:12 }}>
                {[{label:'Proteins',val:parsed.extras.grocery.proteins},{label:'Carbs',val:parsed.extras.grocery.carbs},{label:'Fats & Veg',val:parsed.extras.grocery.fats}].map(g => g.val ? (
                  <div key={g.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:accent, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>{g.label}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>{g.val}</div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
