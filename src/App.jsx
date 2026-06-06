import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Activities from './pages/Activities/Activities';
import Prova from './pages/Prova/Prova';
import MyProgram from './pages/MyProgram/MyProgram';
import Social from './pages/Social/Social';
import Viability, { ParkingMapPage } from './pages/Viability/Viability';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attivita" element={<Activities />} />
        <Route path="/prova" element={<Prova />} />
        <Route path="/la-storia" element={<MyProgram />} />
        <Route path="/il-mio-programma" element={<Navigate to="/la-storia" replace />} />
        <Route path="/viabilita" element={<Viability />} />
        <Route path="/viabilita/parcheggi" element={<ParkingMapPage />} />
        <Route path="/social" element={<Social />} />
      </Routes>
      <Footer />
    </>
  );
}
