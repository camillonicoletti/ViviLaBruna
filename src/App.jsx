import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import BrunaMap from './components/BrunaMap/BrunaMap';
import Home from './pages/Home/Home';
import Geolocalizzati from './pages/Geolocalizzati/Geolocalizzati';
import DueLuglio from './pages/DueLuglio/DueLuglio';
import Activities from './pages/Activities/Activities';
import ActivitiesRedesign from './pages/ActivitiesRedesign/ActivitiesRedesign';
import Prova from './pages/Prova/Prova';
import MyProgram from './pages/MyProgram/MyProgram';
import Social from './pages/Social/Social';
import Viability, { ParkingMapPage } from './pages/Viability/Viability';

export default function App() {
  const location = useLocation();
  // La pagina GEOLOCALIZZATI è a tutto schermo: niente footer.
  const hideFooter = location.pathname === '/geolocalizzati';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/2-luglio" element={<DueLuglio />} />
        <Route path="/attivita" element={<Activities />} />
        <Route path="/esplora-attivita-nuova" element={<ActivitiesRedesign />} />
        <Route path="/prova" element={<Prova />} />
        <Route path="/la-storia" element={<MyProgram />} />
        <Route path="/il-mio-programma" element={<Navigate to="/la-storia" replace />} />
        <Route path="/viabilita" element={<Viability />} />
        <Route path="/viabilita/parcheggi" element={<ParkingMapPage />} />
        <Route path="/mappa" element={<BrunaMap fullscreenPage />} />
        <Route path="/geolocalizzati" element={<Geolocalizzati />} />
        <Route path="/social" element={<Social />} />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
}
