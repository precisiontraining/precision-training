import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getPublishedPosts } from '../data/blogPosts'
import styles from './Blog.module.css'

const CATEGORIES = ['All', 'GLP-1', 'Training', 'Nutrition', 'Recovery', 'Science']

export default function Blog() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const allPosts = useMemo(() => getPublishedPosts(), [])

  // Always start at top when navigating to blog list
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const filtered = useMemo(() => allPosts.filter(p => {
    const matchCat = category === 'All' || p.category === category
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [allPosts, category, search])

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.hero}>
        <p className={styles.eyebrow}>PRECISION TRAINING BLOG</p>
        <h1 className={styles.heroTitle}>
          Science-backed <span className={styles.gold}>fitness insights</span>
        </h1>
        <p className={styles.heroSub}>
          Training principles, nutrition science, GLP-1 research and practical guides —
          written to help you make better decisions about your body.
        </p>

        <div className={styles.searchWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className={styles.search}
            placeholder="Search articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${styles.filterBtn} ${category === c ? styles.filterActive : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <p>No articles found{search ? ` for "${search}"` : ''}.</p>
            <button className={styles.resetBtn} onClick={() => { setSearch(''); setCategory('All') }}>
              Reset filters
            </button>
          </div>
        )}

        {featured && (
          <>
            <Link to={`/blog/${featured.slug}`} className={styles.featured}>
              <div className={styles.featuredMeta}>
                {featured.category && (
                  <span className={styles.catBadge}>{featured.category}</span>
                )}
                <span className={styles.readTime}>{featured.readTime} min read</span>
              </div>
              <h2 className={styles.featuredTitle}>{featured.title}</h2>
              <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
              <div className={styles.featuredFooter}>
                <span className={styles.date}>
                  {featured.publishedAt.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
                <span className={styles.readMore}>Read article →</span>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className={styles.grid}>
                {rest.map(post => (
                  <Link key={post.slug} to={`/blog/${post.slug}`} className={styles.card}>
                    <div className={styles.cardMeta}>
                      {post.category && (
                        <span className={styles.catBadgeSmall}>{post.category}</span>
                      )}
                      <span className={styles.readTimeSmall}>{post.readTime} min</span>
                    </div>
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    <p className={styles.cardExcerpt}>{post.excerpt}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.dateSmall}>
                        {post.publishedAt.toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      <span className={styles.arrow}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className={styles.footer}>
        <Link to="/" className={styles.footerLogo}>
          <span className={styles.gold}>Precision</span> Training
        </Link>
        <div className={styles.footerLinks}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/impressum">Impressum</Link>
        </div>
        <p className={styles.footerCopy}>© 2026 Precision Training. All rights reserved.</p>
      </footer>
    </div>
  )
}
