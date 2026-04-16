import styles from './SuggestionPopup.module.css'
import { dismissSuggestion } from '../utils/analyzeProgress'

export default function SuggestionPopup({ suggestion, onDismiss, onApply }) {
  if (!suggestion) return null

  function handleDismiss() {
    dismissSuggestion(suggestion)
    onDismiss()
  }

  function handleApply() {
    dismissSuggestion(suggestion)
    onApply(suggestion)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{suggestion.icon}</span>
        </div>

        <div className={styles.badge}>Plan Insight</div>

        <h3 className={styles.title}>{suggestion.title}</h3>

        <p className={styles.message}>{suggestion.message}</p>

        <div className={styles.actionBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>{suggestion.action}</span>
        </div>

        <div className={styles.btns}>
          <button className={styles.btnDismiss} onClick={handleDismiss}>
            Dismiss
          </button>
          <button className={styles.btnApply} onClick={handleApply}>
            Got it — I'll do this →
          </button>
        </div>

        <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
