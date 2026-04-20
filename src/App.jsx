import { Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Activities from './pages/Activities/Activities';
import Prova from './pages/Prova/Prova';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attivita" element={<Activities />} />
        <Route path="/prova" element={<Prova />} />
      </Routes>
      <Footer />
    </>
  );
}
