import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
        <span className={styles.logoGold}>Precision</span>
        <span className={styles.logoWhite}> Training</span>
      </Link>

      {/* Center nav links — desktop */}
      <div className={styles.centerLinks}>
        <Link
          to="/blog"
          className={`${styles.navLink} ${location.pathname.startsWith('/blog') ? styles.navLinkActive : ''}`}
        >
          Blog
        </Link>
      </div>

      {/* Right CTA buttons — desktop */}
      <div className={styles.actions}>
        <Link to="/form/glp1" className={styles.btnOutline}>
          💊 GLP-1 Training
        </Link>
        <Link to="/form/glp1-nutrition" className={styles.btnPrimary}>
          💊 GLP-1 Nutrition
        </Link>
      </div>

      {/* Hamburger — mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/blog" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            Blog
          </Link>
          <Link to="/form/glp1" className={styles.mobileBtnOutline} onClick={() => setMenuOpen(false)}>
            💊 GLP-1 Training Plan
          </Link>
          <Link to="/form/glp1-nutrition" className={styles.mobileBtnPrimary} onClick={() => setMenuOpen(false)}>
            💊 GLP-1 Nutrition Plan
          </Link>
        </div>
      )}
    </nav>
  )
}
