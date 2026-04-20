import Hero from '../../components/Hero/Hero';
import KnightChat from '../../components/KnightChat/KnightChat';

export default function Home() {
  return (
    <>
      <Hero />
      <div id="knight-chat-section">
        <KnightChat />
      </div>
    </>
  );
}
