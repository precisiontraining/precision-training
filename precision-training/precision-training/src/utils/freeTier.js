// ── Free Tier Limits ──────────────────────────────────────────────────────────
// All limits are tracked in localStorage per plan slug.
// When paid tier is introduced, replace localStorage checks with Supabase auth check.

export const FREE_LIMITS = {
  SWAPS_PER_WEEK: 3,
  AI_QUESTIONS_PER_DAY: 5,
}

// ── Swap tracking ─────────────────────────────────────────────────────────────
function swapKey(slug) {
  // Reset weekly — key includes ISO week number
  const d = new Date()
  const week = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000)
  return `pt_swaps_${slug}_${d.getFullYear()}_w${week}`
}

export function getSwapsUsed(slug) {
  try { return parseInt(localStorage.getItem(swapKey(slug)) || '0') } catch { return 0 }
}

export function incrementSwap(slug) {
  try {
    const n = getSwapsUsed(slug) + 1
    localStorage.setItem(swapKey(slug), String(n))
    return n
  } catch { return 0 }
}

export function swapsRemaining(slug) {
  return Math.max(0, FREE_LIMITS.SWAPS_PER_WEEK - getSwapsUsed(slug))
}

export function canSwap(slug) {
  return swapsRemaining(slug) > 0
}

// ── AI Coach tracking ─────────────────────────────────────────────────────────
export function aiQuestionsKey(slug) {
  return `pt_coach_${slug}_${new Date().toDateString()}`
}

export function getAiQuestionsUsed(slug) {
  try { return parseInt(localStorage.getItem(aiQuestionsKey(slug)) || '0') } catch { return 0 }
}

export function aiQuestionsRemaining(slug) {
  return Math.max(0, FREE_LIMITS.AI_QUESTIONS_PER_DAY - getAiQuestionsUsed(slug))
}
