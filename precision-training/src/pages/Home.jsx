import { useState, useEffect } from 'react'
import HeroScroll from '../components/HeroScroll'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { SUPABASE_URL, SUPABASE_ANON_KEY, TALLY_TRAINING, TALLY_NUTRITION } from '../constants'
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
      a: 'No. It is a one-time payment per plan. No subscription, no automatic renewal, no hidden fees.',
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
      <HeroScroll tallyTraining={TALLY_TRAINING} tallyNutrition={TALLY_NUTRITION} />

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

      {/* ── WHAT YOU GET ──────────────────────────────── */}
      <section className={styles.section}>
        <p className={styles.eyebrow}>WHAT YOU GET</p>
        <h2 className={styles.sectionTitle}>Two systems. <span className={styles.gold}>One goal.</span></h2>
        <div className={styles.whatYouGet}>
          <div className={styles.planCard}>
            <div className={styles.planPreview}>
              <img src="/preview-training.png" alt="Training Plan Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: '10px', display: 'block' }} />
            </div>
            <h3>Your Personal Training Plan</h3>
            <ul className={styles.featureList}>
              <li><span className={styles.check}>✓</span><span>Personalized weekly split</span></li>
              <li><span className={styles.check}>✓</span><span>Exercise selection based on your body and goals</span></li>
              <li><span className={styles.check}>✓</span><span>Sets, reps and rest times included</span></li>
              <li><span className={styles.check}>✓</span><span>Built-in progression system</span></li>
              <li><span className={styles.check}>✓</span><span>Swap or add exercises anytime</span></li>
              <li><span className={styles.check}>✓</span><span>Progress Tracker to log your weights weekly</span></li>
              <li><span className={styles.check}>✓</span><span>Plan Insights that detect stagnation and suggest adjustments</span></li>
              <li><span className={styles.check}>✓</span><span>AI Coach that knows your exact plan</span></li>
              <li><span className={styles.check}>✓</span><span>Delivered as password-protected personal page</span></li>
            </ul>
            <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.btnFull}>
              Get My Training Plan →
            </a>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planPreview}>
              <img src="/preview-nutrition.png" alt="Nutrition Plan Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: '10px', display: 'block' }} />
            </div>
            <h3>Your Personal Nutrition Plan</h3>
            <ul className={styles.featureList}>
              <li><span className={styles.check}>✓</span><span>Custom calorie and macro targets based on your body data</span></li>
              <li><span className={styles.check}>✓</span><span>Exact meal plan with portions in grams per meal</span></li>
              <li><span className={styles.check}>✓</span><span>Food preferences, diet type and allergies respected</span></li>
              <li><span className={styles.check}>✓</span><span>Swap meals to fit your preferences</span></li>
              <li><span className={styles.check}>✓</span><span>Supplement stack with dosages and timing</span></li>
              <li><span className={styles.check}>✓</span><span>Weekly grocery list and meal prep tips</span></li>
              <li><span className={styles.check}>✓</span><span>AI Coach that knows your exact nutrition plan</span></li>
              <li><span className={styles.check}>✓</span><span>Delivered as password-protected personal page</span></li>
            </ul>
            <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.btnFull}>
              Get My Nutrition Plan →
            </a>
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
            <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.formLink}>
              <span className={styles.formLinkTitle}>AI Training Plan</span>
              <span className={styles.formLinkSub}>Get your personalized workout program →</span>
            </a>
            <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.formLink}>
              <span className={styles.formLinkTitle}>AI Nutrition Plan</span>
              <span className={styles.formLinkSub}>Get your personalized meal plan →</span>
            </a>
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
            Stop guessing. <span className={styles.gold}>Start growing.</span>
          </h2>
          <p className={styles.ctaSub}>
            No templates. No copy-paste programs. Just precision.
          </p>
          <div className={styles.heroBtns}>
            <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
              Get My Training Plan →
            </a>
            <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
              Get My Nutrition Plan →
            </a>
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
          <Link to="/impressum">Impressum</Link>
        </div>
        <div className={styles.footerCopy}>© 2026 Precision Training. All rights reserved.</div>
      </footer>
    </div>
  )
}
