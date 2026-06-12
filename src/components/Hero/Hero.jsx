import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FireParticles from '../FireParticles/FireParticles';
import './Hero.css';

export default function Hero() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      // Forza l'autoplay ignorando le policy bloccanti
      videoRef.current.play().catch(error => {
        console.warn("Autoplay bloccato dal browser:", error);
      });
    }
  }, []);

  const scrollToChat = () => {
    const chatElement = document.getElementById('knight-chat-section');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="hero-container">
      <video
        ref={videoRef}
        className="hero-video"
        src="/video_sfondo.mp4"
        autoPlay
        loop
        muted
        playsInline
      ></video>
      <div className="hero-overlay"></div>
      <div className="hero-vignette"></div>

      {/* Scintille dorate che salgono come braci di festa */}
      <FireParticles />

      <div className="hero-content">
        <div className="hero-kicker">
          <span className="kicker-line"></span>
          <span className="kicker-text">Matera &middot; 2 Luglio 2026</span>
          <span className="kicker-line kicker-line-flip"></span>
        </div>

        <h1 className="hero-title">MATERA DA VIVERE</h1>

        <div className="hero-divider" aria-hidden="true">
          <span className="divider-line"></span>
          <svg className="divider-gem" viewBox="0 0 24 24">
            <path d="M12 1 L17.5 12 L12 23 L6.5 12 Z" fill="currentColor" />
          </svg>
          <span className="divider-line divider-line-flip"></span>
        </div>

        <p className="hero-subtitle">Scopri Come Costruire il Tuo Itinerario Perfetto</p>

        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={scrollToChat}>
            <span className="btn-sparkle">✦</span> Crea il tuo itinerario
          </button>
          <button className="hero-btn-ghost" onClick={() => navigate('/la-storia')}>
            Scopri la storia
          </button>
        </div>
      </div>

      <div className="scroll-ornament-wrapper" onClick={scrollToChat}>
        <svg className="scroll-ornament" viewBox="0 0 100 100" fill="none">
          <path d="M 25 50 L 50 75 L 75 50" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 50 15 L 56 25 L 50 35 L 44 25 Z" fill="url(#goldGrad)" />
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%"   stopColor="#E8C96D" />
              <stop offset="50%"  stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#9B7A28" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="hero-bottom-fade"></div>
    </div>
  );
}
