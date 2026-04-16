import { useState, useEffect, useRef } from 'react'

/**
 * PlanTour — step-by-step spotlight walkthrough.
 * 
 * Each step: { target: string (data-tour attr), title: string, text: string }
 * 
 * Flow:
 * 1. Find element by [data-tour="<target>"]
 * 2. Scroll it into view
 * 3. After 350ms: compute getBoundingClientRect()
 * 4. Render 4-panel dark overlay + spotlight border + tooltip
 * 5. "Next" advances, "Skip" or last "Done" calls onComplete()
 */
export default function PlanTour({ steps, accentColor = '#c8a96e', onComplete }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(false)
  const cleanupRef = useRef(null)

  const step = steps[stepIdx]

  useEffect(() => {
    setVisible(false)
    setRect(null)

    // Run any cleanup from previous step
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }

    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) {
      // Skip missing elements
      const timeout = setTimeout(() => {
        if (stepIdx < steps.length - 1) setStepIdx(i => i + 1)
        else onComplete()
      }, 80)
      return () => clearTimeout(timeout)
    }

    // Force-show elements that might be hidden (e.g. action buttons with opacity:0)
    const computed = window.getComputedStyle(el)
    const wasHidden = computed.opacity === '0' || computed.visibility === 'hidden'
    if (wasHidden) {
      el.style.opacity = '1'
      el.style.visibility = 'visible'
    }
    cleanupRef.current = () => {
      if (wasHidden) {
        el.style.opacity = ''
        el.style.visibility = ''
      }
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const t = setTimeout(() => {
      const r = el.getBoundingClientRect()
      setRect({
        top: Math.round(r.top),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(r.height),
      })
      setVisible(true)
    }, 380)

    return () => {
      clearTimeout(t)
      if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
    }
  }, [stepIdx]) // eslint-disable-line

  function next() {
    if (stepIdx < steps.length - 1) setStepIdx(i => i + 1)
    else complete()
  }

  function complete() {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
    onComplete()
  }

  if (!visible || !rect) return null

  const winW = window.innerWidth
  const winH = window.innerHeight
  const isMobile = winW < 640

  // Padding around highlighted element
  const PAD = 6
  const hTop    = rect.top    - PAD
  const hLeft   = rect.left   - PAD
  const hWidth  = rect.width  + PAD * 2
  const hHeight = rect.height + PAD * 2

  // Tooltip sizing & positioning
  const tipW = isMobile ? winW - 32 : 320
  const tipEstimatedH = 200

  let tipStyle
  if (isMobile) {
    tipStyle = {
      position: 'fixed',
      bottom: `calc(24px + env(safe-area-inset-bottom, 0px))`,
      left: 16,
      right: 16,
      zIndex: 9996,
    }
  } else {
    const spaceBelow = winH - hTop - hHeight
    const spaceAbove = hTop
    let tipTop
    if (spaceBelow >= tipEstimatedH + 16) {
      tipTop = hTop + hHeight + 12
    } else if (spaceAbove >= tipEstimatedH + 16) {
      tipTop = hTop - tipEstimatedH - 12
    } else {
      tipTop = Math.max(16, Math.min(winH - tipEstimatedH - 16, hTop + hHeight / 2 - tipEstimatedH / 2))
    }
    const tipLeft = Math.max(16, Math.min(winW - tipW - 16, hLeft + hWidth / 2 - tipW / 2))
    tipStyle = {
      position: 'fixed',
      top: tipTop,
      left: tipLeft,
      width: tipW,
      zIndex: 9996,
    }
  }

  const OVERLAY_ALPHA = 'rgba(0,0,0,0.80)'

  return (
    <>
      {/* 4-panel dark overlay creating the spotlight hole */}
      {/* Top panel */}
      <div style={{
        position: 'fixed', zIndex: 9990, pointerEvents: 'none',
        top: 0, left: 0, right: 0,
        height: Math.max(0, hTop),
        background: OVERLAY_ALPHA,
      }} />
      {/* Bottom panel */}
      <div style={{
        position: 'fixed', zIndex: 9990, pointerEvents: 'none',
        left: 0, right: 0, bottom: 0,
        top: hTop + hHeight,
        background: OVERLAY_ALPHA,
      }} />
      {/* Left panel */}
      <div style={{
        position: 'fixed', zIndex: 9990, pointerEvents: 'none',
        top: hTop, left: 0,
        width: Math.max(0, hLeft),
        height: hHeight,
        background: OVERLAY_ALPHA,
      }} />
      {/* Right panel */}
      <div style={{
        position: 'fixed', zIndex: 9990, pointerEvents: 'none',
        top: hTop, left: hLeft + hWidth, right: 0,
        height: hHeight,
        background: OVERLAY_ALPHA,
      }} />

      {/* Spotlight border ring */}
      <div style={{
        position: 'fixed', zIndex: 9991, pointerEvents: 'none',
        top: hTop, left: hLeft,
        width: hWidth, height: hHeight,
        borderRadius: 10,
        border: `2px solid ${accentColor}`,
        boxShadow: `0 0 0 1px ${accentColor}44, 0 0 24px ${accentColor}44`,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }} />

      {/* Clickable skip overlay (behind tooltip) */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9989, cursor: 'default' }}
        onClick={complete}
      />

      {/* Tooltip card */}
      <div
        style={{
          ...tipStyle,
          background: '#0e0e0e',
          border: '1px solid #242424',
          borderRadius: 16,
          padding: '20px',
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px #1a1a1a`,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Step counter */}
        <div style={{
          fontSize: 9, fontWeight: 800, color: accentColor,
          textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Step {stepIdx + 1} / {steps.length}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 15, fontWeight: 800, color: '#fff',
          marginBottom: 8, lineHeight: 1.3,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {step.title}
        </div>

        {/* Text */}
        <div style={{
          fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 18,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {step.text}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'center' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                height: 4, borderRadius: 2,
                width: i === stepIdx ? 20 : 6,
                background: i === stepIdx ? accentColor : '#252525',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={complete}
            style={{
              flex: 1, padding: '11px 0',
              background: 'transparent', border: '1px solid #252525',
              color: '#555', borderRadius: 8,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all .2s', minHeight: 44,
            }}
          >
            Skip
          </button>
          <button
            onClick={next}
            style={{
              flex: 2, padding: '11px 0',
              background: accentColor, border: 'none', color: '#000',
              borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all .2s', minHeight: 44,
            }}
          >
            {stepIdx < steps.length - 1 ? 'Next →' : 'Done ✓'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Tour step definitions ─────────────────────────────────────────────────────

export const TRAINING_TOUR_STEPS = [
  {
    target: 'tabs',
    title: 'Navigate Your Plan',
    text: 'Use these tabs to switch between your training plan, progress tracker, and AI coach. Plan Insights unlocks with premium.',
  },
  {
    target: 'day-tabs',
    title: 'Training Days',
    text: 'Tap any day to view that workout. On mobile, swipe left to see all training days.',
  },
  {
    target: 'exercise-card',
    title: 'Exercise Cards',
    text: 'Each card shows your exercise with sets, reps, and rest time. Use the ↕ icon to swap an exercise, or 🗑 to remove it.',
  },
  {
    target: 'add-exercise',
    title: 'Add an Exercise',
    text: 'Tap here to add a new exercise to this training day. Search from 80+ exercises in our library.',
  },
  {
    target: 'tracker-tab',
    title: 'Progress Tracker',
    text: 'Log your weights and reps after each session. The tracker shows how your performance improves over time.',
  },
  {
    target: 'coach-tab',
    title: 'Your AI Coach',
    text: 'Ask your coach anything — technique tips, exercise substitutions, nutrition advice, or how to push through a plateau.',
  },
]

export const NUTRITION_TOUR_STEPS = [
  {
    target: 'tabs',
    title: 'Navigate Your Plan',
    text: 'Use these tabs to switch between your meal plan, macro tracker, and AI nutrition coach.',
  },
  {
    target: 'macro-summary',
    title: 'Your Daily Targets',
    text: 'Your personalized daily calorie and macro targets are shown here — calculated specifically from your body data and goal.',
  },
  {
    target: 'day-tabs',
    title: 'Your Meals',
    text: 'Tap each meal to view its food options. Your full day of eating is covered from first meal to last.',
  },
  {
    target: 'option-btns',
    title: 'Meal Options',
    text: 'Each meal has multiple food options to choose from. Pick what fits your day — you can mix and match across meals freely.',
  },
  {
    target: 'meal-total',
    title: 'Meal Totals',
    text: 'The full calorie and macro breakdown for this meal is shown here — so you know exactly what you are eating.',
  },
  {
    target: 'tracker-tab',
    title: 'Macro Tracker',
    text: 'Log your daily food and see how close you are to your targets. Great for staying consistent.',
  },
  {
    target: 'coach-tab',
    title: 'AI Nutrition Coach',
    text: 'Ask your coach about meal swaps, hitting your macros, supplement timing, or anything about your nutrition plan.',
  },
]
