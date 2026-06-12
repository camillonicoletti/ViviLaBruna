import './Footer.css';

const LINKS = {
  'Esplora': ['La Bruna', 'I Sassi', 'Gastronomia', 'Arte Rupestre'],
  'Pianifica': ['Percorso Personalizzato', 'Dove Dormire', 'Dove Mangiare', 'Come Arrivare'],
  'Supporto': ['FAQ', 'Contatti', 'Privacy Policy', 'Cookie Policy'],
};

const MOBILE_LINKS = {
  'Esplora': [
    { label: 'Home', href: '/' },
    { label: 'La Storia', href: '/la-storia' },
    { label: 'Esplora Attivita', href: '/prova' },
    { label: 'Viabilita', href: '/viabilita' },
    { label: 'Social', href: '/social' },
  ],
  'Pianifica': [
    { label: 'Percorso Personalizzato', href: '/prova' },
    { label: 'Mappa Eventi', href: '/' },
    { label: 'Viabilita', href: '/viabilita' },
    { label: 'Cartolina Social', href: '/social' },
  ],
};

const SOCIAL_LINKS = [
  { id: 'facebook', label: 'Facebook', short: 'F' },
  { id: 'linkedin', label: 'LinkedIn', short: 'IN' },
  { id: 'instagram', label: 'Instagram', short: 'IG' },
  { id: 'youtube', label: 'YouTube', short: 'YT' },
];

function SocialIcon({ id }) {
  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8.2h2V5h-2.6c-3 0-4.5 1.8-4.5 4.4V12H6.5v3.2h2.4V22h3.4v-6.8h2.9l.5-3.2h-3.4V9.7c0-1 .3-1.5 1.7-1.5Z" />
      </svg>
    );
  }

  if (id === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.8 8.8H3.5V20h3.3V8.8ZM5.2 4a1.9 1.9 0 1 0 0 3.8A1.9 1.9 0 0 0 5.2 4Zm15.3 9.6c0-3-1.6-5-4.2-5-1.9 0-2.8 1-3.3 1.8V8.8H9.8V20H13v-5.9c0-1.6.8-2.6 2.1-2.6s2 .9 2 2.7V20h3.4v-6.4Z" />
      </svg>
    );
  }

  if (id === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5Zm0 2A2.5 2.5 0 0 0 5.5 8v8A2.5 2.5 0 0 0 8 18.5h8a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 16 5.5H8Zm4 3.2a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Zm0 2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm4.2-2.8a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.3 7.2a2.7 2.7 0 0 0-1.9-1.9C17.7 4.8 12 4.8 12 4.8s-5.7 0-7.4.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2.2 12c0 1.7.2 3.3.5 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.4.5 7.4.5s5.7 0 7.4-.5a2.7 2.7 0 0 0 1.9-1.9c.3-1.5.5-3.1.5-4.8s-.2-3.3-.5-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/Screenshot_2026-03-27_alle_02.06.14-removebg-preview.png" alt="Matera da Vivere" className="footer-logo-png" />
            <span>MATERA DA <strong>VIVERE</strong></span>
          </div>
          <p className="footer-tagline">
            La tua guida per scoprire<br />cosa fare a Matera.
          </p>
          <div className="footer-socials">
            {SOCIAL_LINKS.map((social) => (
              <a key={social.id} href="#" className="social-btn" aria-label={social.label}>
                <span className="social-label">{social.short}</span>
                <SocialIcon id={social.id} />
              </a>
            ))}
          </div>
        </div>

        {Object.entries(LINKS).map(([title, items]) => (
          <div className="footer-col" key={title}>
            <h4 className="footer-col-title">{title}</h4>
            <ul>
              {items.map((item) => (
                <li key={item}><a href="#">{item}</a></li>
              ))}
            </ul>
          </div>
        ))}

        <div className="footer-mobile-links">
          {Object.entries(MOBILE_LINKS).map(([title, items]) => (
            <div className="footer-mobile-col" key={title}>
              <h4 className="footer-col-title">{title}</h4>
              <ul>
                {items.map((item) => (
                  <li key={item.label}><a href={item.href}>{item.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© Associazione Maria SS della Bruna. All Right Reserved 2027</p>
        <p>Website created by <a href="https://www.linkedin.com/in/camillonicoletti/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Camillo Nicoletti</a></p>
      </div>
    </footer>
  );
}
