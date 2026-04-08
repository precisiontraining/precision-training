/**
 * analyzeProgress.js
 * Rule-based engine that reads progress history and returns
 * the single most important suggestion for the user.
 *
 * Rules (priority order):
 *  1. STAGNATION     — same weight 2+ consecutive logged weeks
 *  2. NEVER_LOGGED   — exercise has 0 entries after week 3
 *  3. FAST_PROGRESS  — weight increased 3+ weeks in a row
 *  4. DELOAD         — 6+ weeks of consistent logging (recovery reminder)
 */

export function analyzeProgress(history, exercises, currentWeek) {
  if (!history || history.length === 0) return null
  if (!exercises || exercises.length === 0) return null

  // Build per-exercise timeline: { exerciseName: [{week, weight_kg, reps, sets}] }
  const byExercise = {}
  history.forEach(row => {
    if (!row.exercise_name) return
    if (!byExercise[row.exercise_name]) byExercise[row.exercise_name] = []
    byExercise[row.exercise_name].push(row)
  })

  // Sort each exercise's entries by week ascending
  Object.values(byExercise).forEach(rows =>
    rows.sort((a, b) => a.week_number - b.week_number)
  )

  const suggestions = []

  for (const exercise of exercises) {
    const logs = byExercise[exercise] || []

    // ── RULE 1: STAGNATION ───────────────────────────────────────────────────
    // 2+ logged weeks with identical weight (and weight > 0)
    if (logs.length >= 2) {
      const withWeight = logs.filter(l => l.weight_kg && l.weight_kg > 0)
      if (withWeight.length >= 2) {
        const recent = withWeight.slice(-3)
        const allSame = recent.every(l => l.weight_kg === recent[0].weight_kg)
        if (allSame && recent.length >= 2) {
          suggestions.push({
            priority: 1,
            type: 'STAGNATION',
            exercise,
            title: 'Time to progress',
            message: `You've been lifting ${recent[0].weight_kg}kg on ${exercise} for ${recent.length} weeks in a row. Your body has adapted — it's time to add weight.`,
            action: `Increase to ${(recent[0].weight_kg + 2.5).toFixed(1)}kg next session`,
            icon: '📈',
            weeks: recent.length,
          })
        }
      }
    }

    // ── RULE 2: NEVER LOGGED ─────────────────────────────────────────────────
    // Exercise is in the plan but has 0 logs after week 3
    if (logs.length === 0 && currentWeek >= 3) {
      suggestions.push({
        priority: 3,
        type: 'NEVER_LOGGED',
        exercise,
        title: 'Skipping an exercise?',
        message: `${exercise} is in your plan but you haven't logged it in ${currentWeek} weeks. If you dislike it, consider swapping it for something you'll actually do.`,
        action: 'Swap this exercise in the Plan tab',
        icon: '⚠️',
        weeks: currentWeek,
      })
    }

    // ── RULE 3: FAST PROGRESSION ─────────────────────────────────────────────
    // Weight increased 3+ consecutive weeks → acknowledge and suggest rep range push
    if (logs.length >= 3) {
      const withWeight = logs.filter(l => l.weight_kg && l.weight_kg > 0)
      if (withWeight.length >= 3) {
        const recent = withWeight.slice(-3)
        const alwaysIncreasing = recent.every((l, i) =>
          i === 0 || l.weight_kg > recent[i - 1].weight_kg
        )
        if (alwaysIncreasing) {
          suggestions.push({
            priority: 2,
            type: 'FAST_PROGRESS',
            exercise,
            title: 'Strong progress 🔥',
            message: `You've added weight on ${exercise} for ${recent.length} weeks straight. You're progressing faster than average — consider also pushing the top of your rep range before adding more weight.`,
            action: 'Push to the top of your rep range next session',
            icon: '🔥',
            weeks: recent.length,
          })
        }
      }
    }
  }

  // ── RULE 4: DELOAD REMINDER ───────────────────────────────────────────────
  // 6+ total logged weeks across all exercises (global, not per-exercise)
  const distinctWeeks = new Set(history.map(h => h.week_number)).size
  if (distinctWeeks >= 6) {
    suggestions.push({
      priority: 4,
      type: 'DELOAD',
      exercise: null,
      title: 'Consider a deload week',
      message: `You've been training consistently for ${distinctWeeks} weeks — great discipline. At this point your central nervous system benefits from a lighter week. Reduce weights by ~40% and focus on form.`,
      action: 'Take it lighter this week, then come back stronger',
      icon: '💤',
      weeks: distinctWeeks,
    })
  }

  if (suggestions.length === 0) return null

  // Return only the highest priority suggestion
  suggestions.sort((a, b) => a.priority - b.priority)
  return suggestions[0]
}

/**
 * Returns the localStorage key used to track dismissed suggestions.
 * Suggestions are dismissed per-type per-exercise for 7 days.
 */
export function getSuggestionDismissKey(suggestion) {
  const ex = suggestion.exercise || 'global'
  return `pt_suggestion_${suggestion.type}_${ex}`
}

/**
 * Returns true if this suggestion was already dismissed (within 7 days).
 */
export function isSuggestionDismissed(suggestion) {
  try {
    const key = getSuggestionDismissKey(suggestion)
    const ts = localStorage.getItem(key)
    if (!ts) return false
    const dismissedAt = parseInt(ts)
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    return Date.now() - dismissedAt < sevenDays
  } catch {
    return false
  }
}

/**
 * Marks a suggestion as dismissed in localStorage.
 */
export function dismissSuggestion(suggestion) {
  try {
    const key = getSuggestionDismissKey(suggestion)
    localStorage.setItem(key, String(Date.now()))
  } catch {}
}
