import { useState, useEffect } from 'react'
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
        const total = count.split('/')[1]
        setPlanCount(parseInt(total))
      } else {
        const data = await res.json()
        setPlanCount(data.length)
      }
    } catch {}
  }

  const faqs = [
    {
      q: 'Is this actually personalized or just a template?',
      a: 'Every plan is generated specifically based on your weight, height, age, training days and goals. No two plans are the same.',
    },
    {
      q: 'Why not just use ChatGPT?',
      a: "Most people don't know how to prompt AI for a proper training program. This tool does that automatically and delivers it clean and structured to your inbox.",
    },
    {
      q: 'How long does it take to receive my plan?',
      a: 'Usually within a few minutes after filling out the form.',
    },
    {
      q: 'Is my data safe?',
      a: 'Your data is only used to generate your plan and is never sold or shared. See our Privacy Policy for details.',
    },
    {
      q: 'What if I am not satisfied?',
      a: 'Contact us at precisiontraining930@gmail.com and we will make it right.',
    },
    {
      q: 'Can I modify my plan after receiving it?',
      a: 'Yes. Your plan page lets you swap exercises, add new ones, remove exercises you dislike, and track your progress week by week.',
    },
  ]

  return (
    <div className={styles.page}>
      <Navbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span>Your Body.</span>
            <span>Your System.</span>
            <span className={styles.heroGold}>Your Results.</span>
          </h1>
          <p className={styles.heroSub}>
            A fully customized plan built around your body, schedule and goals — delivered instantly to your inbox.
          </p>
          <div className={styles.heroBtns}>
            <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
              Get My Training Plan →
            </a>
            <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
              Get My Nutrition Plan →
            </a>
          </div>
          <div className={styles.pricingNote}>
            <span>Free right now · normally €12</span>
            <span>Free right now · normally €12</span>
          </div>
          {planCount !== null && (
            <div className={styles.counter}>
              <span className={styles.counterNum}>{planCount}</span>
              <span className={styles.counterText}>personalized plans delivered and counting</span>
            </div>
          )}
        </div>
      </section>

      {/* PROBLEM */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Effort isn't the problem.</h2>
        <p className={styles.sectionSub}>The missing system is.</p>
        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>↘</div>
            <h3>No measurable progress</h3>
            <p>You're working hard, but not moving forward.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>⇄</div>
            <h3>No structured system</h3>
            <p>Your workouts feel random instead of strategic.</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>↑</div>
            <h3>No progression framework</h3>
            <p>Without calculated overload, growth stalls.</p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What you <span className={styles.gold}>get</span></h2>
        <div className={styles.whatYouGet}>
          <div className={styles.planCard}>
            <div className={styles.planPreview}>
              <div className={styles.previewTable}>
                <div className={styles.previewHeader}>Daily Workouts</div>
                <div className={styles.previewRow}>
                  <span>Monday – Upper Body Strength</span>
                </div>
                <table className={styles.miniTable}>
                  <thead>
                    <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Rest</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Bench Press</td><td>4</td><td>6–8</td><td>2 min</td></tr>
                    <tr><td>Pull-Ups</td><td>3</td><td>6–8</td><td>2 min</td></tr>
                    <tr><td>OHP</td><td>3</td><td>8–10</td><td>90s</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <h3>Your Personal Training Plan</h3>
            <ul className={styles.featureList}>
              <li>✓ Personalized weekly split</li>
              <li>✓ Exercise selection based on your body and goals</li>
              <li>✓ Sets, reps and rest times included</li>
              <li>✓ Built-in progression system</li>
              <li>✓ Swap or add exercises anytime</li>
              <li>✓ Progress Tracker to log your weights weekly</li>
              <li>✓ AI Coach that knows your exact plan</li>
              <li>✓ Delivered as password-protected personal page</li>
            </ul>
            <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.btnFull}>
              Get My Training Plan →
            </a>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planPreview}>
              <div className={styles.previewTable}>
                <div className={styles.previewHeader}>Meal 1: Breakfast</div>
                <table className={styles.miniTable}>
                  <thead>
                    <tr><th>Food Item</th><th>Amount</th><th>kcal</th><th>Protein</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Whole Eggs</td><td>150g</td><td>210</td><td>18g</td></tr>
                    <tr><td>Oats</td><td>100g</td><td>389</td><td>17g</td></tr>
                    <tr><td>Greek Yogurt</td><td>200g</td><td>120</td><td>20g</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <h3>Your Personal Nutrition Plan</h3>
            <ul className={styles.featureList}>
              <li>✓ Custom calorie and macro targets based on your personal body data</li>
              <li>✓ Exact meal plan with portions in grams per meal</li>
              <li>✓ Food preferences, diet type and allergies respected</li>
              <li>✓ Swap meals to fit your preferences</li>
              <li>✓ Supplement stack with dosages and timing</li>
              <li>✓ Weekly grocery list and meal prep tips</li>
              <li>✓ AI Coach that knows your exact nutrition plan</li>
              <li>✓ Delivered as password-protected personal page</li>
            </ul>
            <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.btnFull}>
              Get My Nutrition Plan →
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className={styles.section}>
        <div className={styles.about}>
          <h2 className={styles.aboutTitle}>Who is behind this?</h2>
          <p className={styles.aboutText}>
            I'm Flo, 17 years old and based in Munich, Germany. I built Precision Training because I was tired of generic workout plans that ignore your actual stats. This tool builds your plan around your body — not someone else's.
          </p>
        </div>
      </section>

      {/* 3 STEPS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3 steps to <span className={styles.gold}>your plan.</span></h2>
        <div className={styles.stepsWrap}>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <div>
                <h3>Fill out the form</h3>
                <p>Age, weight, height, training days, goals.</p>
              </div>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <div>
                <h3>AI builds your plan</h3>
                <p>A custom system generated specifically for you.</p>
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

      {/* FAQ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Frequently Asked <span className={styles.gold}>Questions</span></h2>
        <div className={styles.faqList}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.faqItem} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div className={styles.faqQ}>
                <span>{faq.q}</span>
                <span className={styles.faqArrow}>{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && <div className={styles.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>
          Stop guessing. <span className={styles.gold}>Start growing.</span>
        </h2>
        <p className={styles.ctaSub}>No templates. No copy-paste programs. Just precision training.</p>
        <div className={styles.heroBtns}>
          <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
            Get My Training Plan →
          </a>
          <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.btnSecondary}>
            Get My Nutrition Plan →
          </a>
        </div>
      </section>

      {/* FOOTER */}
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
