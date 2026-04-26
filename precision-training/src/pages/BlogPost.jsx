import { useMemo, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import Navbar from '../components/Navbar'
import { getPostBySlug, getPublishedPosts } from '../data/blogPosts'
import styles from './BlogPost.module.css'

export default function BlogPost() {
  const { slug } = useParams()

  // Scroll to top on every slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [slug])

  const post = useMemo(() => {
    const p = getPostBySlug(slug)
    if (!p || p.publishedAt > new Date()) return null
    return p
  }, [slug])

  const related = useMemo(() => {
    if (!post) return []
    return getPublishedPosts()
      .filter(p => p.category === post.category && p.slug !== post.slug)
      .slice(0, 3)
  }, [post])

  // Sanitize HTML body — strip any injected scripts/event handlers
  const safeBody = useMemo(() => {
    if (!post?.body) return ''
    return DOMPurify.sanitize(post.body, {
      ALLOWED_TAGS: ['p','h2','h3','h4','ul','ol','li','strong','em','a','blockquote','br','span'],
      ALLOWED_ATTR: ['href','target','rel','title'],
      FORCE_HTTPS: true,
    })
  }, [post])

  if (!post) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat,sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>404</div>
          <p>Article not found.</p>
          <Link to="/blog" style={{ color: '#c8a96e', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <article className={styles.article}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadLink}>Home</Link>
          <span className={styles.breadSep}>›</span>
          <Link to="/blog" className={styles.breadLink}>Blog</Link>
          {post.category && (
            <>
              <span className={styles.breadSep}>›</span>
              <span className={styles.breadCurrent}>{post.category}</span>
            </>
          )}
        </div>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.meta}>
            {post.category && (
              <span className={styles.catBadge}>{post.category}</span>
            )}
            <span className={styles.readTime}>{post.readTime} min read</span>
            <span className={styles.date}>
              {post.publishedAt.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        </header>

        <hr className={styles.divider} />

        {/* Body — sanitized HTML */}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: safeBody }}
        />

        {/* Sources */}
        {post.sources && post.sources.length > 0 && (
          <div className={styles.sources}>
            <h3 className={styles.sourcesTitle}>Sources & Further Reading</h3>
            <ul className={styles.sourcesList}>
              {post.sources.map((src, i) => (
                <li key={i}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {src.label || src.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className={styles.cta}>
          <div className={styles.ctaInner}>
            <h3 className={styles.ctaTitle}>
              Ready for a plan built <span className={styles.gold}>around your body?</span>
            </h3>
            <p className={styles.ctaSub}>AI-generated, fully personalized — free to start.</p>
            <div className={styles.ctaBtns}>
              <Link to="/form/glp1" className={styles.btnPrimary}>
                💊 GLP-1 Training Plan →
              </Link>
              <Link to="/form/training" className={styles.btnSecondary}>
                Standard Training Plan
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div className={styles.related}>
          <h2 className={styles.relatedTitle}>
            More in <span className={styles.gold}>{post.category}</span>
          </h2>
          <div className={styles.relatedGrid}>
            {related.map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className={styles.relCard}>
                <div className={styles.relMeta}>
                  <span className={styles.relCat}>{p.category}</span>
                  <span className={styles.relTime}>{p.readTime} min</span>
                </div>
                <h3 className={styles.relTitle}>{p.title}</h3>
                <p className={styles.relExcerpt}>{p.excerpt}</p>
                <span className={styles.relArrow}>Read →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <Link to="/" className={styles.footerLogo}>
          <span className={styles.gold}>Precision</span> Training
        </Link>
        <div className={styles.footerLinks}>
          <Link to="/blog">Blog</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <p className={styles.footerCopy}>© 2026 Precision Training. All rights reserved.</p>
      </footer>
    </div>
  )
}
