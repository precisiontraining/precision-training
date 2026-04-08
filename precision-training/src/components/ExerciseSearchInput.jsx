import { useState, useRef, useEffect } from 'react'
import { searchExercises } from '../utils/exerciseList'
import styles from './ExerciseSearchInput.module.css'

const FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Push-ups-2.png'

export default function ExerciseSearchInput({ value, onChange, placeholder = 'Search exercises…' }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  // If parent clears value externally
  useEffect(() => {
    if (!value) { setQuery(''); setResults([]); setIsOpen(false) }
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    onChange(null) // mark as unselected while typing

    if (val.trim().length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }
    const found = searchExercises(val)
    setResults(found)
    setIsOpen(found.length > 0)
    setHighlighted(-1)
  }

  function select(ex) {
    setQuery(ex.name)
    setResults([])
    setIsOpen(false)
    onChange(ex.name)
  }

  function handleKeyDown(e) {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && results[highlighted]) {
        select(results[highlighted])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputWrap}>
        <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => { setQuery(''); onChange(null); setResults([]); setIsOpen(false); inputRef.current?.focus() }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map((ex, i) => (
            <button
              key={ex.name}
              className={`${styles.result} ${i === highlighted ? styles.highlighted : ''}`}
              onMouseDown={e => { e.preventDefault(); select(ex) }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <div className={styles.resultImg}>
                <img
                  src={ex.gifUrl || FALLBACK}
                  alt={ex.name}
                  onError={e => { e.target.src = FALLBACK }}
                />
              </div>
              <span className={styles.resultName}>{ex.name}</span>
              <svg className={styles.resultArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !isOpen && results.length === 0 && (
        <div className={styles.noResults}>
          No exercise found — only listed exercises can be added to ensure images load correctly.
        </div>
      )}
    </div>
  )
}
