import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MAKE_TRAINING_WEBHOOK } from '../constants'
import styles from './Form.module.css'

const LOCATION_OPTIONS = [
  { id: 'd0880874-4f35-40d4-94ca-d34b52077732', text: 'United States' },
  { id: '2edaf70d-c81b-4729-90a4-7b89396db723', text: 'Canada' },
  { id: 'e3c1e0d6-3476-407e-a60c-6098540337a3', text: 'United Kingdom / Ireland' },
  { id: 'de05cdb3-5e96-4ee6-8cf1-86bcae615234', text: 'Europe' },
  { id: '8e99dcb2-3bec-451a-96d6-2b0f6fc4037c', text: 'Other' },
]

const TOTAL_STEPS = 5

function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase()
}

function buildPayload(form) {
  const now = new Date().toISOString()
  const id = generateId()
  const selectedLocation = LOCATION_OPTIONS.find(o => o.text === form.location)

  // Compose GLP-1 context into equipment field so Make.com GPT prompt picks it up
  const glpContext = form.glp1 === 'yes'
    ? ` | GLP-1 Medication: YES | Stage: ${form.glp1Stage} | Apply Muscle Preservation Mode: 3x Full-Body split, 30-45 min sessions, protein 1.6-2.2g/kg, compounds 3-4 sets 8-12 reps 90-120s rest, isolations 3 sets 10-15 reps 60-90s rest. Add 5-min warm-up and post-workout protein reminder to every day.`
    : ' | GLP-1 Medication: NO'

  const fields = [
    {
      key: 'question_eANrKq',
      label: 'Where are you based?',
      type: 'MULTIPLE_CHOICE',
      value: selectedLocation ? [selectedLocation.id] : [],
      options: LOCATION_OPTIONS,
    },
    { key: 'question_eBxZlq', label: 'Weight (kg)', type: 'INPUT_NUMBER', value: form.unit === 'metric' ? parseFloat(form.weight) : null },
    { key: 'question_9dJGyG', label: 'Height (cm)', type: 'INPUT_NUMBER', value: form.unit === 'metric' ? parseFloat(form.height) : null },
    { key: 'question_WoeRDJ', label: 'Weight (lbs)', type: 'INPUT_NUMBER', value: form.unit === 'imperial' ? parseFloat(form.weight) : null },
    { key: 'question_axj4K9', label: 'Height (ft)', type: 'INPUT_NUMBER', value: form.unit === 'imperial' ? parseFloat(form.height) : null },
    { key: 'question_NAB5yG', label: 'First Name', type: 'INPUT_TEXT', value: form.name },
    { key: 'question_qbEZe2', label: 'Email', type: 'INPUT_EMAIL', value: form.email },
    { key: 'question_QAB2yg', label: 'Age', type: 'INPUT_NUMBER', value: parseInt(form.age) },
    // Equipment field carries GLP-1 context so the existing Make.com prompt picks it up
    { key: 'question_1KdeNW', label: 'What equipment do you have access to?', type: 'INPUT_TEXT', value: form.equipment + glpContext },
    { key: 'question_J2XxD4', label: 'Training Days per Week', type: 'INPUT_NUMBER', value: 3 }, // GLP-1 default = 3
    // Dedicated GLP-1 fields (for when Make.com is updated to read them)
    { key: 'question_glp1', label: 'GLP-1 Medication', type: 'INPUT_TEXT', value: form.glp1 },
    { key: 'question_glp1_stage', label: 'GLP-1 Stage', type: 'INPUT_TEXT', value: form.glp1 === 'yes' ? form.glp1Stage : 'N/A' },
    {
      key: 'question_oAkg6e',
      label: '',
      type: 'CHECKBOXES',
      value: ['2c6336f0-4f80-4c96-b4eb-e77346b450ce'],
      options: [{ id: '2c6336f0-4f80-4c96-b4eb-e77346b450ce', text: 'I agree that my submitted data will be processed for the purpose of generating my personalized training plan and delivering it via email. I have read and accept the privacy policy.' }],
    },
    { key: 'question_oAkg6e_2c6336f0-4f80-4c96-b4eb-e77346b450ce', label: 'Checkbox', type: 'CHECKBOXES', value: true },
  ]

  return {
    eventId: crypto.randomUUID?.() || id,
    eventType: 'FORM_RESPONSE',
    createdAt: now,
    data: {
      responseId: id,
      submissionId: id,
      respondentId: id,
      formId: 'XxDjzg',
      formName: 'AI Training Plan',
      createdAt: now,
      fields,
    },
  }
}

export default function FormGLP1() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '', email: '', age: '',
    location: '',
    unit: 'imperial', weight: '', height: '',
    equipment: '',
    glp1: 'yes', glp1Stage: '',
    consent: false,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function validate() {
    const e = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Required'
      if (!form.email.includes('@')) e.email = 'Valid email required'
      if (!form.age || +form.age < 13 || +form.age > 90) e.age = 'Enter a valid age (13–90)'
    }
    if (step === 2) {
      if (!form.location) e.location = 'Please select your location'
    }
    if (step === 3) {
      if (!form.weight || isNaN(form.weight)) e.weight = 'Required'
      if (!form.height || isNaN(form.height)) e.height = 'Required'
    }
    if (step === 4) {
      if (!form.glp1) e.glp1 = 'Required'
      if (form.glp1 === 'yes' && !form.glp1Stage) e.glp1Stage = 'Please select your current stage'
      if (!form.equipment.trim()) e.equipment = 'Required'
    }
    if (step === 5) {
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
      await fetch(MAKE_TRAINING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
        mode: 'no-cors',
      })
    } catch {}
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className={styles.page}>
      <div className={styles.success}>
        <div className={styles.successIcon} style={{ background: 'rgba(100,180,130,0.1)', borderColor: 'rgba(100,180,130,0.3)' }}>✓</div>
        <div className={styles.successTitle}>Built for you, {form.name.split(' ')[0]}.</div>
        <p className={styles.successSub}>
          Your <strong style={{ color: '#6db88a' }}>GLP-1 Muscle Guard Plan</strong> is being generated right now — designed to preserve your muscle while on medication.<br /><br />
          Check <strong style={{ color: '#fff' }}>{form.email}</strong> within 1–5 minutes.
        </p>
        <div className={styles.successNote}>Muscle Preservation Mode · No subscription · One-time only</div>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/')}>← Back</button>
      <div className={styles.logo}><span className={styles.logoGold}>Precision</span> Training</div>

      <div className={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`${styles.dot} ${i + 1 === step ? styles.dotActive : i + 1 < step ? styles.dotDone : ''}`} style={i + 1 === step ? { background: '#6db88a', boxShadow: '0 0 8px rgba(100,180,130,0.5)' } : {}} />
        ))}
      </div>

      <div key={step} className={styles.card}>
        <div className={`${styles.badge} ${styles.badgeGlp}`}>
          <span style={{ fontSize: 11 }}>💊</span> GLP-1 Muscle Guard Plan
        </div>
        <div className={styles.stepOf}>Step {step} of {TOTAL_STEPS}</div>

        {step === 1 && <>
          <div className={styles.title}>Let's protect your muscle.</div>
          <div className={styles.sub}>A plan built around your medication — not against it.</div>
          <div className={styles.glpInfo}>
            <div className={styles.glpInfoTitle}>Muscle Preservation Mode</div>
            Your plan will default to 3× Full-Body sessions per week with compound-first programming, higher protein targets, and 30–45 min session limits — optimized for GLP-1 users.
          </div>
          <div className={styles.fields} style={{ marginTop: 20 }}>
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
              <input className={`${styles.input} ${errors.age ? styles.inputError : ''}`} type="number" placeholder="e.g. 38" value={form.age} onChange={e => set('age', e.target.value)} />
              {errors.age && <div className={styles.errorMsg}>{errors.age}</div>}
            </div>
          </div>
        </>}

        {step === 2 && <>
          <div className={styles.title}>Where are you based?</div>
          <div className={styles.sub}>Helps tailor your plan to local standards.</div>
          <div className={`${styles.choiceGrid} ${styles.choiceGridWide}`}>
            {LOCATION_OPTIONS.map(opt => (
              <button key={opt.id} className={`${styles.choice} ${form.location === opt.text ? styles.choiceGlp : ''}`} onClick={() => set('location', opt.text)}>{opt.text}</button>
            ))}
          </div>
          {errors.location && <div className={styles.errorMsg}>{errors.location}</div>}
        </>}

        {step === 3 && <>
          <div className={styles.title}>Your measurements.</div>
          <div className={styles.sub}>Used to calibrate training intensity and protein targets.</div>
          <div className={styles.fields}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <div className={styles.unitToggle}>
                <button className={`${styles.unitBtn} ${form.unit === 'imperial' ? styles.unitBtnActive : ''}`} onClick={() => { set('unit', 'imperial'); set('weight', ''); set('height', '') }}>lbs / ft</button>
                <button className={`${styles.unitBtn} ${form.unit === 'metric' ? styles.unitBtnActive : ''}`} onClick={() => { set('unit', 'metric'); set('weight', ''); set('height', '') }}>kg / cm</button>
              </div>
            </div>
            <div>
              <label className={styles.label}>Weight ({form.unit === 'imperial' ? 'lbs' : 'kg'})</label>
              <input className={`${styles.input} ${errors.weight ? styles.inputError : ''}`} type="number" placeholder={form.unit === 'imperial' ? 'e.g. 210' : 'e.g. 95'} value={form.weight} onChange={e => set('weight', e.target.value)} />
              {errors.weight && <div className={styles.errorMsg}>{errors.weight}</div>}
            </div>
            <div>
              <label className={styles.label}>Height ({form.unit === 'imperial' ? 'ft (e.g. 5.8)' : 'cm'})</label>
              <input className={`${styles.input} ${errors.height ? styles.inputError : ''}`} type="number" step="0.1" placeholder={form.unit === 'imperial' ? '5.8' : '175'} value={form.height} onChange={e => set('height', e.target.value)} />
              {errors.height && <div className={styles.errorMsg}>{errors.height}</div>}
            </div>
          </div>
        </>}

        {step === 4 && <>
          <div className={styles.title}>Your medication & setup.</div>
          <div className={styles.sub}>Tells the AI exactly how to adjust your plan.</div>
          <div className={styles.fields}>
            <div>
              <label className={styles.label}>Are you currently taking a GLP-1 medication?</label>
              <div className={styles.choiceGrid}>
                {[
                  { val: 'yes', label: 'Yes, currently taking' },
                  { val: 'planning', label: 'Planning to start' },
                ].map(opt => (
                  <button key={opt.val} className={`${styles.choice} ${form.glp1 === opt.val ? styles.choiceGlp : ''}`} onClick={() => set('glp1', opt.val)}>{opt.label}</button>
                ))}
              </div>
              {errors.glp1 && <div className={styles.errorMsg}>{errors.glp1}</div>}
            </div>
            {form.glp1 === 'yes' && (
              <div>
                <label className={styles.label}>Current Stage</label>
                <div className={`${styles.choiceGrid} ${styles.choiceGridWide}`}>
                  {['Starting', 'Dose escalation', 'Maintenance', 'Tapering off'].map(s => (
                    <button key={s} className={`${styles.choice} ${form.glp1Stage === s ? styles.choiceGlp : ''}`} onClick={() => set('glp1Stage', s)}>{s}</button>
                  ))}
                </div>
                {errors.glp1Stage && <div className={styles.errorMsg}>{errors.glp1Stage}</div>}
              </div>
            )}
            <div>
              <label className={styles.label}>Available Equipment</label>
              <input className={`${styles.input} ${errors.equipment ? styles.inputError : ''}`} placeholder="e.g. full gym, dumbbells only, bodyweight" value={form.equipment} onChange={e => set('equipment', e.target.value)} />
              {errors.equipment && <div className={styles.errorMsg}>{errors.equipment}</div>}
            </div>
            <div className={styles.glpInfo}>
              <div className={styles.glpInfoTitle}>Auto-applied to your plan</div>
              3× Full-Body / week · 30–45 min sessions · Protein 1.6–2.2 g/kg · Compounds first · Warm-up + post-workout reminder every session
            </div>
          </div>
        </>}

        {step === 5 && <>
          <div className={styles.title}>Almost there.</div>
          <div className={styles.sub}>Accept and your plan gets built immediately.</div>
          <div className={styles.fields}>
            <div className={`${styles.consentBox} ${form.consent ? styles.consentBoxActive : ''}`} onClick={() => set('consent', !form.consent)}>
              <div className={`${styles.checkbox} ${form.consent ? styles.checkboxChecked : ''}`}>
                {form.consent && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className={styles.consentText}>
                I agree that my data is processed to generate my GLP-1 training plan and deliver it via email. I accept the <Link to="/privacy" className={styles.consentLink} onClick={e => e.stopPropagation()}>Privacy Policy</Link>.
              </span>
            </div>
            {errors.consent && <div className={styles.errorMsg}>{errors.consent}</div>}
          </div>
        </>}

        <div className={styles.actions}>
          {step > 1 && <button className={styles.btnBack} onClick={back}>←</button>}
          {step < TOTAL_STEPS
            ? <button className={`${styles.btnNext} ${styles.btnNextGlp}`} onClick={next}>Continue →</button>
            : <button className={`${styles.btnNext} ${styles.btnNextGlp}`} onClick={submit} disabled={loading}>{loading ? 'Building your plan…' : 'Get My Muscle Guard Plan →'}</button>
          }
        </div>
      </div>
    </div>
  )
}
