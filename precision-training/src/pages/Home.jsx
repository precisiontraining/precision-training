import { useState, useEffect } from 'react'
import HeroScroll from '../components/HeroScroll'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ComparisonSection from '../components/ComparisonSection'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'
import styles from './Home.module.css'

export default function Home() {
  const [planCount, setPlanCount] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCount() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/plans?select=id`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'count=exact',
        },
      })
      const count = res.headers.get('content-range')
      if (count) {
        setPlanCount(parseInt(count.split('/')[1]))
      } else {
        const data = await res.json()
        setPlanCount(data.length)
      }
    } catch {}
  }

  const faqs = [
    {
      q: 'Is this actually personalized or just a template?',
      a: 'Every plan is individually generated based on your exact data: bodyweight, height, age, training frequency, experience level and primary goal. The AI creates a unique split, exercise selection, set and rep scheme, and a full progression system — tailored specifically to you. No two plans are identical.',
    },
    {
      q: 'How is the plan actually personalized to me?',
      a: 'When you submit the form, your data — bodyweight, height, age, training frequency, experience level and goal — runs through a system built specifically for fitness programming. Every number in your plan (calorie target, macro split, training volume, progression) is calculated from your inputs. No two plans are the same because no two people are the same.',
    },
    {
      q: 'Why not just use ChatGPT myself?',
      a: "Getting a genuinely useful training or nutrition plan from ChatGPT requires deep knowledge of programming principles, macronutrient science and how to interpret body data. Most people get vague, generic results. Precision Training uses a purpose-built system that processes your data correctly and delivers a clean, structured, immediately usable plan — directly to your inbox.",
    },
    {
      q: 'How long until I receive my plan?',
      a: "Typically within 1–5 minutes after submitting the form. You'll receive an email with a direct link to your personal, password-protected plan page.",
    },
    {
      q: 'Is my personal data safe?',
      a: 'Yes. Your data is processed exclusively to generate your plan. It is never sold, shared, or used for any form of advertising. All plans are delivered on password-protected pages accessible only to you. See our Privacy Policy for full details.',
    },
    {
      q: 'Who can access my plan?',
      a: 'Only you. Each plan is delivered on a unique URL protected by a personal password. Your credentials are not stored in plain text. No one else can access your plan page without both your specific link and password.',
    },
    {
      q: "What if I'm not satisfied with my plan?",
      a: 'Contact us at info@precision-training.io within 14 days of receiving your plan. Describe what feels off or what is missing, and we will revise it based on your feedback — at no additional cost.',
    },
    {
      q: 'Can I adjust my plan after I receive it?',
      a: 'Yes. Your plan page lets you swap exercises, add new ones, remove exercises you dislike, and log your weights weekly to track progression. Your built-in AI Coach also knows your exact plan and can answer any question about adjustments, technique or recovery.',
    },
    {
      q: 'Do I need a gym membership?',
      a: 'No. When completing the form, you specify what equipment you have access to. Plans can be built for a full gym, a home setup with limited equipment, or pure bodyweight training. The system adapts the entire program to what you actually have available.',
    },
    {
      q: 'Is there a subscription or recurring charge?',
      a: 'Your plan is completely free — no credit card, no subscription. You get your full personalized plan, progress tracker, and AI Coach included. A Premium tier with advanced features (unlimited swaps, stagnation detection, PDF exports, wearable sync) is coming soon for users who want more.',
    },
    {
      q: 'What information do I need to provide?',
      a: 'Age, bodyweight, height, training days per week, primary goal (muscle gain, fat loss or maintenance), experience level, available equipment and any dietary preferences or restrictions. The form walks you through everything and takes approximately 2 minutes.',
    },
    {
      q: 'How is this different from hiring a personal trainer?',
      a: 'A certified personal trainer typically charges €50–150 per session — plus separate programming time. Precision Training delivers the same quality of individualized programming at a fraction of the cost, instantly, accessible from any device, with a built-in AI Coach included.',
    },
  ]

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── SCROLL HERO ──────────────────────────────────── */}
      <HeroScroll trainingPath="/form/training" nutritionPath="/form/nutrition" glp1Path="/form/glp1" glp1NutritionPath="/form/glp1-nutrition" />

      {/* ── STATS BAR ─────────────────────────────────── */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>
            {planCount !== null ? planCount.toLocaleString() : '—'}
          </span>
          <span className={styles.statLabel}>Plans Delivered</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statNum}>{'< 3 min'}</span>
          <span className={styles.statLabel}>Avg. Delivery Time</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statNum}>100%</span>
          <span className={styles.statLabel}>Individually Built</span>
        </div>
      </div>

      {/* ── PROBLEM ───────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Effort isn't the problem.</h2>
        <p className={styles.sectionSub}>The missing system is.</p>
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3>No measurable progress</h3>
            <p>You're working hard, but not moving forward. Without structure, effort doesn't compound.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>No structured system</h3>
            <p>Your workouts feel random instead of strategic. Without a plan, every session is a guess.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>No progression framework</h3>
            <p>Without calculated overload, your body adapts and growth stalls. Precision beats volume.</p>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET — GLP-1 FIRST ───────────────── */}
      <section className={styles.section}>
        <p className={styles.eyebrow} style={{ color: '#6db88a' }}>THE GLP-1 MUSCLE GUARD SYSTEM</p>
        <h2 className={styles.sectionTitle}>Built for <span style={{ color: '#6db88a' }}>Ozempic & Wegovy</span> users.</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, maxWidth: 560, margin: '0 auto 48px', textAlign: 'center', lineHeight: 1.8 }}>
          GLP-1 medications cause rapid weight loss — but up to 40% of that weight can be muscle. The GLP-1 Muscle Guard System is purpose-built to prevent that.
        </p>

        <div className={styles.whatYouGet}>
          {/* GLP-1 Training */}
          <div className={styles.planCard} style={{ borderColor: 'rgba(109,184,138,0.2)', background: 'linear-gradient(160deg, rgba(109,184,138,0.04) 0%, rgba(0,0,0,0) 100%)' }}>
            <div className={styles.planPreview} style={{ background: 'rgba(109,184,138,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#6db88a' }}>GLP-1 Muscle Guard</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Training Plan</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h3 style={{ color: '#6db88a', margin: 0 }}>GLP-1 Training Plan</h3>
              <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(109,184,138,0.12)', border: '1px solid rgba(109,184,138,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#6db88a', whiteSpace: 'nowrap' }}>MUSCLE GUARD</span>
            </div>
            <ul className={styles.featureList}>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>3× Full-Body per week — hits every muscle group 2–3x</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>30–45 min sessions — designed for low-energy days</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Compound-first programming for maximum muscle signal</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span><strong style={{ color: '#6db88a' }}>🛡️ MuscleGuard Score</strong> — weekly 0–100 muscle preservation index</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Syncs with your Nutrition Plan — protein & calories feed your score automatically</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Low-energy day adjustment built into every session</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>3 exercise swaps per week (free tier)</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Progress Tracker — log weights, view history</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>AI Coach — 5 questions/day, knows your plan</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Password-protected personal page</span></li>
            </ul>
            <Link to="/form/glp1" className={styles.btnFull} style={{ background: 'linear-gradient(135deg,#4a9e68,#6db88a)', boxShadow: '0 6px 22px rgba(100,180,130,0.25)' }}>
              Get My GLP-1 Training Plan →
            </Link>
          </div>

          {/* GLP-1 Nutrition */}
          <div className={styles.planCard} style={{ borderColor: 'rgba(109,184,138,0.2)', background: 'linear-gradient(160deg, rgba(109,184,138,0.04) 0%, rgba(0,0,0,0) 100%)' }}>
            <div className={styles.planPreview} style={{ background: 'rgba(109,184,138,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#6db88a' }}>GLP-1 Muscle Guard</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Nutrition Plan</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h3 style={{ color: '#6db88a', margin: 0 }}>GLP-1 Nutrition Plan</h3>
              <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(109,184,138,0.12)', border: '1px solid rgba(109,184,138,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#6db88a', whiteSpace: 'nowrap' }}>MUSCLE GUARD</span>
            </div>
            <ul className={styles.featureList}>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>High-protein meals: 1.6–2.2 g/kg target built in</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Easy-to-digest food choices — anti-nausea optimized</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Leucine-rich sources to maximize muscle protein synthesis</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Exact portions per meal in grams</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span><strong style={{ color: '#6db88a' }}>🛡️ MuscleGuard Score</strong> — your nutrition data feeds the weekly score</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Connects to your Training Plan — one score across both plans</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Adapted to your GLP-1 stage (Starting / Maintenance etc.)</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Grocery list, meal prep tips, supplement stack</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>3 meal swaps per week (free tier)</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>AI Coach — 5 questions/day, knows your nutrition targets</span></li>
              <li><span className={styles.check} style={{ color: '#6db88a' }}>✓</span><span>Password-protected personal page</span></li>
            </ul>
            <Link to="/form/glp1-nutrition" className={styles.btnFull} style={{ background: 'linear-gradient(135deg,#4a9e68,#6db88a)', boxShadow: '0 6px 22px rgba(100,180,130,0.25)' }}>
              Get My GLP-1 Nutrition Plan →
            </Link>
          </div>
        </div>

        {/* Standard plans — secondary */}
        <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 20 }}>Not on GLP-1 medication?</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/form/training" style={{ padding: '11px 22px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)'; e.currentTarget.style.color = '#c8a96e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
              Standard Training Plan →
            </Link>
            <Link to="/form/nutrition" style={{ padding: '11px 22px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)'; e.currentTarget.style.color = '#c8a96e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
              Standard Nutrition Plan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3 STEPS ───────────────────────────────────── */}
      <section className={styles.section}>
        <p className={styles.eyebrow}>HOW IT WORKS</p>
        <h2 className={styles.sectionTitle}>3 steps to <span className={styles.gold}>your plan.</span></h2>
        <div className={styles.stepsWrap}>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <div>
                <h3>Fill out the form</h3>
                <p>Age, weight, height, training days, goals. Takes about 2 minutes.</p>
              </div>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <div>
                <h3>AI builds your plan</h3>
                <p>A custom system generated specifically for your body, schedule and goals.</p>
              </div>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <div>
                <h3>Receive it instantly</h3>
                <p>Delivered as a password-protected personal page within minutes.</p>
              </div>
            </div>
          </div>
          <div className={styles.formLinks}>
            <Link to="/form/glp1" className={styles.formLink} style={{ borderColor: 'rgba(109,184,138,0.25)', background: 'rgba(109,184,138,0.03)' }}>
              <span className={styles.formLinkTitle} style={{ color: '#6db88a' }}>💊 GLP-1 Training Plan</span>
              <span className={styles.formLinkSub}>Preserve muscle while on Ozempic / Wegovy →</span>
            </Link>
            <Link to="/form/glp1-nutrition" className={styles.formLink} style={{ borderColor: 'rgba(109,184,138,0.25)', background: 'rgba(109,184,138,0.03)' }}>
              <span className={styles.formLinkTitle} style={{ color: '#6db88a' }}>💊 GLP-1 Nutrition Plan</span>
              <span className={styles.formLinkSub}>High-protein, easy-to-digest, stage-optimized →</span>
            </Link>
            <Link to="/form/training" className={styles.formLink}>
              <span className={styles.formLinkTitle}>Standard Training Plan</span>
              <span className={styles.formLinkSub}>Get your personalized workout program →</span>
            </Link>
            <Link to="/form/nutrition" className={styles.formLink}>
              <span className={styles.formLinkTitle}>Standard Nutrition Plan</span>
              <span className={styles.formLinkSub}>Get your personalized meal plan →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── THE METHOD ────────────────────────────────── */}
      <section className={styles.methodSection}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>THE METHOD</p>
          <h2 className={styles.sectionTitle}>Why it <span className={styles.gold}>actually works.</span></h2>
          <p className={styles.methodIntro}>
            Most programs fail not because the person gives up, but because the plan was never built for them in the first place.
          </p>
          <div className={styles.methodGrid}>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3>Built for your body</h3>
              <p>Every number in your plan — weights, sets, calories, macros — is derived from your actual data. Not population averages. Not a generic template. Your inputs, your output.</p>
            </div>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3>The math is done for you</h3>
              <p>Calorie targets are calculated from your body data and activity level. Progressive overload is built into the structure from week one — you don't have to figure any of it out.</p>
            </div>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>Private by Design</h3>
              <p>Your plan is delivered to a unique, password-protected page accessible only to you. Your data is never sold, rented or used for advertising — ever.</p>
            </div>
            <div className={styles.methodCard}>
              <div className={styles.methodIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Ready in Minutes</h3>
              <p>No scheduling, no waiting, no back-and-forth. Fill out the form, and your personalized plan is ready in your inbox within minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCIENCE BEHIND IT ─────────────────────────── */}
      <section className={styles.section}>
        <p className={styles.eyebrow}>THE SCIENCE</p>
        <h2 className={styles.sectionTitle}>Built on <span className={styles.gold}>peer-reviewed research.</span></h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, maxWidth: 580, margin: '0 auto 40px', textAlign: 'center', lineHeight: 1.8 }}>
          Every protocol in Precision Training is grounded in published exercise science and sports nutrition research — not trends, not influencer advice.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16, maxWidth: 900, margin: '0 auto' }}>
          {[
            {
              stat: '1.6–2.2 g/kg',
              label: 'Optimal protein intake',
              desc: 'Meta-analysis of 49 studies (Morton et al., 2018, Br J Sports Med) confirms this range maximizes muscle protein synthesis.',
              color: '#6db88a',
            },
            {
              stat: '~2× / week',
              label: 'Minimum effective frequency',
              desc: 'Schoenfeld et al. (2016, J Strength Cond Res): training each muscle group twice per week produces significantly greater hypertrophy than once.',
              color: '#c8a96e',
            },
            {
              stat: '~40% muscle loss',
              label: 'Risk on GLP-1 without resistance training',
              desc: 'Wilding et al. & NEJM data: rapid weight loss on GLP-1 medications without resistance training can result in up to 40% of weight lost being lean mass.',
              color: '#e06060',
            },
            {
              stat: 'Progressive overload',
              label: 'The #1 driver of strength gain',
              desc: 'American College of Sports Medicine Position Stand: systematic progressive overload is the single most important variable for long-term muscle and strength development.',
              color: '#6e9dc8',
            },
          ].map(item => (
            <div key={item.label} style={{
              padding: '24px 20px', borderRadius: 14,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 'clamp(16px,4vw,22px)', fontWeight: 800, color: item.color, marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>{item.stat}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: 0.5 }}>
          For informational purposes only. Not medical advice. <Link to="/terms" style={{ color: 'rgba(200,169,110,0.4)', textDecoration: 'none' }}>Full disclaimer →</Link>
        </p>
      </section>

      {/* ── GLP-1 MEDICAL DISCLAIMER ──────────────────── */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div style={{
          maxWidth: 760, margin: '0 auto', padding: '20px 24px', borderRadius: 14,
          background: 'rgba(220,80,80,0.04)', border: '1px solid rgba(220,80,80,0.15)',
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚕️</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(220,80,80,0.7)', marginBottom: 8 }}>Important — GLP-1 Users</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8, margin: 0 }}>
                The GLP-1 Muscle Guard plans are general fitness frameworks — they are <strong style={{ color: 'rgba(255,255,255,0.5)' }}>not medical advice</strong> and do not replace guidance from your prescribing physician. Always consult your healthcare provider before starting a new exercise or nutrition program while on medication. <Link to="/terms" style={{ color: 'rgba(200,169,110,0.5)', textDecoration: 'none' }}>Read full disclaimer →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREE vs PREMIUM ───────────────────────────── */}
      <section className={styles.section}>
        <p className={styles.eyebrow}>PRICING</p>
        <h2 className={styles.sectionTitle}>100% free to start. <span style={{ color: '#6db88a' }}>Premium coming soon.</span></h2>
        <div className={styles.pricingGrid} style={{ gap: 20, maxWidth: 760, margin: '0 auto' }}>
          {/* Free */}
          <div style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 20 }}>$0</div>
            {[
              'Full AI-generated training plan',
              'Full AI-generated nutrition plan',
              'GLP-1 Muscle Guard mode',
              'Password-protected personal page',
              '3 exercise swaps per week',
              '5 AI Coach questions per day',
              'Progress tracker (log weights)',
              'Grocery list (one-time)',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#6db88a', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
          {/* Premium */}
          <div style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(200,169,110,0.04)', border: '1px solid rgba(200,169,110,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 14, right: 14, padding: '3px 10px', borderRadius: 10, background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#c8a96e' }}>COMING SOON</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#c8a96e', marginBottom: 8 }}>Premium</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 20 }}>$19<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/mo</span></div>
            {[
              'Everything in Free',
              'Unlimited exercise & meal swaps',
              'Unlimited AI Coach (proactive suggestions)',
              'Advanced Plan Insights & stagnation alerts',
              'Muscle Preservation Dashboard',
              'Injection/med logging tied to plan',
              'Doctor-ready PDF progress reports',
              'Apple Health / Google Fit sync',
              'Weekly grocery list updates',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#c8a96e', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>
          Generate your free plan now. Premium notified at launch — no commitment.
        </p>
      </section>

      {/* ── COMPARISON ──────────────────────────────────── */}
      <ComparisonSection />

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className={styles.section}>
        <p className={styles.eyebrow}>FAQ</p>
        <h2 className={styles.sectionTitle}>Frequently Asked <span className={styles.gold}>Questions</span></h2>
        <div className={styles.faqList}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className={styles.faqQ}>
                <span>{faq.q}</span>
                <span className={styles.faqArrow}>{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && <div className={styles.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            Losing weight. <span style={{ color: '#6db88a' }}>Keep the muscle.</span>
          </h2>
          <p className={styles.ctaSub}>
            Purpose-built for GLP-1 users. Precision-built for your body.
          </p>
          <div className={styles.heroBtns}>
            <Link to="/form/glp1" className={styles.btnPrimary} style={{ background: 'linear-gradient(135deg,#4a9e68,#6db88a)', boxShadow: '0 8px 28px rgba(100,180,130,0.3)' }}>
              💊 GLP-1 Training Plan →
            </Link>
            <Link to="/form/glp1-nutrition" className={styles.btnSecondary} style={{ borderColor: 'rgba(109,184,138,0.35)', color: '#6db88a' }}>
              💊 GLP-1 Nutrition Plan →
            </Link>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/form/training" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1, textDecoration: 'none' }}>Standard Training Plan</Link>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <Link to="/form/nutrition" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1, textDecoration: 'none' }}>Standard Nutrition Plan</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span className={styles.gold}>Precision</span> Training
        </div>
        <div className={styles.footerLinks}>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Disclaimer</Link>
          <Link to="/impressum">Impressum</Link>
        </div>
        <div className={styles.footerCopy}>© 2026 Precision Training. All rights reserved.</div>
        <div style={{
          marginTop: 20, padding: '14px 20px', borderRadius: 10,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8, maxWidth: 640, margin: '20px auto 0', textAlign: 'center',
        }}>
          <strong style={{ color: 'rgba(255,255,255,0.3)' }}>Medical Disclaimer:</strong> Precision Training provides AI-generated fitness and nutrition plans for informational purposes only. This is not medical advice. Always consult a qualified healthcare professional before starting a new exercise or nutrition program, especially if you are taking GLP-1 medications or have pre-existing health conditions. See our <Link to="/terms" style={{ color: 'rgba(200,169,110,0.5)', textDecoration: 'none' }}>full disclaimer</Link>.
        </div>
      </footer>
    </div>
  )
}
