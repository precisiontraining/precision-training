import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MAKE_NUTRITION_WEBHOOK , WEBHOOK_SECRET } from '../constants'
import styles from './Form.module.css'

const LOCATION_OPTIONS_NUTRITION = [
  { id: '0706142e-f7b3-480d-b99d-d4d3ceac0592', text: 'United States' },
  { id: '38198812-8083-465f-9a27-9404aa402538', text: 'Canada' },
  { id: 'f5af3fba-fea5-4616-be93-db8372b1eba9', text: 'United Kingdom / Ireland' },
  { id: '9335c6c2-24f3-4806-b5f4-731207298730', text: 'Europe' },
  { id: 'e332d2e0-e76e-4730-a22b-8be8321ef4cb', text: 'Other' },
]

const TOTAL_STEPS = 5

function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

function buildPayload(form) {
  const id = generateId()
  return {
    formId: 'EkPJ4l',
    formName: 'AI NUTRITION PLAN',
    responseId: id,
    question_XGRWxL: form.location,
    question_qbJBbk: form.unit === 'metric' ? parseFloat(form.height) : null,
    question_QAzrAk: form.unit === 'metric' ? parseFloat(form.weight) : null,
    question_8kJQ1z: form.unit === 'imperial' ? parseFloat(form.height) : null,
    question_0Mb6QB: form.unit === 'imperial' ? parseFloat(form.weight) : null,
    question_9dR1JE: form.name,
    question_eB0Axx: form.email,
    question_Zd1Vdv: parseInt(form.age),
    question_NAbVAb: form.gender,
    question_9dR1d4: form.goal,
    question_eB0ABo: form.activity,
    question_WAKoAQ: parseInt(form.trainingDays),
    question_aBAxBy: form.diet,
    question_6dWkd5: form.avoidFoods || null,
    question_7daDdz: parseInt(form.mealsPerDay),
    question_blYklE: form.struggleToEat,
    question_42pE4k_consent: true,
    pt_token: WEBHOOK_SECRET,
  }
}

export default function FormNutrition() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '', email: '', age: '', gender: '',
    location: '',
    unit: 'imperial', weight: '', height: '',
    goal: '', activity: '', trainingDays: '',
    diet: 'none', avoidFoods: '',
    mealsPerDay: '', struggleToEat: '',
    consent: false,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function validate() {
    const e = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Required'
      if (!form.email.includes('@')) e.email = 'Valid email required'
      if (!form.age || +form.age < 13 || +form.age > 90) e.age = 'Enter a valid age (13–90)'
      if (!form.gender) e.gender = 'Required'
    }
    if (step === 2) {
      if (!form.location) e.location = 'Please select your location'
    }
    if (step === 3) {
      if (!form.weight || isNaN(form.weight)) e.weight = 'Required'
      if (!form.height || isNaN(form.height)) e.height = 'Required'
    }
    if (step === 4) {
      if (!form.goal) e.goal = 'Required'
      if (!form.activity.trim()) e.activity = 'Required'
      if (!form.trainingDays) e.trainingDays = 'Required'
    }
    if (step === 5) {
      if (!form.mealsPerDay) e.mealsPerDay = 'Required'
      if (!form.struggleToEat) e.struggleToEat = 'Required'
      if (!form.consent) e.consent = 'Please accept to continue'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() { if (!validate()) return; setStep(s => s + 1); setErrors({}) }
  function back() { setStep(s => s - 1); setErrors({}) }

  async function submit() {
    if (!validate()) return
    setLoading(true)
    try {
      await fetch(MAKE_NUTRITION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
      })
    } catch {}
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className={styles.page}>
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.successTitle}>On its way, {form.name.split(' ')[0]}.</div>
        <p className={styles.successSub}>
          Your personalized nutrition plan is being generated right now.<br />
          Check <strong style={{ color: '#fff' }}>{form.email}</strong> — it'll arrive within 1–5 minutes.
        </p>
        <div className={styles.successNote}>No account · No subscription · One-time only</div>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/')}>← Back</button>
      <div className={styles.logo}><span className={styles.logoGold}>Precision</span> Training</div>

      <div className={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`${styles.dot} ${i + 1 === step ? styles.dotActive : i + 1 < step ? styles.dotDone : ''}`} />
        ))}
      </div>

      <div key={step} className={styles.card}>
        <div className={styles.badge}>AI Nutrition Plan</div>
        <div className={styles.stepOf}>Step {step} of {TOTAL_STEPS}</div>

        {step === 1 && <>
          <div className={styles.title}>Tell us about yourself.</div>
          <div className={styles.sub}>Used to calculate your exact calorie and macro targets.</div>
          <div className={styles.fields}>
            <div>
              <label className={styles.label}>First Name</label>
              <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`} placeholder="e.g. Alex" value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <div className={styles.errorMsg}>{errors.name}</div>}
            </div>
            <div>
              <label className={styles.label}>Email Address</label>
              <input className={`${styles.input} ${errors.email ? styles.inputError : ''}`} type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <div className={styles.errorMsg}>{errors.email}</div>}
            </div>
            <div>
              <label className={styles.label}>Age</label>
              <input className={`${styles.input} ${errors.age ? styles.inputError : ''}`} type="number" placeholder="e.g. 28" value={form.age} onChange={e => set('age', e.target.value)} />
              {errors.age && <div className={styles.errorMsg}>{errors.age}</div>}
            </div>
            <div>
              <label className={styles.label}>Gender</label>
              <div className={styles.choiceGrid}>
                {['male', 'female'].map(g => (
                  <button key={g} className={`${styles.choice} ${form.gender === g ? styles.choiceActive : ''}`} onClick={() => set('gender', g)} style={{ textTransform: 'capitalize' }}>{g}</button>
                ))}
              </div>
              {errors.gender && <div className={styles.errorMsg}>{errors.gender}</div>}
            </div>
          </div>
        </>}

        {step === 2 && <>
          <div className={styles.title}>Where are you based?</div>
          <div className={styles.sub}>Helps us adapt food recommendations to your region.</div>
          <div className={`${styles.choiceGrid} ${styles.choiceGridWide}`}>
            {LOCATION_OPTIONS_NUTRITION.map(opt => (
              <button key={opt.id} className={`${styles.choice} ${form.location === opt.text ? styles.choiceActive : ''}`} onClick={() => set('location', opt.text)}>{opt.text}</button>
            ))}
          </div>
          {errors.location && <div className={styles.errorMsg}>{errors.location}</div>}
        </>}

        {step === 3 && <>
          <div className={styles.title}>Your measurements.</div>
          <div className={styles.sub}>Used to calculate your TDEE and macro targets precisely.</div>
          <div className={styles.fields}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <div className={styles.unitToggle}>
                <button className={`${styles.unitBtn} ${form.unit === 'imperial' ? styles.unitBtnActive : ''}`} onClick={() => { set('unit', 'imperial'); set('weight', ''); set('height', '') }}>lbs / ft</button>
                <button className={`${styles.unitBtn} ${form.unit === 'metric' ? styles.unitBtnActive : ''}`} onClick={() => { set('unit', 'metric'); set('weight', ''); set('height', '') }}>kg / cm</button>
              </div>
            </div>
            <div>
              <label className={styles.label}>Current Weight ({form.unit === 'imperial' ? 'lbs' : 'kg'})</label>
              <input className={`${styles.input} ${errors.weight ? styles.inputError : ''}`} type="number" placeholder={form.unit === 'imperial' ? 'e.g. 185' : 'e.g. 84'} value={form.weight} onChange={e => set('weight', e.target.value)} />
              {errors.weight && <div className={styles.errorMsg}>{errors.weight}</div>}
            </div>
            <div>
              <label className={styles.label}>Height ({form.unit === 'imperial' ? 'ft (e.g. 6.0)' : 'cm'})</label>
              <input className={`${styles.input} ${errors.height ? styles.inputError : ''}`} type="number" step="0.1" placeholder={form.unit === 'imperial' ? '6.0' : '183'} value={form.height} onChange={e => set('height', e.target.value)} />
              {errors.height && <div className={styles.errorMsg}>{errors.height}</div>}
            </div>
          </div>
        </>}

        {step === 4 && <>
          <div className={styles.title}>Goals & training.</div>
          <div className={styles.sub}>Shapes your calorie target and macro split.</div>
          <div className={styles.fields}>
            <div>
              <label className={styles.label}>Main Goal</label>
              <div className={styles.choiceGrid}>
                {['bulk', 'cut', 'maintaining'].map(g => (
                  <button key={g} className={`${styles.choice} ${form.goal === g ? styles.choiceActive : ''}`} onClick={() => set('goal', g)} style={{ textTransform: 'capitalize' }}>{g}</button>
                ))}
              </div>
              {errors.goal && <div className={styles.errorMsg}>{errors.goal}</div>}
            </div>
            <div>
              <label className={styles.label}>Daily Activity Outside the Gym</label>
              <input className={`${styles.input} ${errors.activity ? styles.inputError : ''}`} placeholder="e.g. office job, 8k steps daily" value={form.activity} onChange={e => set('activity', e.target.value)} />
              {errors.activity && <div className={styles.errorMsg}>{errors.activity}</div>}
            </div>
            <div>
              <label className={styles.label}>Training Days per Week</label>
              <div className={styles.choiceGrid}>
                {['2','3','4','5','6'].map(d => (
                  <button key={d} className={`${styles.choice} ${form.trainingDays === d ? styles.choiceActive : ''}`} onClick={() => set('trainingDays', d)}>{d} days</button>
                ))}
              </div>
              {errors.trainingDays && <div className={styles.errorMsg}>{errors.trainingDays}</div>}
            </div>
          </div>
        </>}

        {step === 5 && <>
          <div className={styles.title}>Food preferences.</div>
          <div className={styles.sub}>Final step — shapes your meal plan.</div>
          <div className={styles.fields}>
            <div>
              <label className={styles.label}>Diet Type</label>
              <div className={styles.choiceGrid}>
                {['none', 'vegetarian', 'vegan', 'lactose free', 'gluten free'].map(d => (
                  <button key={d} className={`${styles.choice} ${form.diet === d ? styles.choiceActive : ''}`} onClick={() => set('diet', d)} style={{ textTransform: 'capitalize' }}>{d === 'none' ? 'No restriction' : d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={styles.label}>Foods to Avoid <span style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none', fontSize: 9 }}>(optional)</span></label>
              <input className={styles.input} placeholder="e.g. broccoli, shellfish" value={form.avoidFoods} onChange={e => set('avoidFoods', e.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Meals per Day</label>
              <div className={styles.choiceGrid}>
                {['2','3','4','5'].map(m => (
                  <button key={m} className={`${styles.choice} ${form.mealsPerDay === m ? styles.choiceActive : ''}`} onClick={() => set('mealsPerDay', m)}>{m} meals</button>
                ))}
              </div>
              {errors.mealsPerDay && <div className={styles.errorMsg}>{errors.mealsPerDay}</div>}
            </div>
            <div>
              <label className={styles.label}>Do you struggle to eat enough?</label>
              <div className={styles.choiceGrid}>
                {['yes', 'no', 'sometimes'].map(v => (
                  <button key={v} className={`${styles.choice} ${form.struggleToEat === v ? styles.choiceActive : ''}`} onClick={() => set('struggleToEat', v)} style={{ textTransform: 'capitalize' }}>{v}</button>
                ))}
              </div>
              {errors.struggleToEat && <div className={styles.errorMsg}>{errors.struggleToEat}</div>}
            </div>
            <div className={styles.divider} />
            <div className={`${styles.consentBox} ${form.consent ? styles.consentBoxActive : ''}`} onClick={() => set('consent', !form.consent)}>
              <div className={`${styles.checkbox} ${form.consent ? styles.checkboxChecked : ''}`}>
                {form.consent && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className={styles.consentText}>
                I agree that my data is processed to generate my nutrition plan and deliver it via email. I accept the <Link to="/privacy" className={styles.consentLink} onClick={e => e.stopPropagation()}>Privacy Policy</Link>.
              </span>
            </div>
            {errors.consent && <div className={styles.errorMsg}>{errors.consent}</div>}
          </div>
        </>}

        <div className={styles.actions}>
          {step > 1 && <button className={styles.btnBack} onClick={back}>←</button>}
          {step < TOTAL_STEPS
            ? <button className={styles.btnNext} onClick={next}>Continue →</button>
            : <button className={styles.btnNext} onClick={submit} disabled={loading}>{loading ? 'Sending…' : 'Get My Plan →'}</button>
          }
        </div>
      </div>
    </div>
  )
}
