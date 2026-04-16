import { useState } from 'react'

export const COLORS = [
  { id: 'gold',   label: 'Gold',   value: '#c8a96e', light: '#d4b97e', dark: '#a88a50' },
  { id: 'blue',   label: 'Blue',   value: '#4a9eff', light: '#6eb2ff', dark: '#2a7fe6' },
  { id: 'purple', label: 'Purple', value: '#a78bda', light: '#b99de6', dark: '#8a6cc0' },
  { id: 'green',  label: 'Green',  value: '#6db88a', light: '#7fcca0', dark: '#4a9e68' },
]

export const LAYOUTS = [
  { id: 'cards',   label: 'Cards',   desc: 'Image + full details' },
  { id: 'compact', label: 'Compact', desc: 'Dense list, no images' },
  { id: 'grid',    label: 'Grid',    desc: '2-column overview' },
]

function CardsSVG({ color }) {
  return (
    <svg viewBox="0 0 88 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {[0, 25, 50].map((y, ri) => (
        <g key={ri}>
          <rect x="2" y={y + 2} width="84" height="20" rx="4" fill="#141414" stroke="#222" strokeWidth="0.8" />
          <rect x="8" y={y + 7} width="12" height="10" rx="2" fill={ri === 0 ? color + '33' : '#1e1e1e'} stroke={ri === 0 ? color + '55' : '#252525'} strokeWidth="0.5" />
          <rect x="28" y={y + 8} width="34" height="3" rx="1.5" fill={ri === 0 ? '#444' : '#2a2a2a'} />
          <rect x="28" y={y + 14} width="14" height="2" rx="1" fill="#252525" />
          <rect x="44" y={y + 14} width="12" height="2" rx="1" fill="#1e1e1e" />
          <rect x="74" y={y + 8} width="8" height="8" rx="2" fill="#1a1a1a" stroke="#252525" strokeWidth="0.5" />
        </g>
      ))}
    </svg>
  )
}

function CompactSVG({ color }) {
  return (
    <svg viewBox="0 0 88 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {[0, 14, 28, 42, 56].map((y, ri) => (
        <g key={ri}>
          <rect x="2" y={y + 2} width="84" height="11" rx="2.5" fill={ri === 0 ? '#181818' : '#121212'} stroke="#1e1e1e" strokeWidth="0.5" />
          <rect x="8" y={y + 5.5} width="5" height="3" rx="1.5" fill="#2a2a2a" />
          <rect x="18" y={y + 5.5} width={ri === 0 ? 26 : 20} height="3" rx="1.5" fill={ri === 0 ? '#3a3a3a' : '#252525'} />
          <rect x="50" y={y + 5.5} width="18" height="3" rx="1.5" fill="#1e1e1e" />
          <rect x="74" y={y + 5} width="10" height="4" rx="1.5" fill="#1a1a1a" />
        </g>
      ))}
    </svg>
  )
}

function GridSVG({ color }) {
  return (
    <svg viewBox="0 0 88 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {[[2, 2], [46, 2], [2, 38], [46, 38]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="38" height="32" rx="4" fill="#141414" stroke="#222" strokeWidth="0.8" />
          <rect x={x + 3} y={y + 3} width="32" height="16" rx="2" fill={i === 0 ? color + '22' : '#1a1a1a'} />
          <rect x={x + 3} y={y + 23} width="24" height="3" rx="1.5" fill={i === 0 ? '#3a3a3a' : '#252525'} />
          <rect x={x + 3} y={y + 28} width="16" height="2" rx="1" fill="#1e1e1e" />
        </g>
      ))}
    </svg>
  )
}

export default function LayoutChooser({ layout, color, onClose, onConfirm, isFirstTime }) {
  const [selLayout, setSelLayout] = useState(layout || 'cards')
  const [selColor, setSelColor] = useState(color || 'gold')

  const accent = COLORS.find(c => c.id === selColor)?.value || '#c8a96e'

  const PREVIEW = {
    cards:   <CardsSVG color={accent} />,
    compact: <CompactSVG color={accent} />,
    grid:    <GridSVG color={accent} />,
  }

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 8000,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease',
  }

  const modalStyle = {
    background: '#0e0e0e',
    border: '1px solid #1e1e1e',
    borderRadius: 20,
    padding: '28px 24px',
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    boxShadow: `0 0 60px ${accent}18`,
  }

  return (
    <div style={overlayStyle} onClick={e => { if (!isFirstTime && e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
          <div>
            {isFirstTime && (
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: accent, marginBottom: 8,
              }}>
                ✦ Your Plan is Ready
              </div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>
              {isFirstTime ? 'Choose Your Layout' : 'Plan Appearance'}
            </h2>
            {isFirstTime && (
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.5 }}>
                Customize how your plan looks. You can change this anytime.
              </p>
            )}
          </div>
          {!isFirstTime && (
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, background: '#1a1a1a',
                border: '1px solid #252525', color: '#666', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                flexShrink: 0, transition: 'all .2s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Layout section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#444', marginBottom: 12,
          }}>
            Layout
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {LAYOUTS.map(l => {
              const isActive = selLayout === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => setSelLayout(l.id)}
                  style={{
                    background: isActive ? `${accent}12` : '#0a0a0a',
                    border: `1.5px solid ${isActive ? accent : '#1e1e1e'}`,
                    borderRadius: 12,
                    padding: '12px 10px',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    minHeight: 110,
                  }}
                >
                  <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {PREVIEW[l.id]}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? accent : '#666', transition: 'color .2s' }}>
                    {l.label}
                  </div>
                  <div style={{ fontSize: 9, color: '#3a3a3a', textAlign: 'center', lineHeight: 1.4 }}>
                    {l.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Color section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#444', marginBottom: 12,
          }}>
            Accent Color
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map(c => {
              const isActive = selColor === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelColor(c.id)}
                  title={c.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: isActive ? `${c.value}15` : '#0a0a0a',
                    border: `1.5px solid ${isActive ? c.value : '#1e1e1e'}`,
                    borderRadius: 30,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    minHeight: 44,
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: c.value,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 8px ${c.value}88` : 'none',
                    transition: 'box-shadow .2s',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? c.value : '#555', transition: 'color .2s', fontFamily: 'Montserrat, sans-serif' }}>
                    {c.label}
                  </span>
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.value} strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={() => onConfirm(selLayout, selColor)}
          style={{
            width: '100%', padding: '15px',
            background: accent, color: '#000',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 900, fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer', transition: 'all .2s',
            letterSpacing: '0.02em',
            minHeight: 52,
          }}
        >
          {isFirstTime ? 'View My Plan →' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
