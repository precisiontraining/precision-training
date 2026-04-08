import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Impressum() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← Back to Precision Training</Link>
        <h1>Impressum</h1>

        <h2>Angaben gemäß § 5 TMG</h2>
        <p>Precision Training<br />
        Florian Rappold<br />
        Maikäferstraße 3f<br />
        85551 Kirchheim<br />
        Deutschland</p>

        <p>Website: <a href="https://www.precision-training.io">www.precision-training.io</a></p>
        <p>E-Mail: <a href="mailto:info@precision-training.io">info@precision-training.io</a></p>

        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>Florian Rappold<br />
        Maikäferstraße 3f<br />
        85551 Kirchheim<br />
        Deutschland</p>

        <h2>Haftung für Inhalte</h2>
        <p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>

        <h2>Haftung für Links</h2>
        <p>Unsere Website enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte übernehmen wir keine Gewähr.</p>

        <h2>Urheberrecht</h2>
        <p>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf dieser Website unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
      </div>
    </div>
  )
}
