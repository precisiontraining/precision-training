import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

const GOLD  = '#c8a96e'
const GREEN = '#6db88a'

const COMPETITORS = [
  { key: 'future',    name: 'Future',       icon: '📱', desc: 'AI coaching app, $150/mo' },
  { key: 'noom',      name: 'Noom',         icon: '🥗', desc: 'Psychology-based weight loss' },
  { key: 'calibrate', name: 'Calibrate',    icon: '💊', desc: 'GLP-1 program with coaching' },
  { key: 'mfp',       name: 'MyFitnessPal', icon: '📊', desc: 'Calorie & macro tracker' },
]

const FEATURES = [
  {
    label: 'Personalized training plan',
    pt: true, future: true, noom: false, calibrate: '⚠️', mfp: false,
    note: 'Calibrate focuses on medication + lifestyle coaching — no structured resistance training program.',
  },
  {
    label: 'GLP-1 muscle preservation mode',
    pt: true, future: false, noom: false, calibrate: '⚠️', mfp: false,
    note: 'Calibrate acknowledges muscle loss risk but provides no dedicated resistance program for it.',
  },
  {
    label: 'Personalized nutrition plan',
    pt: true, future: false, noom: true, calibrate: true, mfp: false,
    note: 'MyFitnessPal tracks calories but does not generate personalized plans.',
  },
  {
    label: 'Plan ready in under 5 minutes',
    pt: true, future: false, noom: false, calibrate: false, mfp: true,
  },
  {
    label: 'Progress & weight tracker',
    pt: true, future: true, noom: true, calibrate: true, mfp: true,
  },
  {
    label: 'AI coach chat',
    pt: true, future: true, noom: '⚠️', calibrate: '⚠️', mfp: false,
    note: 'Noom and Calibrate offer human coaching — not real-time AI available on demand.',
  },
  {
    label: 'Free to start — no subscription',
    pt: true, future: false, noom: false, calibrate: false, mfp: '⚠️',
    note: 'MyFitnessPal has a free tier but plan features require Premium ($19.99/mo).',
  },
  {
    label: 'Exercise swap & customization',
    pt: true, future: '⚠️', noom: false, calibrate: false, mfp: false,
    note: 'Future allows some exercise feedback via your coach but no self-service swap system.',
  },
  {
    label: 'Built specifically for GLP-1 users',
    pt: true, future: false, noom: false, calibrate: true, mfp: false,
  },
  {
    label: 'Password-protected personal plan page',
    pt: true, future: false, noom: false, calibrate: false, mfp: false,
  },
]

function Cell({ val }) {
  if (val === true)  return <span style={{ color: GREEN, fontSize: 15, fontWeight: 800 }}>✓</span>
  if (val === false) return <span style={{ color: 'rgba(255,255,255,0.13)', fontSize: 13 }}>✕</span>
  return <span style={{ fontSize: 13 }} title="Partially / with limitations">{val}</span>
}

export default function ComparisonSection() {
  // Tooltip state: { text, x, y } | null
  const [tooltip, setTooltip] = useState(null)

  const handleMouseMove = useCallback((e, note) => {
    if (!note) return
    setTooltip({ text: note, x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 100px) clamp(16px, 4vw, 40px)',
      maxWidth: 1100,
      margin: '0 auto',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      {/* Global cursor-following tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 8,
          zIndex: 9999,
          pointerEvents: 'none',
          background: '#1c1c1c',
          border: '1px solid rgba(200,169,110,0.25)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 11,
          color: 'rgba(255,255,255,0.7)',
          maxWidth: 220,
          lineHeight: 1.5,
          boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
          whiteSpace: 'normal',
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Header */}
      <p style={{
        textAlign: 'center', fontSize: 11, fontWeight: 800,
        letterSpacing: '0.18em', color: GOLD, opacity: 0.8, marginBottom: 16,
      }}>
        WHY PRECISION TRAINING
      </p>
      <h2 style={{
        textAlign: 'center',
        fontSize: 'clamp(26px, 3.5vw, 44px)',
        fontWeight: 900,
        letterSpacing: '-0.025em',
        lineHeight: 1.1,
        marginBottom: 14,
        color: '#fff',
      }}>
        How we compare to{' '}
        <span style={{ color: GOLD }}>the alternatives.</span>
      </h2>
      <p style={{
        textAlign: 'center',
        fontSize: 15,
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.7,
        maxWidth: 580,
        margin: '0 auto 56px',
      }}>
        Future costs $150/month. Calibrate requires a subscription before you see anything.
        Noom has no training plan. Precision Training gives you a complete, personalized system
        — free to start, ready in minutes.
      </p>

      {/* Competitor intro cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {COMPETITORS.map(c => (
          <div key={c.key} style={{
            padding: '16px 20px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Montserrat, sans-serif', minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left', padding: '18px 24px',
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.07)', minWidth: 200,
              }}>Feature</th>
              {/* PT highlighted */}
              <th style={{
                textAlign: 'center', padding: '18px 16px',
                background: 'rgba(200,169,110,0.07)',
                borderBottom: '1px solid rgba(200,169,110,0.2)',
                borderLeft: '1px solid rgba(200,169,110,0.15)',
                borderRight: '1px solid rgba(200,169,110,0.15)',
                minWidth: 110,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1.4 }}>
                  Precision<br />Training
                </div>
                <div style={{ fontSize: 9, color: 'rgba(200,169,110,0.4)', marginTop: 4 }}>★ This</div>
              </th>
              {COMPETITORS.map(c => (
                <th key={c.key} style={{
                  textAlign: 'center', padding: '18px 16px',
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  textTransform: 'uppercase', letterSpacing: 0.8, minWidth: 100,
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                  <div>{c.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f, i) => (
              <tr
                key={f.label}
                style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
              >
                <td style={{
                  padding: '13px 24px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  lineHeight: 1.4,
                  userSelect: 'none',
                }}>
                  {f.label}
                  {f.note && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        color: 'rgba(200,169,110,0.5)',
                        cursor: 'help',
                        display: 'inline-block',
                      }}
                      onMouseMove={e => handleMouseMove(e, f.note)}
                      onMouseLeave={handleMouseLeave}
                    >
                      ⓘ
                    </span>
                  )}
                </td>

                {/* PT column */}
                <td style={{
                  textAlign: 'center', padding: '13px 16px',
                  background: 'rgba(200,169,110,0.04)',
                  borderLeft: '1px solid rgba(200,169,110,0.08)',
                  borderRight: '1px solid rgba(200,169,110,0.08)',
                  borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(200,169,110,0.05)' : 'none',
                }}><Cell val={f.pt} /></td>

                <td style={{ textAlign:'center', padding:'13px 16px', borderBottom: i < FEATURES.length-1 ? '1px solid rgba(255,255,255,0.04)':'none' }}><Cell val={f.future} /></td>
                <td style={{ textAlign:'center', padding:'13px 16px', borderBottom: i < FEATURES.length-1 ? '1px solid rgba(255,255,255,0.04)':'none' }}><Cell val={f.noom} /></td>
                <td style={{ textAlign:'center', padding:'13px 16px', borderBottom: i < FEATURES.length-1 ? '1px solid rgba(255,255,255,0.04)':'none' }}><Cell val={f.calibrate} /></td>
                <td style={{ textAlign:'center', padding:'13px 16px', borderBottom: i < FEATURES.length-1 ? '1px solid rgba(255,255,255,0.04)':'none' }}><Cell val={f.mfp} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{
        textAlign: 'center', marginTop: 12,
        fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: 0.5,
      }}>
        ✓ = Yes &nbsp;·&nbsp; ✕ = No &nbsp;·&nbsp; ⚠️ = Partially / limited &nbsp;·&nbsp; Hover ⓘ for details
      </p>

      {/* Stat boxes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14,
        marginTop: 52,
      }}>
        {[
          { icon: '💸', stat: '$0',      label: 'No subscription needed to get your plan' },
          { icon: '⚡', stat: '< 2 min', label: 'Full personalized plan, instantly' },
          { icon: '🧬', stat: 'GLP-1',   label: 'Only platform purpose-built for Ozempic & Wegovy users' },
          { icon: '🤖', stat: 'AI Coach',label: 'Knows your exact plan — not a generic chatbot' },
        ].map(item => (
          <div key={item.stat} style={{
            padding: '24px 22px',
            borderRadius: 16,
            border: '1px solid rgba(200,169,110,0.12)',
            background: 'rgba(200,169,110,0.03)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: GOLD, letterSpacing: '-0.02em', marginBottom: 6 }}>
              {item.stat}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 52, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/form/glp1" style={{
          display: 'inline-block',
          padding: '14px 32px',
          borderRadius: 50,
          background: 'linear-gradient(135deg, #4a9e68, #6db88a)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '1.5px',
          textDecoration: 'none',
          textTransform: 'uppercase',
          boxShadow: '0 8px 24px rgba(100,180,130,0.3)',
        }}>
          💊 GLP-1 Plan — Free →
        </Link>
        <Link to="/form/training" style={{
          display: 'inline-block',
          padding: '14px 32px',
          borderRadius: 50,
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.45)',
          fontSize: 12,
          fontWeight: 800,
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '1.5px',
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}>
          Standard Plan
        </Link>
      </div>
    </section>
  )
}
