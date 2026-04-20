import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <div className="hero-content">
        <h1 className="hero-title">VIVI LA BRUNA</h1>
        <p className="hero-subtitle">Scopri Come Costruire il Tuo Itinerario Perfetto</p>

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
      </div>
    </div>
  );
}
