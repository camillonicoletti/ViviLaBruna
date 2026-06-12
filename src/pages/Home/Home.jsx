import Hero from '../../components/Hero/Hero';
import KnightChat from '../../components/KnightChat/KnightChat';
import './Home.css';

export default function Home() {
  return (
    <>
      <Hero />
      <div className="home-ornament-divider" aria-hidden="true">
        <span className="home-ornament-line"></span>
        <svg className="home-ornament-gem" viewBox="0 0 24 24">
          <path d="M12 1 L17.5 12 L12 23 L6.5 12 Z" fill="currentColor" />
        </svg>
        <span className="home-ornament-line home-ornament-line-flip"></span>
      </div>
      <div id="knight-chat-section">
        <KnightChat />
      </div>
    </>
  );
}
