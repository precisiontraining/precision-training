import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MAKE_TRAINING_WEBHOOK , WEBHOOK_SECRET } from '../constants'
import styles from './Form.module.css'

const LOCATION_OPTIONS_TRAINING = [
  { id: 'd0880874-4f35-40d4-94ca-d34b52077732', text: 'United States' },
  { id: '2edaf70d-c81b-4729-90a4-7b89396db723', text: 'Canada' },
  { id: 'e3c1e0d6-3476-407e-a60c-6098540337a3', text: 'United Kingdom / Ireland' },
  { id: 'de05cdb3-5e96-4ee6-8cf1-86bcae615234', text: 'Europe' },
  { id: '8e99dcb2-3bec-451a-96d6-2b0f6fc4037c', text: 'Other' },
]

const TOTAL_STEPS = 4

function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

function buildPayload(form) {
  const id = generateId()
  return {
    formId: 'XxDjzg',
    formName: 'AI Training Plan',
    responseId: id,
    question_eANrKq: form.location,
    question_eBxZlq: form.unit === 'metric' ? parseFloat(form.weight) : null,
    question_9dJGyG: form.unit === 'metric' ? parseFloat(form.height) : null,
    question_WoeRDJ: form.unit === 'imperial' ? parseFloat(form.weight) : null,
    question_axj4K9: form.unit === 'imperial' ? parseFloat(form.height) : null,
    question_NAB5yG: form.name,
    question_qbEZe2: form.email,
    question_QAB2yg: parseInt(form.age),
    question_1KdeNW: form.equipment,
    question_J2XxD4: parseInt(form.trainingDays),
    question_oAkg6e_consent: true,
    pt_token: WEBHOOK_SECRET,
  }
}

export default function FormTraining() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '', email: '', age: '',
    location: '',
    unit: 'imperial', weight: '', height: '',
    equipment: '', trainingDays: '',
    consent: false,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function validate() {
    const e = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Required'
      if (!form.email.includes('@')) e.email = 'Valid email required'
      if (!form.age || isNaN(form.age) || +form.age < 13 || +form.age > 90) e.age = 'Enter a valid age (13–90)'
    }
    if (step === 2) {
      if (!form.location) e.location = 'Please select your location'
    }
    if (step === 3) {
      if (!form.weight || isNaN(form.weight)) e.weight = 'Required'
      if (!form.height || isNaN(form.height)) e.height = 'Required'
    }
    if (step === 4) {
      if (!form.equipment.trim()) e.equipment = 'Required (e.g. full gym, dumbbells only)'
      if (!form.trainingDays || +form.trainingDays < 1 || +form.trainingDays > 7) e.trainingDays = 'Enter 1–7 days'
      if (!form.consent) e.consent = 'Please accept to continue'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (!validate()) return
    setStep(s => s + 1)
    setErrors({})
  }
  function back() { setStep(s => s - 1); setErrors({}) }

  async function submit() {
    if (!validate()) return
    setLoading(true)
    try {
      await fetch(MAKE_TRAINING_WEBHOOK, {
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
        <div className={styles.successTitle}>You're all set, {form.name.split(' ')[0]}.</div>
        <p className={styles.successSub}>
          Your personalized training plan is being generated right now.<br />
          Check <strong style={{ color: '#fff' }}>{form.email}</strong> — it'll arrive within 1–5 minutes with your personal link and password.
        </p>
        <div className={styles.successNote}>No account · No subscription · One-time only</div>
      </div>
    </div>
  )

  const wUnit = form.unit === 'imperial' ? 'lbs' : 'kg'
  const hUnit = form.unit === 'imperial' ? 'ft (e.g. 6.0 for 6 ft)' : 'cm'

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
        <div className={styles.badge}>AI Training Plan</div>
        <div className={styles.stepOf}>Step {step} of {TOTAL_STEPS}</div>

        {step === 1 && <>
          <div className={styles.title}>Tell us about yourself.</div>
          <div className={styles.sub}>Basic info to personalize your plan.</div>
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
          </div>
        </>}

        {step === 2 && <>
          <div className={styles.title}>Where are you based?</div>
          <div className={styles.sub}>Used to tailor your plan to local standards.</div>
          <div className={`${styles.choiceGrid} ${styles.choiceGridWide}`}>
            {LOCATION_OPTIONS_TRAINING.map(opt => (
              <button key={opt.id} className={`${styles.choice} ${form.location === opt.text ? styles.choiceActive : ''}`} onClick={() => set('location', opt.text)}>{opt.text}</button>
            ))}
          </div>
          {errors.location && <div className={styles.errorMsg}>{errors.location}</div>}
        </>}

        {step === 3 && <>
          <div className={styles.title}>Your measurements.</div>
          <div className={styles.sub}>Used to calculate your exact training load.</div>
          <div className={styles.fields}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <div className={styles.unitToggle}>
                <button className={`${styles.unitBtn} ${form.unit === 'imperial' ? styles.unitBtnActive : ''}`} onClick={() => { set('unit', 'imperial'); set('weight', ''); set('height', '') }}>lbs / ft</button>
                <button className={`${styles.unitBtn} ${form.unit === 'metric' ? styles.unitBtnActive : ''}`} onClick={() => { set('unit', 'metric'); set('weight', ''); set('height', '') }}>kg / cm</button>
              </div>
            </div>
            <div>
              <label className={styles.label}>Weight ({wUnit})</label>
              <input className={`${styles.input} ${errors.weight ? styles.inputError : ''}`} type="number" placeholder={form.unit === 'imperial' ? 'e.g. 185' : 'e.g. 84'} value={form.weight} onChange={e => set('weight', e.target.value)} />
              {errors.weight && <div className={styles.errorMsg}>{errors.weight}</div>}
            </div>
            <div>
              <label className={styles.label}>Height ({form.unit === 'imperial' ? 'ft' : 'cm'})</label>
              <input className={`${styles.input} ${errors.height ? styles.inputError : ''}`} type="number" step="0.1" placeholder={hUnit} value={form.height} onChange={e => set('height', e.target.value)} />
              {errors.height && <div className={styles.errorMsg}>{errors.height}</div>}
            </div>
          </div>
        </>}

        {step === 4 && <>
          <div className={styles.title}>Your training setup.</div>
          <div className={styles.sub}>Last step — then your plan gets built.</div>
          <div className={styles.fields}>
            <div>
              <label className={styles.label}>Available Equipment</label>
              <input className={`${styles.input} ${errors.equipment ? styles.inputError : ''}`} placeholder="e.g. full gym, dumbbells only, bodyweight" value={form.equipment} onChange={e => set('equipment', e.target.value)} />
              {errors.equipment && <div className={styles.errorMsg}>{errors.equipment}</div>}
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
            <div className={styles.divider} />
            <div className={`${styles.consentBox} ${form.consent ? styles.consentBoxActive : ''}`} onClick={() => set('consent', !form.consent)}>
              <div className={`${styles.checkbox} ${form.consent ? styles.checkboxChecked : ''}`}>
                {form.consent && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className={styles.consentText}>
                I agree that my data is processed to generate my training plan and deliver it via email. I accept the <Link to="/privacy" className={styles.consentLink} onClick={e => e.stopPropagation()}>Privacy Policy</Link>.
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
