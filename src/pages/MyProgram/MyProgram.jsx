import React, { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html, useProgress, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './MyProgram.css';

const DEG = Math.PI / 180;

// ── 4 PUNTI FISSI NEL MONDO ──
const SPOTS = [
  { pos: new THREE.Vector3(-0.0120, -0.0042, -0.0448), yOff: -0.001, tiltZ: -1.5, rotY:  0,  zoom: 0.6,  w: 260, h: 420, textScale: 1   }, // spot 1
  { pos: new THREE.Vector3( 0.0154, -0.0024, -0.0199), yOff: -0.005, tiltZ: -1,   rotY: -9,  zoom: 0.65, w: 260, h: 420, textScale: 1   }, // spot 2
  { pos: new THREE.Vector3( 0.0140,  0.0079,  0.0020), yOff: -0.005, tiltZ:  0,   rotY:  0,  zoom: 1.4,  w: 520, h: 780, textScale: 1.5 }, // spot 3
  { pos: new THREE.Vector3( 0.0331, -0.0012,  0.0495), yOff: -0.001, tiltZ:  0,   rotY:  0,  zoom: 0.8,  w: 380, h: 560, textScale: 1   }, // spot 4
];

// Offset camera rispetto a ogni spot
const CAM_OFFSET = new THREE.Vector3(-0.032, 0.0005, -0.0015);

// Card dritta e rivolta verso la camera
const _forward = CAM_OFFSET.clone().normalize();
const _right   = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), _forward).normalize();
const _up      = new THREE.Vector3().crossVectors(_forward, _right).normalize();
const CARD_QUAT = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(_right, _up, _forward)
);

const HTML_SCALE = 0.0015;

const ACTIVITIES = [
  {
    id: 1, spotIdx: 0,
    title: 'Processione del Carro Trionfale',
    time: '08:00 – 10:30', category: 'Tradizione',
    description: 'Assisti alla maestosa processione del Carro Trionfale, trainato da otto muli addobbati, attraverso le vie del centro storico.',
    emoji: '🎭',
    image: 'https://images.unsplash.com/photo-1533504875323-289569ce45cd?q=80&w=1400&auto=format&fit=crop',
    history: {
      title: 'La processione dell’alba',
      text: 'Il 2 luglio comincia prima del sole: la sacra immagine della Bruna attraversa i quartieri tra campane, fuochi e preghiere. È la “processione dei pastori”, il primo atto della festa, con cui Matera si sveglia insieme al suo rito più antico.',
    },
  },
  {
    id: 2, spotIdx: 1,
    title: 'Tour Guidato dei Sassi',
    time: '11:00 – 13:00', category: 'Cultura',
    description: 'Esplora le chiese rupestri e le grotte abitate dei Sassi con una guida esperta. Un viaggio nella storia millenaria.',
    emoji: '🏛️',
    image: '/hud/matera_sassi_sunset.png',
    history: {
      title: 'I Sassi, scenario millenario',
      text: 'Abitati sin dalla preistoria e scavati nel tufo, i Sassi sono il cuore della città e della festa. Tra grotte e chiese rupestri la devozione alla Madonna della Bruna si tramanda da oltre sei secoli, fin dal 1389.',
    },
  },
  {
    id: 3, spotIdx: 2,
    title: 'Pranzo in Grotta',
    time: '13:30 – 15:00', category: 'Food & Drink',
    description: 'Degusta i piatti tipici lucani in un ristorante scavato nel tufo. Orecchiette, peperoni cruschi e pane di Matera.',
    emoji: '🍷',
    image: '/hud/matera_romantic_dinner.png',
    history: {
      title: 'Il Carro di cartapesta',
      text: 'Ogni anno un maestro cartapestaio modella un nuovo Carro Trionfale: una macchina sacra alta diversi metri, dipinta e dorata a mano. Mesi di lavoro per un capolavoro destinato a vivere una sola giornata.',
    },
  },
  {
    id: 4, spotIdx: 3,
    title: 'Laboratorio di Ceramica',
    time: '16:00 – 17:30', category: 'Workshop',
    description: 'Crea il tuo souvenir con le tecniche artigianali tradizionali materane. Un pezzo unico fatto da te.',
    emoji: '🎨',
    image: '/hud/matera_hot_air_balloon.png',
    history: {
      title: 'Le mani degli artigiani',
      text: 'La festa vive del lavoro degli artigiani materani: cartapestai, ceramisti e fabbri. Le loro mani custodiscono tecniche antiche che, di anno in anno, danno forma agli ornamenti e ai simboli della Bruna.',
    },
  },
  {
    id: 5, spotIdx: 0,
    title: 'Aperitivo al Belvedere',
    time: '18:30 – 20:00', category: 'Panorama',
    description: 'Goditi un Aperol Spritz con vista mozzafiato sulla Gravina. Il tramonto sui Sassi è indimenticabile.',
    emoji: '🌅',
    image: '/hud/matera_sassi_sunset.png',
    history: {
      title: 'La Cavalcata dei cavalieri',
      text: 'Nel cuore della giornata sfilano i Cavalieri della Bruna, in costume e con cavalli bardati. La Cavalcata scorta la Madonna e prepara la città al momento più atteso, trasformando le vie in un corteo storico.',
    },
  },
  {
    id: 6, spotIdx: 1,
    title: 'Lo Strazzo del Carro',
    time: '21:00 – 23:00', category: 'Esclusivo',
    description: 'Il momento più atteso: la distruzione rituale del Carro della Bruna. Fuochi, folla e adrenalina pura.',
    emoji: '🔥',
    image: 'https://images.unsplash.com/photo-1533504875323-289569ce45cd?q=80&w=1400&auto=format&fit=crop',
    history: {
      title: 'Lo Strazzo del Carro',
      text: 'A notte fonda la folla assale il Carro Trionfale e lo distrugge in pochi istanti: è lo “Strazzo”. Ogni frammento diventa reliquia e buon auspicio. La fine del Carro è già l’inizio della festa dell’anno successivo.',
    },
  },
];

// Storia legata all’opera centrale (la Madonna sul cavalletto)
const HERO_STORY = {
  title: 'La Madonna della Bruna',
  text: 'Patrona di Matera, la Madonna della Bruna è venerata dal 1389, quando fu istituita la festa della Visitazione del 2 luglio. Il nome “Bruna” richiama forse il longobardo “brûni”, difesa, o il colore scuro dell’antica icona: da oltre sei secoli è il simbolo della città.',
};

const PINACOTECA_WORKS = [
  { id: 'madonna', image: '/quadro_burna.png', history: HERO_STORY },
  ...ACTIVITIES.map((activity) => ({
    id: activity.id,
    image: activity.image,
    history: activity.history,
  })),
];

// Posizione orizzontale di ogni quadro lungo la parete (% dal bordo esterno).
// Stacchi non lineari: il 1° è il più largo, quindi serve più spazio dopo di lui.
const ROOM_ART_POS = [5, 15, 23];

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader-container">
        <h2 className="loading-title">Allestendo la Galleria...</h2>
        <div className="loading-bar">
          <div className="loading-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="loading-perc">{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

function SassiModel() {
  const { scene } = useGLTF('/italy_matera_sassi_houses.optimized.glb');
  return <primitive object={scene} />;
}




useGLTF.preload('/soldato_romano.glb');

function CameraRig({ curIdx }) {
  const { camera } = useThree();
  const targetPos  = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const spot = SPOTS[ACTIVITIES[curIdx].spotIdx];
    targetPos.copy(spot.pos).add(CAM_OFFSET.clone().multiplyScalar(spot.zoom));
    targetLook.copy(spot.pos);

    camera.position.lerp(targetPos, delta * 3);

    const lookMatrix = new THREE.Matrix4().lookAt(camera.position, targetLook, camera.up);
    const lookQuat   = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
    camera.quaternion.slerp(lookQuat, delta * 4);

    camera.near = 0.001;
    camera.far  = 1000;
    camera.updateProjectionMatrix();
  });

  return null;
}

// Posizione esatta cliccata dall'utente sul selciato
const AVATAR_POS = new THREE.Vector3(-0.0428, -0.0146, -0.0081);

const MOVE_SPEED = 0.00035;
const CAM_BEHIND = 0.022;
const CAM_HEIGHT = 0.018;
// rotazione base del modello (quella che lo mette nella direzione giusta)
const MODEL_ROT  = Math.PI / 2;

function Soldato({ avatarRef }) {
  const { scene } = useGLTF('/soldato_romano.glb');
  const { clone, offset } = useMemo(() => {
    const c = scene.clone();
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(0.006, 0.006, 0.006);
    c.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    const off = new THREE.Vector3(-center.x, -box.min.y, -center.z);
    return { clone: c, offset: off };
  }, [scene]);

  return (
    <group ref={avatarRef} position={AVATAR_POS.toArray()} rotation={[0, MODEL_ROT, 0]}>
      <primitive object={clone} position={offset.toArray()} />
    </group>
  );
}

function ExploreController({ joystickRef, lookDeltaRef, nearSpotRef, onNearSpot }) {
  const { camera } = useThree();
  const keys     = useRef({});
  const avatarRef = useRef();
  const facingY  = useRef(MODEL_ROT);
  const facingX  = useRef(0.15);
  const wheelRef = useRef(0);

  useEffect(() => {
    camera.near = 0.001;
    camera.far  = 1000;
    camera.updateProjectionMatrix();
    // Camera iniziale dietro il soldato
    camera.position.set(
      AVATAR_POS.x + Math.sin(MODEL_ROT) * CAM_BEHIND,
      AVATAR_POS.y + CAM_HEIGHT,
      AVATAR_POS.z + Math.cos(MODEL_ROT) * CAM_BEHIND,
    );
    camera.lookAt(AVATAR_POS.x, AVATAR_POS.y + 0.004, AVATAR_POS.z);
    const dn = (e) => { keys.current[e.code] = true; };
    const up  = (e) => { keys.current[e.code] = false; };
    const onWheel = (e) => {
      e.preventDefault();
      wheelRef.current = e.deltaY > 0 ? 1 : -1;
      clearTimeout(wheelRef._timer);
      wheelRef._timer = setTimeout(() => { wheelRef.current = 0; }, 150);
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup',   up);
    window.addEventListener('wheel',   onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup',   up);
      window.removeEventListener('wheel',   onWheel);
    };
  }, [camera]);

  useFrame((_, delta) => {
    if (!avatarRef.current) return;
    const speed = MOVE_SPEED * delta * 60;

    // Rotazione visuale col drag (orizzontale + verticale)
    if (lookDeltaRef.current) {
      facingY.current -= lookDeltaRef.current.x * 0.003;
      facingX.current += lookDeltaRef.current.y * 0.003;
      facingX.current = Math.max(-0.3, Math.min(0.7, facingX.current)); // clamp su/giù
      lookDeltaRef.current = null;
    }

    // Direzioni in base a dove guarda la camera
    const fwd   = new THREE.Vector3(-Math.sin(facingY.current), 0, -Math.cos(facingY.current));
    const right = new THREE.Vector3( Math.cos(facingY.current), 0, -Math.sin(facingY.current));

    // Input
    const dir = new THREE.Vector3();
    if (joystickRef.current) { dir.x += joystickRef.current.x; dir.z += joystickRef.current.y; }
    if (keys.current['KeyW'] || keys.current['ArrowUp'])    dir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  dir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  dir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;
    if (wheelRef.current !== 0) dir.z += wheelRef.current; // scroll avanti/indietro

    if (dir.length() > 0) {
      dir.normalize();
      avatarRef.current.position.addScaledVector(fwd,   -dir.z * speed);
      avatarRef.current.position.addScaledVector(right,  dir.x * speed);
      // Ruota il soldato nella direzione di movimento
      const targetAngle = Math.atan2(
        fwd.x * (-dir.z) + right.x * dir.x,
        fwd.z * (-dir.z) + right.z * dir.x
      );
      avatarRef.current.rotation.y = THREE.MathUtils.lerp(
        avatarRef.current.rotation.y, targetAngle, delta * 10
      );
    }

    // Camera segue da dietro, smooth
    const av = avatarRef.current.position;
    const targetCam = new THREE.Vector3(
      av.x + Math.sin(facingY.current) * CAM_BEHIND,
      av.y + CAM_HEIGHT,
      av.z + Math.cos(facingY.current) * CAM_BEHIND,
    );
    camera.position.lerp(targetCam, delta * 8);
    // Rotazione camera: yaw (Y) + pitch (X) controllati dal drag
    camera.rotation.order = 'YXZ';
    camera.rotation.y = facingY.current;
    camera.rotation.x = facingX.current;
    camera.rotation.z = 0;
    camera.updateMatrixWorld();

    // Controllo prossimità: trova lo spot più vicino entro raggio
    let nearest = -1;
    let minDist = PROXIMITY_RADIUS;
    SPOTS.forEach((spot, i) => {
      const d = av.distanceTo(spot.pos);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    if (nearest !== nearSpotRef.current) {
      nearSpotRef.current = nearest;
      onNearSpot(nearest);
    }
  });

  return <Soldato avatarRef={avatarRef} />;
}

function ExploreJoystick({ joystickRef }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const touchId = useRef(null);
  const center  = useRef({ x: 0, y: 0 });
  const SIZE = 130, KNOB = 50, MAX = 38;

  const startDrag = (clientX, clientY) => {
    const r = baseRef.current.getBoundingClientRect();
    center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    touchId.current = true;
  };
  const moveDrag = useCallback((clientX, clientY) => {
    if (!touchId.current) return;
    let dx = clientX - center.current.x, dy = clientY - center.current.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d > MAX) { dx *= MAX/d; dy *= MAX/d; }
    knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joystickRef.current = { x: dx/MAX, y: dy/MAX };
  }, [joystickRef]);
  const endDrag = useCallback(() => {
    touchId.current = null;
    knobRef.current.style.transform = 'translate(-50%, -50%)';
    joystickRef.current = null;
  }, [joystickRef]);

  // Touch
  const onTouchStart = (e) => { const t = e.changedTouches[0]; startDrag(t.clientX, t.clientY); };
  const onTouchMove  = useCallback((e) => { const t = e.changedTouches[0]; moveDrag(t.clientX, t.clientY); }, [moveDrag]);
  const onTouchEnd   = useCallback(() => endDrag(), [endDrag]);
  // Mouse
  const onMouseDown  = (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
  const onMouseMove  = useCallback((e) => moveDrag(e.clientX, e.clientY), [moveDrag]);
  const onMouseUp    = useCallback(() => endDrag(), [endDrag]);

  useEffect(() => {
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend',  onTouchEnd,  { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onTouchMove, onTouchEnd, onMouseMove, onMouseUp]);

  const arrowStyle = (rot) => ({
    position: 'absolute', top: '50%', left: '50%',
    width: 0, height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderBottom: '12px solid rgba(255,255,255,0.5)',
    transform: `translate(-50%, -50%) rotate(${rot}deg) translateY(-${SIZE/2 - 14}px)`,
    pointerEvents: 'none',
  });

  return (
    <div
      ref={baseRef}
      onTouchStart={onTouchStart}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', bottom: 40, left: 40,
        width: SIZE, height: SIZE,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.25)',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
        zIndex: 200, touchAction: 'none',
      }}
    >
      {/* Cerchio interno */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        width: SIZE * 0.6, height: SIZE * 0.6,
        borderRadius:'50%',
        border:'1.5px solid rgba(255,255,255,0.15)',
        transform:'translate(-50%,-50%)',
        pointerEvents:'none',
      }}/>
      {/* Frecce direzionali */}
      <div style={arrowStyle(0)}/>   {/* su */}
      <div style={arrowStyle(180)}/> {/* giù */}
      <div style={arrowStyle(-90)}/> {/* sinistra */}
      <div style={arrowStyle(90)}/>  {/* destra */}
      {/* Knob centrale */}
      <div ref={knobRef} style={{
        position:'absolute', top:'50%', left:'50%',
        width: KNOB, height: KNOB,
        borderRadius:'50%',
        background:'rgba(255,255,255,0.2)',
        border:'2px solid rgba(255,255,255,0.4)',
        backdropFilter:'blur(4px)',
        transform:'translate(-50%,-50%)',
        boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
      }}/>
    </div>
  );
}

const PROXIMITY_RADIUS = 0.035;

const STORY_MOMENTS = [
  {
    time: '05:30',
    label: 'Alba',
    title: 'Processione dei Pastori',
    description: 'La giornata comincia quando Matera e ancora mezza addormentata: il quadro della Madonna della Bruna attraversa i quartieri tra preghiere, campane, botti e passi di folla. E il primo atto popolare della festa, quello in cui la citta si sveglia insieme al rito e riconosce il 2 luglio come il suo giorno piu lungo.',
    skyStart: '#f7c77a',
    skyMid: '#b96a72',
    skyEnd: '#322944',
    accent: '#ffd086',
    dim: 0.16,
  },
  {
    time: '09:00',
    label: 'Mattina',
    title: 'Santa Messa',
    description: 'Dopo il risveglio della processione, la festa torna al suo centro religioso: la comunita si raccoglie per la celebrazione eucaristica, tra devozione, memoria e affidamento alla Patrona. La Messa tiene insieme il lato piu intimo della Bruna e la sua dimensione pubblica, prima che la giornata prenda il ritmo dei cortei.',
    skyStart: '#f8df9b',
    skyMid: '#9fc5d7',
    skyEnd: '#5d84a5',
    accent: '#f6c867',
    dim: 0.08,
  },
  {
    time: '13:00',
    label: 'Mezzogiorno',
    title: 'Cavalcata',
    description: 'Nel cuore della giornata entrano in scena i Cavalieri della Bruna, con costumi, cavalli bardati e una presenza che trasforma la citta in corteo storico. La Cavalcata accompagna la Madonna e prepara il passaggio verso il Carro Trionfale: e il momento in cui la festa diventa solenne, scenografica, quasi teatrale.',
    skyStart: '#ffe5a7',
    skyMid: '#93bdd0',
    skyEnd: '#496f92',
    accent: '#ffbd4a',
    dim: 0.03,
  },
  {
    time: '18:30',
    label: 'Tramonto',
    title: 'Il Carro esce verso la piazza',
    description: 'Quando la luce cala, il Carro Trionfale lascia la sua dimensione di opera d’arte e diventa protagonista della citta. Scortato dai cavalieri e seguito dalla folla, avanza verso il centro e verso la piazza: ogni metro aumenta l’attesa, perche tutti sanno che quella bellezza e destinata a durare solo poche ore.',
    skyStart: '#f7a94f',
    skyMid: '#b55454',
    skyEnd: '#27304d',
    accent: '#ff9f43',
    dim: 0.2,
  },
  {
    time: '23:00',
    label: 'Notte',
    title: 'Strazzo e fuochi',
    description: 'La notte porta il momento piu atteso e piu violento del rito: lo Strazzo, l’assalto al Carro Trionfale, che viene spogliato e distrutto in pochi istanti. I pezzi diventano ricordo e buon auspicio, mentre i fuochi chiudono la giornata con una luce finale sopra Matera: la fine del Carro e gia l’inizio della festa dell’anno dopo.',
    skyStart: '#2b2d63',
    skyMid: '#151730',
    skyEnd: '#07080f',
    accent: '#ff6b35',
    dim: 0.48,
  },
];

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function SpotMarker({ position, visible }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = position[1] + 0.008 + Math.sin(t * 2) * 0.002;
    meshRef.current.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.4;
    meshRef.current.scale.setScalar(visible ? 0 : 1);
  });
  return (
    <mesh ref={meshRef} position={[position[0], position[1] + 0.008, position[2]]}>
      <sphereGeometry args={[0.0025, 12, 12]} />
      <meshStandardMaterial
        color="#ffb347"
        emissive="#ff8800"
        emissiveIntensity={1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
} // distanza entro cui appare il quadro

export default function MyProgram() {
  const navigate = useNavigate();
  const [showGallery, setShowGallery] = useState(false);
  // Il cavaliere parte dall'inizio della barra (Alba 05:30), non dalle 18:30
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [curIdx, setCurIdx] = useState(0);
  const [exploreMode, setExploreMode] = useState(false);
  const [nearSpotIdx, setNearSpotIdx] = useState(-1);
  const [exhibitRevealed, setExhibitRevealed] = useState(false);
  const [activeArt, setActiveArt] = useState(null); // opera selezionata → spiegazione storica
  const [pinacotecaIndex, setPinacotecaIndex] = useState(0);
  const exhibitRef    = useRef(null);
  const routeStageRef = useRef(null);
  const joystickRef   = useRef(null);
  const lookDeltaRef  = useRef(null);
  const nearSpotRef   = useRef(-1); // ref per evitare chiamate setState ogni frame
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const N = ACTIVITIES.length;

  const handleNext = useCallback(() => setCurIdx(c => (c < N - 1 ? c + 1 : c)), [N]);
  const handlePrev = useCallback(() => setCurIdx(c => (c > 0 ? c - 1 : c)), []);

  useEffect(() => {
    if (!showGallery) return undefined;

    let lastTime = 0;
    const onWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTime < 700) return;
      if (e.deltaY > 15)       { handleNext(); lastTime = now; }
      else if (e.deltaY < -15) { handlePrev(); lastTime = now; }
    };
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); handlePrev(); }
    };
    let touchStartY = 0;
    const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const onTouchEnd = (e) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 30) return;
      if (diff > 0) handleNext();
      else handlePrev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [showGallery, handleNext, handlePrev]);

  // Chiudi la spiegazione storica con Esc + blocca lo scroll mentre è aperta
  useEffect(() => {
    if (!activeArt) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setActiveArt(null); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeArt]);

  const camStart = useMemo(() => SPOTS[0].pos.clone().add(CAM_OFFSET.clone().multiplyScalar(SPOTS[0].zoom)), []);
  const activeMomentIndex = Math.round(journeyProgress * (STORY_MOMENTS.length - 1));
  const activeMoment = STORY_MOMENTS[activeMomentIndex];
  const activePinacotecaWork = PINACOTECA_WORKS[pinacotecaIndex];
  const showPrevPinacotecaWork = useCallback(() => {
    setPinacotecaIndex((value) => (value === 0 ? PINACOTECA_WORKS.length - 1 : value - 1));
  }, []);
  const showNextPinacotecaWork = useCallback(() => {
    setPinacotecaIndex((value) => (value + 1) % PINACOTECA_WORKS.length);
  }, []);
  const storyIntroStyle = {
    '--rider-x': `${8 + journeyProgress * 84}%`,
    '--sky-start': activeMoment.skyStart,
    '--sky-mid': activeMoment.skyMid,
    '--sky-end': activeMoment.skyEnd,
    '--scene-dim': activeMoment.dim,
    '--event-accent': activeMoment.accent,
    '--fireworks-opacity': activeMomentIndex === STORY_MOMENTS.length - 1 ? 0.82 : 0,
  };

  const updateJourneyFromPointer = useCallback((clientX) => {
    const rect = routeStageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setJourneyProgress(clamp01((clientX - rect.left) / rect.width));
  }, []);

  const handleRoutePointerDown = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateJourneyFromPointer(e.clientX);
  }, [updateJourneyFromPointer]);

  const handleRoutePointerMove = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.buttons !== 1) return;
    updateJourneyFromPointer(e.clientX);
  }, [updateJourneyFromPointer]);

  const handleRouteKeyDown = useCallback((e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setJourneyProgress((value) => clamp01(value + (e.key === 'ArrowRight' ? 0.04 : -0.04)));
  }, []);

  // Look control in explore mode: mouse drag (desktop) + touch drag (mobile)
  useEffect(() => {
    if (!exploreMode) return;
    // Desktop: mouse drag
    let dragging = false, lastMouse = { x: 0, y: 0 };
    const onMouseDown = (e) => { dragging = true; lastMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!dragging) return;
      lookDeltaRef.current = { x: e.clientX - lastMouse.x, y: e.clientY - lastMouse.y };
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { dragging = false; };
    // Mobile: touch drag (lato destro)
    let lookTouch = null, lastPos = { x: 0, y: 0 };
    const onStart = (e) => { for (const t of e.changedTouches) { if (t.clientX > window.innerWidth * 0.4 && !lookTouch) { lookTouch = t.identifier; lastPos = { x: t.clientX, y: t.clientY }; } } };
    const onMove  = (e) => { for (const t of e.changedTouches) { if (t.identifier === lookTouch) { lookDeltaRef.current = { x: t.clientX - lastPos.x, y: t.clientY - lastPos.y }; lastPos = { x: t.clientX, y: t.clientY }; } } };
    const onEnd   = (e) => { for (const t of e.changedTouches) { if (t.identifier === lookTouch) lookTouch = null; } };
    window.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseup',    onMouseUp);
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      window.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [exploreMode]);

  // La mostra si "scopre" da sola quando entra in scena (scroll into view)
  useEffect(() => {
    if (showGallery || exhibitRevealed) return undefined;
    const el = exhibitRef.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setExhibitRevealed(true); return undefined; }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.3)) {
          setExhibitRevealed(true);
        }
      },
      { threshold: [0, 0.3, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [showGallery, exhibitRevealed]);

  if (!showGallery) {
    return (
      <>
        <main className="story-intro-page" style={storyIntroStyle}>
          <div className="story-sky-tint"></div>
          <div className="story-landscape-glow"></div>
          <div className="story-fireworks" aria-hidden="true"></div>

          <section className="story-intro-content">
            <h1>Il 2 luglio</h1>
            <p className="story-intro-subtitle">Sposta il cavaliere per vedere la timeline</p>

            <section
              ref={routeStageRef}
              className="story-rider-stage"
              onPointerDown={handleRoutePointerDown}
              onPointerMove={handleRoutePointerMove}
            >
              <div className="story-route-line"></div>
              <div
                className="story-rider"
                role="slider"
                tabIndex="0"
                aria-label="Cavaliere della giornata"
                aria-valuemin="0"
                aria-valuemax={STORY_MOMENTS.length - 1}
                aria-valuenow={activeMomentIndex}
                aria-valuetext={`${activeMoment.label}, ${activeMoment.title}`}
                onKeyDown={handleRouteKeyDown}
              >
                <span className="story-rider-shadow"></span>
                <img src="/knight_transparent.png" alt="Cavaliere della Bruna" draggable="false" />
              </div>
            </section>

            <div className="story-moment-strip">
              {STORY_MOMENTS.map((moment, index) => (
                <button
                  key={moment.time}
                  className={`story-moment-dot ${index === activeMomentIndex ? 'active' : ''}`}
                  onClick={() => setJourneyProgress(index / (STORY_MOMENTS.length - 1))}
                >
                  <span>{moment.time}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="story-event-panel">
            <div className="story-event-card">
              <div className="story-event-time">{activeMoment.time} · {activeMoment.label}</div>
              <h2>{activeMoment.title}</h2>
              <p>{activeMoment.description}</p>
            </div>
          </section>
        </main>
        <section
          ref={exhibitRef}
          className={`pinacoteca ${exhibitRevealed ? 'is-lit' : ''}`}
          aria-labelledby="pina-title"
        >
          <header className="pina-intro">
            <p className="pina-kicker">La pinacoteca della Bruna</p>
            <h2 id="pina-title">Le opere del 2 luglio</h2>
          </header>

          {/* OPERA CENTRALE: Madonna su cavalletto, appoggiato al pavimento */}
          <figure className="pina-hero">
            <span className="pina-easel" aria-hidden="true">
              <span className="easel-leg easel-leg--back"></span>
              <span className="easel-leg easel-leg--left"></span>
              <span className="easel-leg easel-leg--right"></span>
            </span>
            <button
              type="button"
              className={`pina-hero-frame ${activePinacotecaWork.id !== 'madonna' ? 'pina-hero-frame--framed' : ''}`}
              onClick={() => setActiveArt(activePinacotecaWork)}
              aria-label={`${activePinacotecaWork.history.title} — scopri la storia`}
            >
              <img
                src={activePinacotecaWork.image}
                alt={activePinacotecaWork.history.title}
                className={activePinacotecaWork.id === 'madonna' ? 'pina-madonna-image' : ''}
              />
            </button>
            <button
              type="button"
              className="pina-gallery-arrow pina-gallery-arrow--prev"
              onClick={showPrevPinacotecaWork}
              aria-label="Quadro precedente"
            >
              ‹
            </button>
            <button
              type="button"
              className="pina-gallery-arrow pina-gallery-arrow--next"
              onClick={showNextPinacotecaWork}
              aria-label="Quadro successivo"
            >
              ›
            </button>
          </figure>

          {/* parete sinistra */}
          {ACTIVITIES.slice(0, 3).map((activity, k) => (
            <div
              key={activity.id}
              className="room-art room-art--left"
              style={{ '--i': k, '--k': k, left: `${ROOM_ART_POS[k]}%` }}
            >
              <span className="room-art-num" aria-hidden="true">{k + 1}</span>
              <button
                type="button"
                className="pina-frame pina-work-frame"
                onClick={() => setActiveArt(activity)}
                aria-label={`${activity.history.title} — scopri la storia`}
              >
                <img src={activity.image} alt={activity.history.title} loading="lazy" />
              </button>
            </div>
          ))}

          {/* parete destra */}
          {ACTIVITIES.slice(3, 6).map((activity, k) => (
            <div
              key={activity.id}
              className="room-art room-art--right"
              style={{ '--i': k + 3, '--k': k, right: `${ROOM_ART_POS[k]}%` }}
            >
              <span className="room-art-num" aria-hidden="true">{6 - k}</span>
              <button
                type="button"
                className="pina-frame pina-work-frame"
                onClick={() => setActiveArt(activity)}
                aria-label={`${activity.history.title} — scopri la storia`}
              >
                <img src={activity.image} alt={activity.history.title} loading="lazy" />
              </button>
            </div>
          ))}

          <div className="pina-actions">
            <p className="pina-instruction">
              Cliccare su ogni quadro per scoprire pezzi di storia di Matera
            </p>
          </div>

          <button type="button" className="pina-view-switch" onClick={() => setShowGallery(true)}>
            Cambio visuale
          </button>
        </section>

        {activeArt && (
          <div
            className="art-lore-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={activeArt.history.title}
            onClick={() => setActiveArt(null)}
          >
            <div className="art-lore-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="art-lore-close"
                onClick={() => setActiveArt(null)}
                aria-label="Chiudi"
              >
                ×
              </button>
              <div className="art-lore-media">
                <img
                  src={activeArt.image}
                  alt={activeArt.history.title}
                  className={activeArt.id === 'madonna' ? 'art-lore-madonna-image' : ''}
                />
              </div>
              <div className="art-lore-body">
                <span className="art-lore-kicker">Un pezzo di storia</span>
                <h3 className="art-lore-title">{activeArt.history.title}</h3>
                <p className="art-lore-text">{activeArt.history.text}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="three-wrapper">
      <div className="cave-hud">
        <div className="cave-back" onClick={() => exploreMode ? setExploreMode(false) : setShowGallery(false)}>
          <span>←</span> {exploreMode ? 'Torna alla galleria' : 'Torna alla storia'}
        </div>
        {!exploreMode && <div className="cave-indicator">{curIdx + 1} / {N}</div>}
        {exploreMode && !isMobile && (
          <div style={{ fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:3, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>
            WASD per muoversi · trascina per ruotare
          </div>
        )}
      </div>

      {/* Bottone Esplora */}
      {!exploreMode && (
        <button onClick={() => setExploreMode(true)} style={{ position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)', zIndex:200, background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.5)', color:'#C9A84C', fontFamily:'Cinzel,serif', fontSize:11, letterSpacing:3, textTransform:'uppercase', padding:'10px 24px', borderRadius:100, cursor:'pointer', backdropFilter:'blur(8px)', transition:'all 0.3s' }}>
          🧭 Esplora i Sassi
        </button>
      )}

      {/* Joystick mobile in explore mode */}
      {exploreMode && <ExploreJoystick joystickRef={joystickRef} />}

      <div className="cave-progress">
        {ACTIVITIES.map((_, i) => (
          <div
            key={'dot-' + i}
            className={`cave-dot ${i === curIdx ? 'active' : ''} ${i < curIdx ? 'passed' : ''}`}
            onClick={() => setCurIdx(i)}
          />
        ))}
      </div>

      <div className="scroll-hint">
        <span className="scroll-arrow">↓</span>
        Scorri la galleria
      </div>

      <div className="canvas-bg">
        <Canvas camera={{ position: camStart.toArray(), near: 0.001, far: 1000 }}>
          <ambientLight intensity={3} />
          <directionalLight position={[5, 5, 5]} intensity={3} />
          <hemisphereLight args={['#ffeeb1', '#080820', 2]} />

          <Suspense fallback={<Loader />}>
            <SassiModel />

            {exploreMode ? (
              <>
                <ExploreController joystickRef={joystickRef} lookDeltaRef={lookDeltaRef} nearSpotRef={nearSpotRef} onNearSpot={setNearSpotIdx} />
                {SPOTS.map((spot, i) => (
                  <SpotMarker
                    key={'marker-' + i}
                    position={spot.pos.toArray()}
                    visible={nearSpotIdx === i}
                  />
                ))}
              </>
            ) : (
              <CameraRig curIdx={curIdx} />
            )}

            {ACTIVITIES.map((activity, i) => {
              const spot     = SPOTS[activity.spotIdx];
              const spotPos  = spot.pos.clone().add(new THREE.Vector3(0, spot.yOff, 0));
              const spotQuat = CARD_QUAT.clone()
                .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spot.rotY * DEG))
                .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), spot.tiltZ * DEG));
              const isActive = exploreMode
                ? (nearSpotIdx !== -1 && activity.spotIdx === nearSpotIdx)
                : i === curIdx;

              return (
                <group key={activity.id} position={spotPos.toArray()} quaternion={spotQuat}>
                  <Html
                    transform
                    scale={HTML_SCALE}
                    center
                    style={{
                      opacity: isActive ? 1 : 0,
                      transition: 'opacity 0.6s ease',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <div style={{ width: spot.w, height: spot.h, position: 'relative', overflow: 'hidden' }}>
                      <div className="painting-wrapper painting-active" style={{ position: 'relative', width: '100%' }}>
                        <div className="painting-frame">
                          <div className="painting-canvas" style={{ backgroundImage: `url('${activity.image}')` }}>
                            <div className="painting-texture"></div>
                            <div className="painting-content" style={{ transform: `scale(${spot.textScale})`, transformOrigin: 'bottom left' }}>
                              <div className="content-header">
                                <span className="content-emoji">{activity.emoji}</span>
                                <span className="content-category">{activity.category}</span>
                              </div>
                              <h2 className="content-title">{activity.title}</h2>
                              <p className="content-desc">{activity.description}</p>
                              <div className="content-footer">
                                <div className="content-time">
                                  <span className="time-icon">🕐</span>
                                  {activity.time}
                                </div>
                                <button className="content-btn">Scopri →</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Html>
                </group>
              );
            })}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
