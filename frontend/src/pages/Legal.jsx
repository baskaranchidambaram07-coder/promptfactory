import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import s from '../styles/pages.module.css';

const PAGES = {
  terms: {
    title: 'Terms & Conditions',
    updated: 'June 06, 2026',
    sections: [
      { h: 'Acceptance of Terms', p: 'By accessing PromptFactory you agree to be bound by these Terms. If you do not agree, do not use the service.' },
      { h: 'Use of Service', p: 'You may use PromptFactory to browse, copy, and generate images from curated prompts. You may not resell, scrape, or redistribute prompt content without written permission.' },
      { h: 'Free & Premium Tiers', p: 'Free users may generate up to 3 images per day using a single-stage pipeline. Premium users receive unlimited generations with a 3-stage quality pipeline.' },
      { h: 'Intellectual Property', p: 'All prompts, UI, and branding are the property of PromptFactory Inc. Generated images belong to the user who created them.' },
      { h: 'Termination', p: 'We reserve the right to suspend or terminate accounts that violate these terms without prior notice.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'June 06, 2026',
    sections: [
      { h: 'Data We Collect', p: 'Account info (name, email, avatar via Google OAuth), usage data (prompts viewed, searches, generations), and device info (browser, IP).' },
      { h: 'How We Use Your Data', p: 'To authenticate your account, enforce daily limits, rank prompts by engagement, and send optional product updates.' },
      { h: 'Sharing & Disclosure', p: 'We do not sell your data. We share data only with service providers (hosting, payment processing) under strict confidentiality agreements.' },
      { h: 'Data Retention', p: 'Account data is retained while your account is active. You may request deletion at any time.' },
      { h: 'Your Rights (GDPR & DPDP)', p: 'You have the right to access, rectify, delete, or export your personal data. Submit requests to privacy@promptfactory.io' },
    ],
  },
  refund: {
    title: 'Refund & Return Policy',
    updated: 'June 06, 2026',
    sections: [
      { h: 'Digital Product Policy', p: 'PromptFactory sells digital subscriptions. Due to the nature of digital goods, all sales are final once the premium tier is activated.' },
      { h: 'Eligibility for Refund', p: 'Refunds may be granted within 48 hours of purchase if the premium features were not used. Contact support@promptfactory.io with your order details.' },
      { h: 'Billing Errors', p: 'If you were charged incorrectly, contact us within 7 days and we will issue a full refund for the erroneous charge.' },
      { h: 'Cancellation', p: 'You may cancel your premium subscription at any time. Access continues until the end of the billing period. No partial refunds for unused days.' },
    ],
  },
};

export default function Legal() {
  const { slug } = useParams();
  const page = PAGES[slug] || PAGES.terms;

  return (
    <div className={s.page}>
      <Navbar />
      <div className={s.legalLayout}>
        <nav className={s.legalNav}>
          <div className={s.legalNavLabel}>Legal</div>
          {Object.entries(PAGES).map(([key, val]) => (
            <Link key={key} to={`/legal/${key}`} className={`${s.legalNavItem} ${slug === key ? s.legalNavItemActive : ''}`}>
              {val.title}
            </Link>
          ))}
        </nav>
        <div className={s.legalContent}>
          <h1 className={s.h1}>{page.title}</h1>
          <p className={s.updated}>Last updated: {page.updated}</p>
          {page.sections.map((sec, i) => (
            <div key={i} className={s.section}>
              <h3>{i + 1}. {sec.h}</h3>
              <p>{sec.p}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
