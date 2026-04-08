import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Privacy() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← Back to Precision Training</Link>
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: 03.03.2026</p>

        <h2>1. General Information</h2>
        <p>This Privacy Policy explains how Precision Training ("we", "us", "our") collects, uses, and protects your personal data when you purchase and use our digital fitness products available at <a href="https://www.precision-training.io">www.precision-training.io</a>. We are committed to protecting your privacy and handling your data responsibly and transparently.</p>

        <h2>2. Data We Collect</h2>
        <p>When you purchase a product or fill out a form, we may collect: Full name, Email address, Age, Gender, Height and weight, Training frequency, Activity level, Nutrition preferences, Food exclusions, and any additional information you voluntarily provide.</p>

        <h2>3. Purpose of Data Processing</h2>
        <p>Your data is processed exclusively for the following purposes: Generating your personalized training plan, Generating your personalized nutrition plan (if purchased), Delivering your digital product via email, and Customer support and communication.</p>
        <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

        <h2>4. Payment Processing</h2>
        <p>Payments are securely processed through our payment provider. We do not store or process credit card information ourselves. All payment data is handled directly by the payment provider under their own privacy policies.</p>

        <h2>5. Legal Basis (GDPR)</h2>
        <p>If you are located in the European Union, your data is processed based on your consent and the necessity to fulfill a contract (delivery of your purchased digital product).</p>

        <h2>6. Data Storage & Security</h2>
        <p>We take appropriate technical and organizational measures to protect your personal data against unauthorized access, misuse, or loss. Your data is stored only as long as necessary to fulfill the purposes described above.</p>

        <h2>7. Your Rights</h2>
        <p>If you are located in the EU, you have the right to: Access your stored data, Request correction of inaccurate data, Request deletion of your data, and Withdraw consent at any time.</p>
        <p>To exercise these rights, contact us at: <a href="mailto:info@precision-training.io">info@precision-training.io</a></p>

        <h2>8. Third-Party Services</h2>
        <p>We may use third-party tools for: Payment processing, Email delivery, and Automation and plan generation. These providers process data only to the extent necessary to deliver our services.</p>

        <h2>9. Contact</h2>
        <p>Precision Training<br />
        Website: <a href="https://www.precision-training.io">www.precision-training.io</a><br />
        Email: <a href="mailto:info@precision-training.io">info@precision-training.io</a></p>
      </div>
    </div>
  )
}
