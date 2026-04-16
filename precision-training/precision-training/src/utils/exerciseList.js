/**
 * exerciseList.js
 * Canonical exercise list for the frontend search/dropdown.
 * Each entry: { name, gifUrl, keywords[] }
 * keywords = extra search terms that should match this exercise.
 * gifUrl: null means no image (still selectable, fallback image shown).
 */

const W = 'https://upload.wikimedia.org/wikipedia/commons'

export const EXERCISE_LIST = [
  // ── CHEST ─────────────────────────────────────────────────────
  { name: 'Bench Press',              gifUrl: `${W}/f/f7/Bench-press-2.png`,                                                               keywords: ['flat', 'barbell', 'chest', 'bb', 'press'] },
  { name: 'Incline Bench Press',      gifUrl: `${W}/4/4c/Incline-bench-press-2-2.png`,                                                    keywords: ['incline', 'barbell', 'chest', 'bb', 'press', 'upper'] },
  { name: 'Decline Bench Press',      gifUrl: `${W}/b/bb/Decline-dumbbell-bench-press-2.png`,                                             keywords: ['decline', 'barbell', 'chest', 'lower', 'press'] },
  { name: 'Incline Dumbbell Press',   gifUrl: `${W}/thumb/b/b8/Incline_dumbbell_press_1.svg/400px-Incline_dumbbell_press_1.svg.png`,       keywords: ['incline', 'dumbbell', 'db', 'chest', 'press', 'upper'] },
  { name: 'Dumbbell Fly',             gifUrl: `${W}/thumb/c/ce/Dumbbell_flys_1.svg/400px-Dumbbell_flys_1.svg.png`,                        keywords: ['flat', 'dumbbell', 'db', 'chest', 'fly', 'flies', 'flys', 'pec'] },
  { name: 'Incline Dumbbell Fly',     gifUrl: `${W}/thumb/a/a3/Incline_dumbbell_flys_1.svg/400px-Incline_dumbbell_flys_1.svg.png`,        keywords: ['incline', 'dumbbell', 'db', 'chest', 'fly', 'flies', 'upper'] },
  { name: 'Decline Dumbbell Fly',     gifUrl: `${W}/4/42/Dumbbell-decline-flys-1.png`,                                                    keywords: ['decline', 'dumbbell', 'db', 'chest', 'fly', 'flies', 'lower'] },
  { name: 'Cable Fly',                gifUrl: `${W}/d/de/Flat-bench-cable-flys-2.png`,                                                    keywords: ['cable', 'crossover', 'chest', 'fly', 'flies', 'high', 'low', 'pec'] },
  { name: 'Pec Deck / Butterfly',     gifUrl: `${W}/thumb/3/30/Butterfly_machine_1.svg/400px-Butterfly_machine_1.svg.png`,                keywords: ['pec', 'deck', 'butterfly', 'machine', 'chest', 'fly', 'flies'] },
  { name: 'Incline Chest Press',      gifUrl: `${W}/thumb/e/e4/Incline_chest_press_1.svg/400px-Incline_chest_press_1.svg.png`,            keywords: ['incline', 'machine', 'chest', 'press'] },
  { name: 'Decline Chest Press',      gifUrl: `${W}/thumb/4/4e/Decline_chest_press_1.svg/400px-Decline_chest_press_1.svg.png`,            keywords: ['decline', 'machine', 'chest', 'press'] },
  { name: 'Push-Up',                  gifUrl: `${W}/1/1a/Push-ups-2.png`,                                                                 keywords: ['pushup', 'bodyweight', 'chest', 'wide', 'close', 'diamond', 'pike', 'incline', 'decline', 'tricep'] },
  { name: 'Chest Dip',               gifUrl: `${W}/thumb/7/77/Chest_dips_1.svg/400px-Chest_dips_1.svg.png`,                             keywords: ['dip', 'chest', 'parallel', 'weighted', 'bodyweight'] },
  { name: 'Bench Dip',               gifUrl: `${W}/thumb/f/f4/Bench_dips_1.svg/400px-Bench_dips_1.svg.png`,                             keywords: ['bench', 'dip', 'chair', 'tricep', 'bodyweight'] },
  { name: 'Close Grip Bench Press',  gifUrl: `${W}/f/f7/Bench-press-2.png`,                                                               keywords: ['close', 'grip', 'bench', 'press', 'tricep', 'narrow', 'cgbp'] },

  // ── BACK ──────────────────────────────────────────────────────
  { name: 'Deadlift',                 gifUrl: `${W}/thumb/9/92/Barbell_dead_lifts_1.svg/400px-Barbell_dead_lifts_1.svg.png`,              keywords: ['barbell', 'conventional', 'sumo', 'trap', 'hex', 'back', 'pull', 'compound'] },
  { name: 'Romanian Deadlift',        gifUrl: `${W}/thumb/5/5c/Romanian_dead_lift_1.svg/400px-Romanian_dead_lift_1.svg.png`,              keywords: ['rdl', 'romanian', 'stiff', 'straight', 'leg', 'deadlift', 'hamstring', 'barbell'] },
  { name: 'Dumbbell Deadlift',        gifUrl: `${W}/thumb/d/da/Dumbbell_dead_lifts_1.svg/400px-Dumbbell_dead_lifts_1.svg.png`,            keywords: ['dumbbell', 'db', 'deadlift'] },
  { name: 'Pull-Up',                  gifUrl: `${W}/thumb/b/b8/Chin_ups_1.svg/400px-Chin_ups_1.svg.png`,                                 keywords: ['pullup', 'overhand', 'wide', 'neutral', 'weighted', 'assisted', 'back', 'bodyweight'] },
  { name: 'Chin-Up',                  gifUrl: `${W}/thumb/b/b8/Chin_ups_1.svg/400px-Chin_ups_1.svg.png`,                                 keywords: ['chinup', 'underhand', 'supinated', 'weighted', 'back', 'bicep', 'bodyweight'] },
  { name: 'Inverted Row',             gifUrl: `${W}/thumb/b/b8/Chin_ups_1.svg/400px-Chin_ups_1.svg.png`,                                 keywords: ['inverted', 'row', 'bodyweight', 'australian', 'horizontal', 'table'] },
  { name: 'Lat Pulldown',             gifUrl: `${W}/2/2d/Cable-seated-rows-1.png`,                                                        keywords: ['lat', 'pulldown', 'cable', 'wide', 'close', 'v-bar', 'straight', 'arm', 'back'] },
  { name: 'Seated Cable Row',         gifUrl: `${W}/2/2d/Cable-seated-rows-1.png`,                                                        keywords: ['seated', 'cable', 'row', 'low', 'close', 'wide', 'chest', 'supported', 'machine'] },
  { name: 'Barbell Row',              gifUrl: `${W}/a/af/Barbell-rear-delt-row-1.png`,                                                    keywords: ['barbell', 'bent', 'over', 'row', 'pendlay', 'overhand', 'back'] },
  { name: 'Dumbbell Row',             gifUrl: `${W}/a/af/Barbell-rear-delt-row-1.png`,                                                    keywords: ['dumbbell', 'db', 'one', 'single', 'arm', 'row', 'unilateral', 'back'] },
  { name: 'T-Bar Row',                gifUrl: `${W}/e/eb/T-bar-row-2.png`,                                                                keywords: ['tbar', 't-bar', 'landmine', 'row', 'back', 'chest', 'supported'] },
  { name: 'Back Extension',           gifUrl: `${W}/thumb/2/22/Back_extension_stability_ball_1.svg/400px-Back_extension_stability_ball_1.svg.png`, keywords: ['back', 'extension', 'hyperextension', 'roman', 'chair', 'lower'] },
  { name: 'Good Morning',             gifUrl: `${W}/a/a1/Good-mornings-1.png`,                                                            keywords: ['good', 'morning', 'barbell', 'lower', 'back', 'hamstring'] },
  { name: 'Superman',                 gifUrl: `${W}/thumb/7/71/Supermans_1.svg/400px-Supermans_1.svg.png`,                               keywords: ['superman', 'back', 'raise', 'lower', 'core'] },

  // ── SHOULDERS ─────────────────────────────────────────────────
  { name: 'Overhead Press',           gifUrl: `${W}/thumb/9/99/Barbell_shoulder_press_1.svg/400px-Barbell_shoulder_press_1.svg.png`,      keywords: ['ohp', 'barbell', 'military', 'standing', 'push', 'press', 'shoulder'] },
  { name: 'Seated Military Press',    gifUrl: `${W}/thumb/d/d7/Seated_military_press_1.svg/400px-Seated_military_press_1.svg.png`,        keywords: ['seated', 'military', 'barbell', 'overhead', 'press', 'shoulder'] },
  { name: 'Dumbbell Shoulder Press',  gifUrl: `${W}/a/a3/Dumbbell-shoulder-press-2.png`,                                                  keywords: ['dumbbell', 'db', 'shoulder', 'overhead', 'press', 'seated', 'standing'] },
  { name: 'Arnold Press',             gifUrl: `${W}/thumb/9/96/Arnold_press_1.svg/400px-Arnold_press_1.svg.png`,                         keywords: ['arnold', 'rotating', 'dumbbell', 'shoulder', 'press'] },
  { name: 'Lateral Raise',            gifUrl: `${W}/f/fd/Dumbbell-lateral-raises-1.png`,                                                  keywords: ['lateral', 'side', 'raise', 'dumbbell', 'cable', 'shoulder', 'delt'] },
  { name: 'Front Raise',              gifUrl: `${W}/0/09/Barbell-front-raises-1.png`,                                                     keywords: ['front', 'raise', 'dumbbell', 'barbell', 'cable', 'alternating', 'shoulder', 'anterior', 'delt'] },
  { name: 'Rear Delt Fly',            gifUrl: `${W}/f/fd/Dumbbell-lateral-raises-1.png`,                                                  keywords: ['rear', 'delt', 'fly', 'reverse', 'bent', 'over', 'lateral', 'posterior', 'shoulder'] },
  { name: 'Face Pull',                gifUrl: `${W}/f/fd/Dumbbell-lateral-raises-1.png`,                                                  keywords: ['face', 'pull', 'cable', 'rope', 'rear', 'delt', 'shoulder'] },
  { name: 'Shrugs',                   gifUrl: `${W}/thumb/3/3f/Shoulder_shrugs_1.svg/400px-Shoulder_shrugs_1.svg.png`,                   keywords: ['shrug', 'barbell', 'dumbbell', 'cable', 'trap', 'shoulder'] },
  { name: 'Upright Row',              gifUrl: `${W}/b/bf/Barbell-upright-rows-1.png`,                                                     keywords: ['upright', 'row', 'barbell', 'dumbbell', 'cable', 'shoulder', 'trap'] },
  { name: 'Hip Adduction',            gifUrl: `${W}/thumb/4/44/Hip_adduction_1.svg/400px-Hip_adduction_1.svg.png`,                       keywords: ['hip', 'adduction', 'adductor', 'inner', 'thigh', 'machine', 'groin'] },
  { name: 'Hip Abduction',            gifUrl: `${W}/thumb/3/3b/Thigh_abductor_1.svg/400px-Thigh_abductor_1.svg.png`,                    keywords: ['hip', 'abduction', 'abductor', 'outer', 'thigh', 'machine', 'glute'] },

  // ── BICEPS ────────────────────────────────────────────────────
  { name: 'Barbell Curl',             gifUrl: `${W}/thumb/b/b6/Alternating_bicep_curl_with_dumbbell_1.svg/400px-Alternating_bicep_curl_with_dumbbell_1.svg.png`, keywords: ['barbell', 'bicep', 'curl', 'standing', 'ez', 'bar'] },
  { name: 'Dumbbell Curl',            gifUrl: `${W}/thumb/b/b6/Alternating_bicep_curl_with_dumbbell_1.svg/400px-Alternating_bicep_curl_with_dumbbell_1.svg.png`, keywords: ['dumbbell', 'db', 'bicep', 'curl', 'alternating', 'arm'] },
  { name: 'Hammer Curl',              gifUrl: `${W}/thumb/8/8c/Alternating_hammer_curl_with_dumbbell_1.svg/400px-Alternating_hammer_curl_with_dumbbell_1.svg.png`, keywords: ['hammer', 'neutral', 'grip', 'curl', 'dumbbell', 'cross', 'body', 'bicep'] },
  { name: 'Incline Dumbbell Curl',    gifUrl: `${W}/thumb/a/ab/Alternating_incline_curl_with_dumbbell_1.svg/400px-Alternating_incline_curl_with_dumbbell_1.svg.png`, keywords: ['incline', 'dumbbell', 'db', 'curl', 'bicep', 'seated'] },
  { name: 'Preacher Curl',            gifUrl: `${W}/thumb/b/b6/Alternating_bicep_curl_with_dumbbell_1.svg/400px-Alternating_bicep_curl_with_dumbbell_1.svg.png`, keywords: ['preacher', 'scott', 'curl', 'bicep', 'ez', 'barbell', 'machine'] },
  { name: 'Concentration Curl',       gifUrl: `${W}/thumb/b/b6/Alternating_bicep_curl_with_dumbbell_1.svg/400px-Alternating_bicep_curl_with_dumbbell_1.svg.png`, keywords: ['concentration', 'seated', 'curl', 'dumbbell', 'bicep'] },
  { name: 'Cable Curl',               gifUrl: `${W}/thumb/b/b6/Alternating_bicep_curl_with_dumbbell_1.svg/400px-Alternating_bicep_curl_with_dumbbell_1.svg.png`, keywords: ['cable', 'curl', 'bicep', 'low', 'pulley'] },
  { name: 'Reverse Curl',             gifUrl: `${W}/thumb/b/b6/Alternating_bicep_curl_with_dumbbell_1.svg/400px-Alternating_bicep_curl_with_dumbbell_1.svg.png`, keywords: ['reverse', 'overhand', 'curl', 'barbell', 'dumbbell', 'forearm'] },

  // ── TRICEPS ───────────────────────────────────────────────────
  { name: 'Tricep Dip',               gifUrl: `${W}/thumb/5/57/Tricep_dips_1.svg/400px-Tricep_dips_1.svg.png`,                           keywords: ['dip', 'tricep', 'parallel', 'weighted', 'bodyweight'] },
  { name: 'Cable Pushdown',           gifUrl: `${W}/0/05/Triceps-pushdown-2.gif`,                                                         keywords: ['cable', 'pushdown', 'push', 'down', 'rope', 'v-bar', 'straight', 'bar', 'tricep'] },
  { name: 'Skull Crusher',            gifUrl: `${W}/5/58/Lying-triceps-extension-1.gif`,                                                  keywords: ['skull', 'crusher', 'lying', 'tricep', 'extension', 'ez', 'barbell'] },
  { name: 'Overhead Tricep Extension',gifUrl: `${W}/thumb/f/ff/Seated_overhead_triceps_extension_with_barbell_1.svg/400px-Seated_overhead_triceps_extension_with_barbell_1.svg.png`, keywords: ['overhead', 'tricep', 'extension', 'french', 'press', 'dumbbell', 'seated'] },
  { name: 'Tricep Kickback',          gifUrl: `${W}/thumb/4/40/Triceps_kickback_with_dumbbell_1.svg/400px-Triceps_kickback_with_dumbbell_1.svg.png`, keywords: ['kickback', 'tricep', 'bent', 'over', 'dumbbell', 'cable'] },
  { name: 'Cable Tricep Extension',   gifUrl: `${W}/d/d5/Triceps-extensions-1.gif`,                                                       keywords: ['cable', 'tricep', 'extension', 'seated', 'one', 'single', 'arm'] },
  { name: 'Kneeling Tricep Extension',gifUrl: `${W}/6/67/Kneeling-triceps-extension-1.gif`,                                               keywords: ['kneeling', 'cable', 'tricep', 'extension'] },

  // ── LEGS ──────────────────────────────────────────────────────
  { name: 'Squat',                    gifUrl: `${W}/thumb/d/d1/Front_squat_with_barbell_1.svg/400px-Front_squat_with_barbell_1.svg.png`,  keywords: ['squat', 'barbell', 'back', 'bodyweight', 'air', 'box', 'high', 'low', 'bar', 'jump', 'weighted', 'quads', 'legs'] },
  { name: 'Front Squat',              gifUrl: `${W}/thumb/d/d1/Front_squat_with_barbell_1.svg/400px-Front_squat_with_barbell_1.svg.png`,  keywords: ['front', 'squat', 'barbell', 'quads', 'legs'] },
  { name: 'Goblet Squat',             gifUrl: `${W}/thumb/d/d1/Front_squat_with_barbell_1.svg/400px-Front_squat_with_barbell_1.svg.png`,  keywords: ['goblet', 'squat', 'dumbbell', 'kettlebell', 'quads', 'legs'] },
  { name: 'Hack Squat',               gifUrl: `${W}/thumb/d/d1/Front_squat_with_barbell_1.svg/400px-Front_squat_with_barbell_1.svg.png`,  keywords: ['hack', 'squat', 'machine', 'legs', 'quads'] },
  { name: 'Bulgarian Split Squat',    gifUrl: `${W}/8/8e/Lunges-2-2.png`,                                                                 keywords: ['bulgarian', 'split', 'squat', 'rear', 'foot', 'elevated', 'rfess', 'single', 'leg', 'unilateral', 'glute'] },
  { name: 'Leg Press',                gifUrl: `${W}/0/0c/Leg-press-1-1024x670.png`,                                                       keywords: ['leg', 'press', 'machine', '45', 'degree', 'quads', 'legs'] },
  { name: 'Leg Extension',            gifUrl: `${W}/thumb/6/6d/Leg_extensions_1.svg/400px-Leg_extensions_1.svg.png`,                     keywords: ['leg', 'extension', 'machine', 'quad', 'seated', 'legs'] },
  { name: 'Leg Curl',                 gifUrl: `${W}/3/3e/Seated-leg-curl-1.png`,                                                          keywords: ['leg', 'curl', 'hamstring', 'machine', 'lying', 'seated', 'legs'] },
  { name: 'Lunge',                    gifUrl: `${W}/5/55/Lunges-1.png`,                                                                   keywords: ['lunge', 'bodyweight', 'dumbbell', 'reverse', 'stationary', 'split', 'lateral', 'side', 'sumo', 'legs'] },
  { name: 'Walking Lunge',            gifUrl: `${W}/thumb/b/ba/Walking_lunges_1.svg/400px-Walking_lunges_1.svg.png`,                     keywords: ['walking', 'lunge', 'dumbbell', 'barbell', 'legs'] },
  { name: 'Barbell Lunge',            gifUrl: `${W}/thumb/8/8a/Barbell_lunges_1.svg/400px-Barbell_lunges_1.svg.png`,                    keywords: ['barbell', 'lunge', 'legs'] },
  { name: 'Calf Raise',               gifUrl: `${W}/6/64/Standing-calf-raises-2.gif`,                                                    keywords: ['calf', 'raise', 'standing', 'seated', 'single', 'leg', 'donkey', 'machine', 'calves'] },
  { name: 'Step Up',                  gifUrl: `${W}/1/1e/Step-ups-2-2-553x1024.png`,                                                     keywords: ['step', 'up', 'box', 'dumbbell', 'barbell', 'legs', 'glute'] },
  { name: 'Hip Thrust',               gifUrl: null,                                                                                       keywords: ['hip', 'thrust', 'barbell', 'glute', 'bridge', 'weighted', 'glutes'] },
  { name: 'Glute Bridge',             gifUrl: null,                                                                                       keywords: ['glute', 'bridge', 'hip', 'barbell', 'bodyweight', 'glutes'] },
  { name: 'Donkey Kick',              gifUrl: `${W}/8/8e/Lunges-2-2.png`,                                                                keywords: ['donkey', 'kick', 'glute', 'kickback', 'fire', 'hydrant', 'glutes'] },
  { name: 'Box Jump',                 gifUrl: `${W}/1/1e/Step-ups-2-2-553x1024.png`,                                                     keywords: ['box', 'jump', 'plyometric', 'explosive', 'squat', 'legs'] },
  { name: 'Flutter Kick',             gifUrl: `${W}/thumb/1/19/Flutter_kicks_1.svg/400px-Flutter_kicks_1.svg.png`,                       keywords: ['flutter', 'kick', 'scissor', 'leg', 'core', 'abs'] },
  { name: 'Leg Lift',                 gifUrl: `${W}/4/43/Leg-lift-1.png`,                                                                 keywords: ['leg', 'lift', 'raise', 'lying', 'straight', 'lower', 'abs', 'core'] },

  // ── CORE ──────────────────────────────────────────────────────
  { name: 'Crunch',                   gifUrl: `${W}/thumb/1/11/Crunches_1.svg/400px-Crunches_1.svg.png`,                                 keywords: ['crunch', 'ab', 'basic', 'standard', 'core', 'abs'] },
  { name: 'Bicycle Crunch',           gifUrl: `${W}/thumb/1/11/Crunches_1.svg/400px-Crunches_1.svg.png`,                                 keywords: ['bicycle', 'crunch', 'alternating', 'air', 'bike', 'ab', 'core', 'oblique'] },
  { name: 'Decline Crunch',           gifUrl: `${W}/thumb/9/96/Decline_crunch_1.svg/400px-Decline_crunch_1.svg.png`,                    keywords: ['decline', 'crunch', 'weighted', 'ab', 'core'] },
  { name: 'Cross Body Crunch',        gifUrl: `${W}/thumb/4/41/Cross_body_crunch_1.svg/400px-Cross_body_crunch_1.svg.png`,               keywords: ['cross', 'body', 'crunch', 'oblique', 'rotational', 'twisting', 'ab', 'core'] },
  { name: 'Decline Oblique Crunch',   gifUrl: `${W}/thumb/a/a7/Decline_oblique_crunch_1.svg/400px-Decline_oblique_crunch_1.svg.png`,    keywords: ['decline', 'oblique', 'crunch', 'ab', 'core'] },
  { name: 'Cable Crunch',             gifUrl: `${W}/thumb/7/78/Seated_ab_crunch_with_cable_1.svg/400px-Seated_ab_crunch_with_cable_1.svg.png`, keywords: ['cable', 'crunch', 'rope', 'kneeling', 'overhead', 'ab', 'core'] },
  { name: 'Sit-Up',                   gifUrl: `${W}/e/ec/Decline-sit-up-2.png`,                                                          keywords: ['sit', 'up', 'situp', 'decline', 'full', 'ab', 'core'] },
  { name: 'Plank',                    gifUrl: `${W}/thumb/f/fb/Side_plank_1.svg/400px-Side_plank_1.svg.png`,                            keywords: ['plank', 'forearm', 'high', 'hold', 'core', 'abs'] },
  { name: 'Side Plank',               gifUrl: `${W}/thumb/f/fb/Side_plank_1.svg/400px-Side_plank_1.svg.png`,                            keywords: ['side', 'plank', 'lateral', 'hold', 'oblique', 'core'] },
  { name: 'Leg Raise',                gifUrl: `${W}/4/41/Leg-raises-1.png`,                                                              keywords: ['leg', 'raise', 'hanging', 'captain', 'chair', 'knee', 'ab', 'core'] },
  { name: 'Russian Twist',            gifUrl: `${W}/e/ec/Decline-sit-up-2.png`,                                                          keywords: ['russian', 'twist', 'oblique', 'seated', 'medicine', 'ball', 'core', 'abs'] },
  { name: 'Mountain Climber',         gifUrl: `${W}/1/1a/Push-ups-2.png`,                                                                keywords: ['mountain', 'climber', 'running', 'plank', 'core', 'cardio'] },
  { name: 'Ab Rollout',               gifUrl: `${W}/thumb/1/15/Ab_rollout_with_barbell_1.svg/400px-Ab_rollout_with_barbell_1.svg.png`,  keywords: ['ab', 'rollout', 'wheel', 'barbell', 'core', 'abs'] },
  { name: 'Ab Rollout on Knees',      gifUrl: `${W}/thumb/b/ba/Ab_rollout_on_knees_with_barbell_1.svg/400px-Ab_rollout_on_knees_with_barbell_1.svg.png`, keywords: ['ab', 'rollout', 'knees', 'kneeling', 'wheel', 'core'] },
  { name: 'Side Bend',                gifUrl: `${W}/thumb/3/39/Side_bend_with_dumbbell_1.svg/400px-Side_bend_with_dumbbell_1.svg.png`,  keywords: ['side', 'bend', 'dumbbell', 'oblique', 'lateral', 'core'] },
  { name: 'V-Up',                     gifUrl: `${W}/4/41/Leg-raises-1.png`,                                                              keywords: ['v', 'up', 'jackknife', 'hollow', 'body', 'ab', 'core'] },
]

/**
 * Search exercises by query string.
 * Returns matching exercises sorted by relevance.
 */
export function searchExercises(query, maxResults = 15) {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase().trim()
  const qWords = q.split(/\s+/).filter(w => w.length > 1)

  const scored = EXERCISE_LIST.map(ex => {
    const nameLower = ex.name.toLowerCase()
    const allWords = [...nameLower.split(/\s+/), ...ex.keywords]

    let score = 0

    // Exact name match = highest priority
    if (nameLower === q) score += 100

    // Name starts with query
    if (nameLower.startsWith(q)) score += 50

    // Name contains query as substring
    if (nameLower.includes(q)) score += 30

    // All query words appear in name or keywords
    const allQWordsMatch = qWords.every(w => allWords.some(k => k.startsWith(w)))
    if (allQWordsMatch && qWords.length > 0) score += 20

    // Partial: each query word that matches adds points
    qWords.forEach(w => {
      if (nameLower.includes(w)) score += 10
      else if (ex.keywords.some(k => k.includes(w))) score += 5
    })

    return { ...ex, score }
  })

  return scored
    .filter(ex => ex.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}
