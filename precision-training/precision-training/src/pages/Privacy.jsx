import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Privacy() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← Back to Precision Training</Link>
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: April 2026</p>

        <h2>1. General Information</h2>
        <p>This Privacy Policy explains how Precision Training ("we", "us", "our") collects, uses, and protects your personal data when you use our digital fitness products available at <a href="https://www.precision-training.io">www.precision-training.io</a>. We are committed to protecting your privacy and handling your data responsibly and in compliance with the EU General Data Protection Regulation (GDPR).</p>

        <h2>2. Data We Collect</h2>
        <p>When you fill out a form or use our Service, we may collect: full name, email address, age, gender, height, weight, training frequency, activity level, nutrition preferences, food exclusions, available equipment, and any additional information you voluntarily provide.</p>
        <p><strong>GLP-1 related data:</strong> If you use our GLP-1 Muscle Guard plans, we also collect information about your medication stage (e.g. Starting, Maintenance). This health-related information is used exclusively to generate your personalized plan and is never sold, shared with third parties, or used for advertising. By submitting this information, you explicitly consent to its processing for plan generation purposes.</p>

        <h2>3. Purpose of Data Processing</h2>
        <p>Your data is processed exclusively for: generating your personalized training and/or nutrition plan, delivering your plan via email, operating your password-protected plan page, improving Service quality (aggregated, anonymized only), and customer support. We may contact you in the future about Service updates or Premium features — you can opt out at any time by replying to any email.</p>

        <h2>4. Legal Basis (GDPR)</h2>
        <p>For users in the European Union: data processing is based on your explicit consent (Art. 6(1)(a) GDPR) provided when submitting the form, and on the necessity to fulfill our service agreement (Art. 6(1)(b) GDPR). Health-related data (GLP-1 medication stage) is processed based on your explicit consent (Art. 9(2)(a) GDPR).</p>

        <h2>5. Data Storage & Retention</h2>
        <p>Your plan data is stored securely on Supabase (EU region). Your data is retained for as long as your plan page is active. You may request deletion at any time by contacting us. Password-protected plan pages use minimal credential storage — your full password is never stored in plaintext.</p>

        <h2>6. Data Security</h2>
        <p>We implement technical measures including encrypted data transmission (HTTPS/TLS), password-protected plan page access, strict database access controls, and regular security reviews. If you believe your data has been compromised, contact us immediately.</p>

        <h2>7. Cookies & Local Storage</h2>
        <p>We use browser sessionStorage to remember your plan page login within a single browser session (cleared when you close the browser). We use localStorage to track free-tier usage limits (AI Coach questions, exercise swaps). We use Vercel Analytics for anonymized page-view tracking — no personal data is collected. We do not use advertising cookies or third-party tracking pixels.</p>

        <h2>8. Third-Party Services</h2>
        <p>We use the following processors: Supabase (data storage, EU region), Mailjet (email delivery), Make.com (automation), OpenRouter / OpenAI (AI plan generation — your data is processed to generate your plan only, not to train AI models), and Vercel (hosting and analytics).</p>

        <h2>9. Your Rights</h2>
        <p>If you are located in the EU, you have the right to: access your stored data, request correction or deletion of your data, withdraw consent at any time, and lodge a complaint with your national data protection authority. To exercise these rights, contact: <a href="mailto:info@precision-training.io">info@precision-training.io</a></p>

        <h2>10. Children's Privacy</h2>
        <p>Our Service is not intended for users under the age of 16. We do not knowingly collect data from minors. If you believe a minor has submitted data, contact us and we will delete it promptly.</p>

        <h2>11. Contact & Data Controller</h2>
        <p>Florian Rappold (Precision Training)<br />
        Maikäferstraße 3f, 85551 Kirchheim, Germany<br />
        Email: <a href="mailto:info@precision-training.io">info@precision-training.io</a></p>
      </div>
    </div>
  )
}
