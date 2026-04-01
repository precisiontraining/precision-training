import { useEffect, useRef } from 'react'

/*
  Scroll-driven hero — 5 frames, 500 vh track (300 vh on mobile)
  Frame 1  : Logo + tagline centred
  Frame 2  : Headline shifts up, sub-heading fades in
  Frame 3  : Training-plan screenshot rises from bottom
  Frame 4  : Training slides left, nutrition slides in from right
  Frame 5  : Both screens settle, glow + CTA buttons appear
*/

const GOLD = '#c8a96e'
const GOLD_DIM = 'rgba(200,169,110,0.12)'

export default function HeroScroll({ tallyTraining, tallyNutrition }) {
  const trackRef = useRef(null)
  const stageRef = useRef(null)
  const logoRef = useRef(null)
  const subRef = useRef(null)
  const screenTRef = useRef(null)
  const screenNRef = useRef(null)
  const glowRef = useRef(null)
  const ctaRef = useRef(null)
  const hintRef = useRef(null)
  const splitRef = useRef(null)
  const dotsRef = useRef([])

  useEffect(() => {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
    const map = (v, a, b, c, d) => c + (d - c) * clamp((clamp(v, a, b) - a) / (b - a), 0, 1)
    const ease = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

    function setDot(i) {
      dotsRef.current.forEach((d, j) => {
        if (!d) return
        d.style.background = j === i ? GOLD : 'rgba(255,255,255,0.18)'
        d.style.boxShadow = j === i ? `0 0 6px rgba(200,169,110,0.55)` : 'none'
        d.style.height = j === i ? '16px' : '4px'
        d.style.borderRadius = j === i ? '2px' : '50%'
      })
    }

    function onScroll() {
      const track = trackRef.current
      if (!track) return
      const totalH = track.offsetHeight - window.innerHeight
      if (totalH <= 0) return
      const p = clamp(window.scrollY / totalH, 0, 1)
      const isMobile = window.innerWidth < 640
      const sw = Math.min(isMobile ? window.innerWidth * 0.9 : 580, window.innerWidth * 0.9)

      // scroll hint
      if (hintRef.current) hintRef.current.style.opacity = p < 0.05 ? 1 : 0

      // bg glow
      if (stageRef.current) stageRef.current.style.setProperty('--glow-op', map(p, 0.28, 0.58, 0, 1))

      // ── Frame 1 → 2 : logo scales up & lifts ──
      const lS = 1 - 0.28 * ease(map(p, 0.08, 0.28, 0, 1))
      const lY = -(window.innerHeight * 0.2) * ease(map(p, 0.08, 0.28, 0, 1))
      const lO = 1 - ease(map(p, 0.22, 0.35, 0, 1))
      if (logoRef.current) {
        logoRef.current.style.transform = `translateY(${lY}px) scale(${lS})`
        logoRef.current.style.opacity = lO
      }

      // ── Frame 2 : sub-headline ──
      const subIn = ease(map(p, 0.22, 0.38, 0, 1))
      const subOut = ease(map(p, 0.40, 0.52, 0, 1))
      if (subRef.current) {
        subRef.current.style.opacity = subIn * (1 - subOut)
        subRef.current.style.transform = `translateY(${40 * (1 - subIn)}px)`
      }

      // ── Frame 3 : training plan rises ──
      const tp = ease(map(p, 0.38, 0.56, 0, 1))
      const tSlide = ease(map(p, 0.60, 0.76, 0, 1))

      let tX, nX, tY, nY
      if (isMobile) {
        // on mobile: stack vertically, not side by side
        const offsetY = sw * 0.42 // half-card offset for stacking
        tX = 0
        nX = 0
        tY = window.innerHeight * (0.55 - 0.52 * tp) - offsetY * tSlide
        nY = window.innerHeight * (0.55 - 0.52 * ease(map(p, 0.60, 0.77, 0, 1))) + offsetY * ease(map(p, 0.60, 0.77, 0, 1))
      } else {
        tX = -(sw * 0.5 + 10) * tSlide
        tY = window.innerHeight * (0.55 - 0.5 * tp)
        nX = (sw * 0.5 + 10) * (1 - ease(map(p, 0.60, 0.77, 0, 1))) + (sw * 0.5 + 10)
        nY = tY
      }

      const tSc = isMobile ? 0.9 + 0.1 * tp : 0.92 + 0.08 * tp
      if (screenTRef.current) {
        screenTRef.current.style.transform = `translateX(${tX}px) translateY(${tY}px) scale(${tSc})`
        screenTRef.current.style.opacity = tp
      }

      // ── Frame 4 : nutrition plan slides in ──
      const np = ease(map(p, 0.60, 0.77, 0, 1))
      const nSc = isMobile ? 0.9 + 0.1 * np : 0.92 + 0.08 * np
      if (screenNRef.current) {
        screenNRef.current.style.transform = `translateX(${nX}px) translateY(${nY}px) scale(${nSc})`
        screenNRef.current.style.opacity = np
      }

      // ── Frame 5 : both settle ──
      const sp = ease(map(p, 0.77, 0.90, 0, 1))
      if (p > 0.76) {
        if (isMobile) {
          const mfY = window.innerHeight * 0.02
          const mfOff = sw * 0.42
          if (screenTRef.current) screenTRef.current.style.transform = `translateX(0px) translateY(${mfY - mfOff * sp}px) scale(${0.9 + 0.04 * sp})`
          if (screenNRef.current) screenNRef.current.style.transform = `translateX(0px) translateY(${mfY + mfOff * sp}px) scale(${0.9 + 0.04 * sp})`
        } else {
          const fX = sw * 0.48 + 8
          const fY = window.innerHeight * 0.04
          const fSc = 0.94
          if (screenTRef.current) screenTRef.current.style.transform = `translateX(${-fX}px) translateY(${fY}px) scale(${fSc})`
          if (screenNRef.current) screenNRef.current.style.transform = `translateX(${fX}px) translateY(${fY}px) scale(${fSc})`
        }
      }

      if (glowRef.current) glowRef.current.style.opacity = ease(map(p, 0.60, 0.82, 0, 1))
      if (splitRef.current) splitRef.current.style.opacity = isMobile ? 0 : 0.55 * sp

      const co = ease(map(p, 0.85, 0.97, 0, 1))
      if (ctaRef.current) {
        ctaRef.current.style.opacity = co
        ctaRef.current.style.transform = `translateY(${20 * (1 - co)}px)`
      }

      if (p < 0.18) setDot(0)
      else if (p < 0.38) setDot(1)
      else if (p < 0.58) setDot(2)
      else if (p < 0.78) setDot(3)
      else setDot(4)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ── Nav dots ── */}
      <div style={{
        position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
        zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} ref={el => dotsRef.current[i] = el} style={{
            width: 4, height: 4, borderRadius: '50%',
            background: i === 0 ? GOLD : 'rgba(255,255,255,0.18)',
            boxShadow: i === 0 ? `0 0 6px rgba(200,169,110,0.55)` : 'none',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* ── Scroll track ── */}
      <div ref={trackRef} style={{ height: 'clamp(300vh, 500vh, 500vh)', position: 'relative' }}>
        <div ref={stageRef} style={{
          position: 'sticky', top: 0, height: '100vh', width: '100%',
          overflow: 'hidden', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#000',
        }}>

          {/* Ambient glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: 'radial-gradient(ellipse 65% 50% at 50% 65%, rgba(200,169,110,0.07) 0%, transparent 70%)',
          }} />

          {/* ── FRAME 1: Logo ── */}
          <div ref={logoRef} style={{
            position: 'absolute', zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 28, willChange: 'transform, opacity',
          }}>
            {/* Logo image */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute', inset: '-30%',
                background: 'radial-gradient(circle, rgba(200,169,110,0.2) 0%, transparent 65%)',
                filter: 'blur(24px)', animation: 'haloPulse 3.5s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
              <img
                src="/logo.png"
                alt="Precision Training"
                style={{ width: 'clamp(140px, 20vw, 200px)', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }}
              />
            </div>

            {/* Taglines */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                fontSize: 'clamp(11px, 1.3vw, 13px)', fontWeight: 400, letterSpacing: '3px',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                animation: 'fadeUp 1.1s ease 0.6s both',
              }}>
                Your Body. Your System. Your Results.
              </div>
              <div style={{
                fontSize: 'clamp(10px, 1.1vw, 12px)', fontWeight: 300, letterSpacing: '2px',
                color: 'rgba(200,169,110,0.6)',
                animation: 'fadeUp 1.1s ease 1.1s both',
              }}>
                AI-powered fitness &amp; nutrition
              </div>
            </div>
          </div>

          {/* ── FRAME 2: Sub-headline ── */}
          <div ref={subRef} style={{
            position: 'absolute', zIndex: 10, textAlign: 'center',
            padding: '0 24px', opacity: 0, willChange: 'transform, opacity',
          }}>
            <h2 style={{
              fontSize: 'clamp(22px, 4vw, 42px)', fontWeight: 800,
              letterSpacing: '-0.5px', lineHeight: 1.15, color: '#fff',
              fontFamily: 'Montserrat, sans-serif',
            }}>
              Built around your{' '}
              <em style={{ fontStyle: 'normal', color: GOLD }}>body</em>,<br />
              schedule and goals.
            </h2>
            <p style={{
              marginTop: 18, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 400,
              color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              Personalised by AI &nbsp;·&nbsp; Delivered instantly
            </p>
          </div>

          {/* ── Glow behind screens ── */}
          <div ref={glowRef} style={{
            position: 'absolute', zIndex: 8,
            width: 'min(1000px, 130vw)', height: 380,
            background: 'radial-gradient(ellipse, rgba(200,169,110,0.07) 0%, transparent 70%)',
            bottom: -80, opacity: 0, willChange: 'opacity',
          }} />

          {/* ── SCREEN: Training Plan ── */}
          <div ref={screenTRef} style={{
            position: 'absolute', zIndex: 9,
            width: 'min(580px, 90vw)',
            borderRadius: 14, overflow: 'hidden',
            opacity: 0, willChange: 'transform, opacity',
            boxShadow: '0 0 0 1px rgba(200,169,110,0.1), 0 40px 80px rgba(0,0,0,0.9)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
            }}>
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase',
                color: GOLD, background: 'rgba(10,10,10,0.7)',
                border: `1px solid rgba(200,169,110,0.2)`,
                padding: '4px 9px', borderRadius: 4,
              }}>Training Plan</span>
            </div>
            <img src="/preview-training.png" alt="Training Plan" style={{ width: '100%', display: 'block' }} />
          </div>

          {/* ── SCREEN: Nutrition Plan ── */}
          <div ref={screenNRef} style={{
            position: 'absolute', zIndex: 9,
            width: 'min(580px, 90vw)',
            borderRadius: 14, overflow: 'hidden',
            opacity: 0, willChange: 'transform, opacity',
            boxShadow: '0 0 0 1px rgba(200,169,110,0.1), 0 40px 80px rgba(0,0,0,0.9)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
            }}>
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase',
                color: GOLD, background: 'rgba(10,10,10,0.7)',
                border: `1px solid rgba(200,169,110,0.2)`,
                padding: '4px 9px', borderRadius: 4,
              }}>Nutrition Plan</span>
            </div>
            <img src="/preview-nutrition.png" alt="Nutrition Plan" style={{ width: '100%', display: 'block' }} />
          </div>

          {/* ── Split divider ── */}
          <div ref={splitRef} style={{
            position: 'absolute', zIndex: 25,
            left: '50%', top: '20%', transform: 'translateX(-50%)',
            width: 1, height: '65%',
            background: 'linear-gradient(to bottom, transparent, rgba(200,169,110,0.22), transparent)',
            opacity: 0, willChange: 'opacity',
          }} />

          {/* ── CTAs ── */}
          <div ref={ctaRef} style={{
            position: 'absolute', zIndex: 20, bottom: '6vh',
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            padding: '0 24px', opacity: 0, willChange: 'opacity, transform',
          }}>
            <a href={tallyTraining} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', padding: '13px 26px',
              borderRadius: 50, fontFamily: 'Montserrat, sans-serif',
              fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #b8922e, #c8a96e, #d4a84b)',
              color: '#0a0a0a',
              boxShadow: '0 8px 28px rgba(200,169,110,0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(200,169,110,0.46)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,169,110,0.3)' }}
            >
              Get My Training Plan →
            </a>
            <a href={tallyNutrition} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', padding: '13px 26px',
              borderRadius: 50, fontFamily: 'Montserrat, sans-serif',
              fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer',
              background: 'transparent', color: GOLD,
              border: '1px solid rgba(200,169,110,0.3)',
              transition: 'transform 0.2s ease, background 0.2s ease, border-color 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(200,169,110,0.07)'; e.currentTarget.style.borderColor = 'rgba(200,169,110,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(200,169,110,0.3)' }}
            >
              Get My Nutrition Plan →
            </a>
          </div>

          {/* ── Scroll hint ── */}
          <div ref={hintRef} style={{
            position: 'absolute', bottom: 28, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            zIndex: 30, transition: 'opacity 0.4s',
          }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
              Scroll
            </span>
            <div style={{
              width: 1, height: 38,
              background: 'linear-gradient(to bottom, rgba(200,169,110,0.5), transparent)',
              animation: 'scrollDrop 1.8s ease-in-out infinite',
            }} />
          </div>
        </div>
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.18); }
        }
        @keyframes scrollDrop {
          0%   { transform: scaleY(0); transform-origin: top; }
          50%  { transform: scaleY(1); transform-origin: top; }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }
      `}</style>
    </>
  )
}
