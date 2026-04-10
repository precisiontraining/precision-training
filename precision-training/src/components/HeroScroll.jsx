import { useEffect, useRef } from 'react'

const GOLD = '#c8a96e'
const LERP = 0.09

// ── Icons ───────────────────────────────────────────────────────────────────
const IconForm = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width:'100%', height:'100%' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
    <circle cx="8" cy="9" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const IconAI = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width:'100%', height:'100%' }}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
)
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width:'100%', height:'100%' }}>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="2,4 12,13 22,4"/>
  </svg>
)
const IconPlan = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width:'100%', height:'100%' }}>
    <rect x="5" y="11" width="14" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)

const STEPS = [
  { n:'01', label:'Fill Out the Form',      sub:'Enter your goals, body & equipment',   Icon: IconForm, color:'#a0c4a0' },
  { n:'02', label:'AI Builds Your Plan',    sub:'Fully personalized in < 2 min',        Icon: IconAI,  color: GOLD   },
  { n:'03', label:'Receive Your Email',     sub:'Your link + personal password',        Icon: IconMail, color:'#8fafd4' },
  { n:'04', label:'Access Your Plan',       sub:'Available anytime & anywhere',         Icon: IconPlan, color:'#c4a0c4' },
]

// ── Horizontal Connector (desktop) ──────────────────────────────────────────
function ConnH({ delay }) {
  return (
    <div className="sf-conn-h" style={{ '--d': delay }}>
      <div className="sf-track" />
      <div className="sf-fill" />
      <div className="sf-dot" />
      <div className="sf-arrow" />
    </div>
  )
}

// ── Vertical Connector (mobile) ──────────────────────────────────────────────
function ConnV({ delay }) {
  return (
    <div className="sf-conn-v" style={{ '--d': delay }}>
      <div className="sf-track" />
      <div className="sf-fill" />
      <div className="sf-dot" />
      <div className="sf-arrow-v" />
    </div>
  )
}

// ── System Flow ──────────────────────────────────────────────────────────────
function SystemFlow({ flowRef }) {
  return (
    <div ref={flowRef} className="sf-root">
      <div className="sf-eyebrow">How It Works</div>

      {/* DESKTOP: horizontal row */}
      <div className="sf-desktop">
        {STEPS.map((s, i) => (
          <div key={s.n} className="sf-row-item">
            <div className="sf-card" style={{ '--c': s.color, '--i': i }}>
              <div className="sf-num">{s.n}</div>
              <div className="sf-icon">
                <div className="sf-icon-bg" />
                <div className="sf-icon-svg" style={{ color: s.color }}><s.Icon /></div>
              </div>
              <div className="sf-label">{s.label}</div>
              <div className="sf-sub">{s.sub}</div>
            </div>
            {i < 3 && <ConnH delay={`${i * 0.38}s`} />}
          </div>
        ))}
      </div>

      {/* MOBILE: vertical column */}
      <div className="sf-mobile">
        {STEPS.map((s, i) => (
          <div key={s.n} className="sf-col-item">
            <div className="sf-card-h" style={{ '--c': s.color, '--i': i }}>
              <div className="sf-icon-h">
                <div className="sf-icon-bg" />
                <div className="sf-icon-svg" style={{ color: s.color }}><s.Icon /></div>
              </div>
              <div className="sf-text-h">
                <div className="sf-num-h">{s.n}</div>
                <div className="sf-label">{s.label}</div>
                <div className="sf-sub">{s.sub}</div>
              </div>
            </div>
            {i < 3 && <ConnV delay={`${i * 0.38}s`} />}
          </div>
        ))}
      </div>

      <div className="sf-footer">No Account · No Subscription · Ready to Use</div>
    </div>
  )
}

// ── Main HeroScroll ──────────────────────────────────────────────────────────
export default function HeroScroll({ tallyTraining, tallyNutrition }) {
  const trackRef  = useRef(null)
  const logoRef   = useRef(null)
  const subRef    = useRef(null)
  const flowRef   = useRef(null)
  const glowRef   = useRef(null)
  const ctaRef    = useRef(null)
  const hintRef   = useRef(null)
  const dotsRef   = useRef([])
  const wasActive = useRef(false)

  useEffect(() => {
    const clamp = (v,a,b) => Math.max(a, Math.min(b,v))
    const map   = (v,a,b,c,d) => c + (d-c) * clamp((clamp(v,a,b)-a)/(b-a), 0, 1)
    const ease  = t => t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1
    const lerp  = (a,b,t) => a + (b-a)*t

    let tgt=0, smt=0, raf=null, last=-1

    function setDot(i) {
      dotsRef.current.forEach((d,j) => {
        if (!d) return
        d.style.background   = j===i ? GOLD : 'rgba(255,255,255,0.18)'
        d.style.boxShadow    = j===i ? '0 0 6px rgba(200,169,110,0.55)' : 'none'
        d.style.height       = j===i ? '16px' : '4px'
        d.style.borderRadius = j===i ? '2px' : '50%'
      })
    }

    function render(p) {
      if (Math.abs(p-last) < 0.00005) return
      last = p
      const track = trackRef.current; if (!track) return

      if (hintRef.current) hintRef.current.style.opacity = p < 0.05 ? 1 : 0

      // logo
      const lS = 1 - 0.28 * ease(map(p, 0.08, 0.28, 0, 1))
      const lY = -(window.innerHeight * 0.2) * ease(map(p, 0.08, 0.28, 0, 1))
      const lO = 1 - ease(map(p, 0.22, 0.35, 0, 1))
      if (logoRef.current) {
        logoRef.current.style.transform = `translateY(${lY}px) scale(${lS})`
        logoRef.current.style.opacity   = lO
      }

      // sub-headline
      const sIn  = ease(map(p, 0.22, 0.38, 0, 1))
      const sOut = ease(map(p, 0.40, 0.52, 0, 1))
      if (subRef.current) {
        subRef.current.style.opacity   = sIn * (1-sOut)
        subRef.current.style.transform = `translateY(${40*(1-sIn)}px)`
      }

      // flow diagram
      const fp = ease(map(p, 0.42, 0.68, 0, 1))
      const fY = window.innerHeight * 0.16 * (1 - fp)
      if (flowRef.current) {
        flowRef.current.style.opacity   = fp
        flowRef.current.style.transform = `translateY(${fY}px)`
        if (fp > 0.45 && !wasActive.current) {
          wasActive.current = true
          flowRef.current.classList.add('sf-active')
        } else if (fp < 0.05 && wasActive.current) {
          wasActive.current = false
          flowRef.current.classList.remove('sf-active')
        }
      }

      // glow
      if (glowRef.current) glowRef.current.style.opacity = ease(map(p, 0.50, 0.78, 0, 1))

      // CTAs
      const co = ease(map(p, 0.84, 0.97, 0, 1))
      if (ctaRef.current) {
        ctaRef.current.style.opacity   = co
        ctaRef.current.style.transform = `translateY(${20*(1-co)}px)`
      }

      if      (p < 0.18) setDot(0)
      else if (p < 0.38) setDot(1)
      else if (p < 0.62) setDot(2)
      else if (p < 0.82) setDot(3)
      else               setDot(4)
    }

    function loop() {
      const track = trackRef.current
      if (track) {
        const H = track.offsetHeight - window.innerHeight
        if (H > 0) tgt = clamp(window.scrollY / H, 0, 1)
      }
      smt = lerp(smt, tgt, LERP)
      render(smt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {/* dots */}
      <div style={{
        position:'fixed', right:20, top:'50%', transform:'translateY(-50%)',
        zIndex:200, display:'flex', flexDirection:'column', gap:10,
      }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} ref={el => dotsRef.current[i]=el} style={{
            width:4, height:4, borderRadius:'50%',
            background: i===0 ? GOLD : 'rgba(255,255,255,0.18)',
            boxShadow: i===0 ? '0 0 6px rgba(200,169,110,0.55)' : 'none',
            transition:'all 0.3s ease',
          }} />
        ))}
      </div>

      <div ref={trackRef} style={{ height:'clamp(300vh,500vh,500vh)', position:'relative' }}>
        <div style={{
          position:'sticky', top:0, height:'100vh', width:'100%',
          overflow:'hidden', display:'flex', alignItems:'center',
          justifyContent:'center', background:'#000',
        }}>
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
            background:'radial-gradient(ellipse 65% 50% at 50% 65%, rgba(200,169,110,0.07) 0%, transparent 70%)',
          }} />

          {/* Logo */}
          <div ref={logoRef} style={{
            position:'absolute', zIndex:10,
            display:'flex', flexDirection:'column', alignItems:'center',
            gap:28, willChange:'transform, opacity',
          }}>
            <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{
                position:'absolute', inset:'-30%',
                background:'radial-gradient(circle, rgba(200,169,110,0.2) 0%, transparent 65%)',
                filter:'blur(24px)', animation:'haloPulse 3.5s ease-in-out infinite',
                pointerEvents:'none',
              }} />
              <img src="/logo.png" alt="Precision Training" style={{
                width:'clamp(140px,20vw,200px)', height:'auto', display:'block',
                position:'relative', zIndex:1, mixBlendMode:'screen',
                WebkitMaskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 55%, transparent 100%)',
                maskImage:'radial-gradient(ellipse 85% 85% at 50% 50%, black 55%, transparent 100%)',
              }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div style={{
                fontSize:'clamp(11px,1.3vw,13px)', fontWeight:400, letterSpacing:'3px',
                textTransform:'uppercase', color:'rgba(255,255,255,0.45)',
                animation:'fadeUp 1.1s ease 0.6s both',
              }}>Your Body. Your System. Your Results.</div>
              <div style={{
                fontSize:'clamp(10px,1.1vw,12px)', fontWeight:300, letterSpacing:'2px',
                color:'rgba(200,169,110,0.6)', animation:'fadeUp 1.1s ease 1.1s both',
              }}>AI-powered fitness &amp; nutrition</div>
            </div>
          </div>

          {/* Sub-headline */}
          <div ref={subRef} style={{
            position:'absolute', zIndex:10, textAlign:'center',
            padding:'0 24px', opacity:0, willChange:'transform, opacity',
          }}>
            <h2 style={{
              fontSize:'clamp(22px,4vw,42px)', fontWeight:800,
              letterSpacing:'-0.5px', lineHeight:1.15, color:'#fff',
              fontFamily:'Montserrat, sans-serif',
            }}>
              Built around your{' '}
              <em style={{ fontStyle:'normal', color:GOLD }}>body</em>,<br/>
              schedule and goals.
            </h2>
            <p style={{
              marginTop:18, fontSize:'clamp(11px,1.2vw,13px)', fontWeight:400,
              color:'rgba(255,255,255,0.35)', letterSpacing:'2px', textTransform:'uppercase',
            }}>Calculated for you &nbsp;·&nbsp; Ready in minutes</p>
          </div>

          {/* Glow */}
          <div ref={glowRef} style={{
            position:'absolute', zIndex:8,
            width:'min(1000px,130vw)', height:380,
            background:'radial-gradient(ellipse, rgba(200,169,110,0.06) 0%, transparent 70%)',
            bottom:-80, opacity:0, willChange:'opacity',
          }} />

          {/* Flow */}
          <SystemFlow flowRef={flowRef} />

          {/* CTAs */}
          <div ref={ctaRef} style={{
            position:'absolute', zIndex:20, bottom:'6vh',
            display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center',
            padding:'0 24px', opacity:0, willChange:'opacity, transform',
          }}>
            <a href={tallyTraining} target="_blank" rel="noreferrer" style={{
              display:'inline-flex', alignItems:'center', padding:'13px 26px',
              borderRadius:50, fontFamily:'Montserrat, sans-serif',
              fontSize:12, fontWeight:700, letterSpacing:'1.5px',
              textTransform:'uppercase', textDecoration:'none', cursor:'pointer',
              background:'linear-gradient(135deg, #b8922e, #c8a96e, #d4a84b)',
              color:'#0a0a0a', boxShadow:'0 8px 28px rgba(200,169,110,0.3)',
              transition:'transform 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(200,169,110,0.46)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(200,169,110,0.3)' }}
            >Get My Training Plan →</a>
            <a href={tallyNutrition} target="_blank" rel="noreferrer" style={{
              display:'inline-flex', alignItems:'center', padding:'13px 26px',
              borderRadius:50, fontFamily:'Montserrat, sans-serif',
              fontSize:12, fontWeight:700, letterSpacing:'1.5px',
              textTransform:'uppercase', textDecoration:'none', cursor:'pointer',
              background:'transparent', color:GOLD,
              border:'1px solid rgba(200,169,110,0.3)',
              transition:'transform 0.2s ease, background 0.2s ease, border-color 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.background='rgba(200,169,110,0.07)'; e.currentTarget.style.borderColor='rgba(200,169,110,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(200,169,110,0.3)' }}
            >Get My Nutrition Plan →</a>
          </div>

          {/* Scroll hint */}
          <div ref={hintRef} style={{
            position:'absolute', bottom:28, left:'50%',
            transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            zIndex:30, transition:'opacity 0.4s',
          }}>
            <span style={{ fontSize:8, fontWeight:600, letterSpacing:'4px', textTransform:'uppercase', color:'rgba(255,255,255,0.2)' }}>Scroll</span>
            <div style={{
              width:1, height:38,
              background:'linear-gradient(to bottom, rgba(200,169,110,0.5), transparent)',
              animation:'scrollDrop 1.8s ease-in-out infinite',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes haloPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.18)} }
        @keyframes scrollDrop {
          0%  {transform:scaleY(0);transform-origin:top}
          50% {transform:scaleY(1);transform-origin:top}
          51% {transform:scaleY(1);transform-origin:bottom}
          100%{transform:scaleY(0);transform-origin:bottom}
        }

        /* ── card entrance ── */
        @keyframes sfCardIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        /* ── line draw (horizontal) ── */
        @keyframes sfFillH { from{width:0;opacity:0} to{width:100%;opacity:1} }

        /* ── line draw (vertical) ── */
        @keyframes sfFillV { from{height:0;opacity:0} to{height:100%;opacity:1} }

        /* ── traveling dot horizontal ── */
        @keyframes sfDotH {
          0%  {left:3px;opacity:0}
          12% {opacity:1}
          86% {opacity:1}
          100%{left:calc(100% - 11px);opacity:0}
        }

        /* ── traveling dot vertical ── */
        @keyframes sfDotV {
          0%  {top:3px;opacity:0}
          12% {opacity:1}
          86% {opacity:1}
          100%{top:calc(100% - 11px);opacity:0}
        }

        /* ── icon pulse ── */
        @keyframes sfPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(200,169,110,0)}
          50%    {box-shadow:0 0 0 5px rgba(200,169,110,0.09)}
        }

        /* ───────────────────────────────── sf-root */
        .sf-root {
          position: absolute;
          z-index: 9;
          width: 100%;
          max-width: 900px;
          padding: 0 20px;
          font-family: Montserrat, sans-serif;
          opacity: 0;
          will-change: transform, opacity;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .sf-eyebrow {
          font-size: 9px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(200,169,110,0.45);
          margin-bottom: 24px;
        }

        .sf-footer {
          font-size: 9px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.13);
          margin-top: 22px;
        }

        /* ───── DESKTOP layout ───── */
        .sf-desktop {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .sf-mobile { display: none; }

        .sf-row-item {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        /* card */
        .sf-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 20px 12px 18px;
          width: 150px;
          border-radius: 16px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.055);
          flex-shrink: 0;
          opacity: 0;
          transition: border-color 0.5s ease;
        }

        .sf-active .sf-card { border-color: rgba(200,169,110,0.1); }

        .sf-active .sf-row-item:nth-child(1) .sf-card { animation: sfCardIn 0.55s ease 0.05s both; }
        .sf-active .sf-row-item:nth-child(2) .sf-card { animation: sfCardIn 0.55s ease 0.43s both; }
        .sf-active .sf-row-item:nth-child(3) .sf-card { animation: sfCardIn 0.55s ease 0.81s both; }
        .sf-active .sf-row-item:nth-child(4) .sf-card { animation: sfCardIn 0.55s ease 1.19s both; }

        .sf-num {
          position: absolute;
          top: 10px; right: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.1);
        }

        .sf-icon {
          position: relative;
          width: 46px; height: 46px;
        }

        .sf-icon-bg {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: rgba(200,169,110,0.07);
          border: 1px solid rgba(200,169,110,0.12);
        }

        .sf-active .sf-icon-bg {
          animation: sfPulse 3s ease-in-out infinite;
        }

        .sf-icon-svg {
          position: absolute;
          inset: 11px;
        }

        .sf-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          line-height: 1.3;
          letter-spacing: 0.2px;
        }

        .sf-sub {
          font-size: 9px;
          font-weight: 400;
          color: rgba(255,255,255,0.28);
          line-height: 1.55;
          letter-spacing: 0.2px;
        }

        /* ── HORIZONTAL connector ── */
        .sf-conn-h {
          position: relative;
          width: 52px;
          height: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .sf-conn-h .sf-track {
          position: absolute;
          inset: 0;
          background: rgba(200,169,110,0.07);
          border-radius: 1px;
        }

        .sf-conn-h .sf-fill {
          position: absolute;
          top: 0; left: 0;
          height: 2px; width: 0;
          background: linear-gradient(to right, rgba(200,169,110,0.15), rgba(200,169,110,0.55));
          border-radius: 1px;
          opacity: 0;
        }

        .sf-active .sf-conn-h .sf-fill {
          animation: sfFillH 0.55s ease both;
          animation-delay: var(--d);
        }

        .sf-conn-h .sf-dot {
          position: absolute;
          top: -3px; left: 3px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #c8a96e;
          box-shadow: 0 0 6px rgba(200,169,110,0.9), 0 0 14px rgba(200,169,110,0.4);
          opacity: 0;
        }

        .sf-active .sf-conn-h .sf-dot {
          animation: sfDotH 1.9s ease-in-out infinite;
          animation-delay: calc(var(--d) + 0.55s);
        }

        .sf-arrow {
          position: absolute;
          right: -1px;
          width: 0; height: 0;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-left: 6px solid rgba(200,169,110,0.25);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .sf-active .sf-arrow { opacity: 1; }

        /* ───── MOBILE layout ───── */
        @media (max-width: 639px) {
          .sf-desktop { display: none; }
          .sf-mobile  {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            max-width: 360px;
          }

          .sf-col-item {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          /* horizontal card for mobile */
          .sf-card-h {
            position: relative;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            width: 100%;
            border-radius: 14px;
            background: rgba(255,255,255,0.025);
            border: 1px solid rgba(255,255,255,0.055);
            opacity: 0;
            transition: border-color 0.5s ease;
          }

          .sf-active .sf-card-h { border-color: rgba(200,169,110,0.1); }
          .sf-active .sf-col-item:nth-child(1) .sf-card-h { animation: sfCardIn 0.5s ease 0.05s both; }
          .sf-active .sf-col-item:nth-child(2) .sf-card-h { animation: sfCardIn 0.5s ease 0.43s both; }
          .sf-active .sf-col-item:nth-child(3) .sf-card-h { animation: sfCardIn 0.5s ease 0.81s both; }
          .sf-active .sf-col-item:nth-child(4) .sf-card-h { animation: sfCardIn 0.5s ease 1.19s both; }

          .sf-icon-h {
            position: relative;
            width: 40px; height: 40px;
            flex-shrink: 0;
          }

          .sf-text-h {
            display: flex;
            flex-direction: column;
            gap: 3px;
            flex: 1;
          }

          .sf-num-h {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,0.12);
          }

          .sf-text-h .sf-label { font-size: 12px; text-align: left; }
          .sf-text-h .sf-sub   { font-size: 9px;  text-align: left; }

          /* ── VERTICAL connector ── */
          .sf-conn-v {
            position: relative;
            width: 2px;
            height: 36px;
            flex-shrink: 0;
            margin: 0 auto;
            left: -80px; /* align under icon center */
          }

          .sf-conn-v .sf-track {
            position: absolute;
            inset: 0;
            background: rgba(200,169,110,0.07);
            border-radius: 1px;
          }

          .sf-conn-v .sf-fill {
            position: absolute;
            top: 0; left: 0;
            width: 2px; height: 0;
            background: linear-gradient(to bottom, rgba(200,169,110,0.15), rgba(200,169,110,0.55));
            border-radius: 1px;
            opacity: 0;
          }

          .sf-active .sf-conn-v .sf-fill {
            animation: sfFillV 0.55s ease both;
            animation-delay: var(--d);
          }

          .sf-conn-v .sf-dot {
            position: absolute;
            left: -3px; top: 3px;
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #c8a96e;
            box-shadow: 0 0 6px rgba(200,169,110,0.9), 0 0 14px rgba(200,169,110,0.4);
            opacity: 0;
          }

          .sf-active .sf-conn-v .sf-dot {
            animation: sfDotV 1.9s ease-in-out infinite;
            animation-delay: calc(var(--d) + 0.55s);
          }

          .sf-arrow-v {
            position: absolute;
            bottom: -1px;
            left: 50%; transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 6px solid rgba(200,169,110,0.25);
            opacity: 0;
            transition: opacity 0.4s;
          }
          .sf-active .sf-arrow-v { opacity: 1; }
        }
      `}</style>
    </>
  )
}
