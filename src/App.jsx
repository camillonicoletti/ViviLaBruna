import './index.css';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import KnightChat from './components/KnightChat/KnightChat';
import Footer from './components/Footer/Footer';

export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <div id="knight-chat-section">
        <KnightChat />
      </div>
      <Footer />
    </>
  );
}
