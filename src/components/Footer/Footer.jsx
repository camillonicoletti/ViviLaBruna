import './Footer.css';

const LINKS = {
  'Esplora': ['La Bruna', 'I Sassi', 'Gastronomia', 'Arte Rupestre'],
  'Pianifica': ['Percorso Personalizzato', 'Dove Dormire', 'Dove Mangiare', 'Come Arrivare'],
  'Supporto': ['FAQ', 'Contatti', 'Privacy Policy', 'Cookie Policy'],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/Screenshot_2026-03-27_alle_02.06.14-removebg-preview.png" alt="Festa della Bruna" className="footer-logo-png" />
            <span>VIVI LA <strong>BRUNA</strong></span>
          </div>
          <p className="footer-tagline">
            La tua guida per vivere<br />la Festa della Bruna a Matera.
          </p>
          <div className="footer-socials">
            {['f', 'in', 'ig', 'yt'].map((s) => (
              <a key={s} href="#" className="social-btn" aria-label={s}>{s.toUpperCase()}</a>
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
      </div>

      <div className="footer-bottom">
        <p>© Associazione Maria SS della Bruna. All Right Reserved 2027</p>
        <p>Website created by <a href="https://www.linkedin.com/in/camillonicoletti/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Camillo Nicoletti</a></p>
      </div>
    </footer>
  );
}
