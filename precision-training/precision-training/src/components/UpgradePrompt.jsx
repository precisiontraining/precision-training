import styles from './UpgradePrompt.module.css'

/**
 * Used to gate paid features.
 * variant="inline"  — small inline lock badge next to a button
 * variant="banner"  — full-width soft banner
 * variant="modal"   — centered modal overlay
 */
export default function UpgradePrompt({ variant = 'banner', feature = '', onDismiss }) {

  const featureText = feature || 'This feature'

  if (variant === 'inline') return (
    <span className={styles.inlineLock} title="Available in Premium">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      Premium
    </span>
  )

  if (variant === 'banner') return (
    <div className={styles.banner}>
      <div className={styles.bannerLeft}>
        <span className={styles.bannerIcon}>🔒</span>
        <div>
          <div className={styles.bannerTitle}>{featureText} is a Premium feature</div>
          <div className={styles.bannerSub}>Coming soon — you'll be the first to know when it launches.</div>
        </div>
      </div>
      {onDismiss && <button className={styles.bannerDismiss} onClick={onDismiss}>✕</button>}
    </div>
  )

  if (variant === 'modal') return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onDismiss?.()}>
      <div className={styles.modal}>
        <div className={styles.modalIcon}>🔒</div>
        <div className={styles.modalTitle}>Premium Feature</div>
        <div className={styles.modalFeature}>{featureText}</div>
        <p className={styles.modalText}>
          This is part of the upcoming Premium plan. You're on the free tier — which already includes your full personalized plan, progress tracker, and AI Coach.
        </p>
        <div className={styles.modalComingSoon}>
          Premium launching soon · You'll be notified
        </div>
        <button className={styles.modalDismiss} onClick={onDismiss}>Got it</button>
      </div>
    </div>
  )

  return null
}
