import { Link } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoGold}>Precision</span>
        <span className={styles.logoWhite}> Training</span>
      </Link>
      <div className={styles.actions}>
        <Link to="/blog" className={styles.blogLink}>
          Blog
        </Link>
        <Link to="/form/glp1" className={styles.btnOutline}>
          💊 GLP-1 Training
        </Link>
        <Link to="/form/glp1-nutrition" className={styles.btnPrimary}>
          💊 GLP-1 Nutrition
        </Link>
      </div>
    </nav>
  )
}
