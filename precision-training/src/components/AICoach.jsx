import { useState, useRef, useEffect } from 'react'
import { PLAN_CHAT_URL, SUPABASE_ANON_KEY } from '../constants'
import styles from './AICoach.module.css'

const DAILY_LIMIT = 10
const STORAGE_KEY = (slug) => `pt_coach_${slug}_${new Date().toDateString()}`

export default function AICoach({ slug }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I know your plan inside out. Ask me anything – substitutions, technique tips, or how to get the most out of your program.", time: now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const [msgCount, setMsgCount] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEY(slug)) || '0') } catch { return 0 }
  })
  const bottomRef = useRef(null)

  const chips = ['Can I substitute an exercise?', 'How much rest between sets?', 'What should I eat before training?']
  const remaining = DAILY_LIMIT - msgCount
  const limitReached = remaining <= 0

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function send(text) {
    if (limitReached) return
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    setShowChips(false)

    const newCount = msgCount + 1
    setMsgCount(newCount)
    try { localStorage.setItem(STORAGE_KEY(slug), String(newCount)) } catch {}

    setMessages(prev => [...prev, { role: 'user', content: userMsg, time: now() }])
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(PLAN_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, message: userMsg, history }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, something went wrong.', time: now() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect. Please try again.', time: now() }])
    }
    setLoading(false)
  }

  return (
    <div className={styles.coach}>
      <div className={styles.header}>
        <span className={styles.icon}>💬</span>
        <div>
          <h2 className={styles.title}>Ask Your AI Coach</h2>
          <p className={styles.sub}>Ask anything about your plan</p>
        </div>
        <div className={styles.limitBadge} style={{ color: remaining <= 3 ? '#e05555' : 'var(--gold)' }}>
          {remaining}/{DAILY_LIMIT} left today
        </div>
      </div>

      <div className={styles.chatWindow}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msgWrap} ${m.role === 'user' ? styles.msgUser : styles.msgAi}`}>
            {m.role === 'assistant' && <div className={styles.avatar}>PT</div>}
            <div className={styles.msgInner}>
              <div className={styles.bubble}>{m.content}</div>
              <div className={styles.time}>{m.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.msgWrap} ${styles.msgAi}`}>
            <div className={styles.avatar}>PT</div>
            <div className={styles.msgInner}>
              <div className={styles.bubble}>
                <div className="dots-loader"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showChips && !limitReached && (
        <div className={styles.chips}>
          {chips.map(c => (
            <button key={c} className={styles.chip} onClick={() => send(c)}>{c}</button>
          ))}
        </div>
      )}

      {limitReached ? (
        <div className={styles.limitReached}>
          You've used all {DAILY_LIMIT} questions for today. Come back tomorrow!
        </div>
      ) : (
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about your plan..."
          />
          <button className={styles.sendBtn} onClick={() => send()}>→</button>
        </div>
      )}
    </div>
  )
}
