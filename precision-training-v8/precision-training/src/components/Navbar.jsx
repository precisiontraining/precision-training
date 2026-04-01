import { Link } from 'react-router-dom'
import { TALLY_TRAINING, TALLY_NUTRITION } from '../constants'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoGold}>Precision</span>
        <span className={styles.logoWhite}> Training</span>
      </Link>
      <div className={styles.actions}>
        <a href={TALLY_TRAINING} target="_blank" rel="noreferrer" className={styles.btnOutline}>
          Get Training Plan
        </a>
        <a href={TALLY_NUTRITION} target="_blank" rel="noreferrer" className={styles.btnOutline}>
          Get Nutrition Plan
        </a>
      </div>
    </nav>
  )
}
