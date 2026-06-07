import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/pages.module.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    // In production: POST to /api/contact
    setSent(true);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.header}>
        <div className={styles.badge}>Support · Sales · Partnerships</div>
        <h1 className={styles.h1}>Get in Touch</h1>
        <p className={styles.sub}>Our team typically responds within 2 business hours.</p>
      </div>

      <div className={styles.contactGrid}>
        <div>
          <h3 className={styles.colTitle}>Contact Channels</h3>
          {[
            { icon: '✉️', title: 'General Support', email: 'support@promptfactory.io', note: 'Response within 2 business hours' },
            { icon: '🏢', title: 'Enterprise Sales', email: 'sales@promptfactory.io', note: 'Team plans, custom integrations, SLAs' },
            { icon: '🤝', title: 'Partnerships', email: 'partners@promptfactory.io', note: 'API access, white-label, resellers' },
          ].map((c) => (
            <div key={c.title} className={styles.contactItem}>
              <div className={styles.contactIcon}>{c.icon}</div>
              <div>
                <div className={styles.contactTitle}>{c.title}</div>
                <div className={styles.contactEmail}>{c.email}</div>
                <div className={styles.contactNote}>{c.note}</div>
              </div>
            </div>
          ))}
          <div className={styles.enterpriseBanner}>
            <div className={styles.enterpriseTitle}>⭐ For Enterprise Teams</div>
            <p className={styles.enterpriseDesc}>Looking for team plans with shared prompt libraries, SSO, and dedicated support?</p>
            <button className={styles.demoBtn}>Book a Demo</button>
          </div>
        </div>

        <div className={styles.formBox}>
          <h3 className={styles.colTitle}>Send a Message</h3>
          {sent ? (
            <div className={styles.successMsg}>✓ Message sent! We'll get back to you shortly.</div>
          ) : (
            <form onSubmit={submit}>
              <div className={styles.formRow}>
                <div className={styles.field}><label className={styles.label}>Name</label><input className={styles.input} value={form.name} onChange={set('name')} required /></div>
                <div className={styles.field}><label className={styles.label}>Email</label><input className={styles.input} type="email" value={form.email} onChange={set('email')} required /></div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Subject</label>
                <select className={styles.input} value={form.subject} onChange={set('subject')}>
                  {['General Enquiry', 'Billing Issue', 'Enterprise Sales', 'Technical Support', 'Partnership'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Message</label>
                <textarea className={styles.textarea} value={form.message} onChange={set('message')} required />
              </div>
              <button type="submit" className={styles.submitBtn}>Send Message</button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
