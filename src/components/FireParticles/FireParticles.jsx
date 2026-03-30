import { useEffect, useRef } from 'react';

const COLORS = [
  '#FFD700', // oro puro
  '#FFA500', // arancio brace
  '#FF8C00', // arancio scuro
  '#FFEC8B', // giallo chiaro scintilla
  '#FFF0A0', // bianco-oro
  '#FF6B00', // rosso-arancio
];

function createParticle(canvasWidth, canvasHeight) {
  // Nasce in basso, in una zona centrale-casuale
  const spread = canvasWidth * 0.6;
  const x = canvasWidth / 2 + (Math.random() - 0.5) * spread;
  return {
    x,
    y: canvasHeight + Math.random() * 20,
    vx: (Math.random() - 0.5) * 0.8,          // drift laterale leggero
    vy: 0.6 + Math.random() * 1.4,             // velocità di salita
    size: 1.5 + Math.random() * 2.5,           // dimensione iniziale
    opacity: 0.7 + Math.random() * 0.3,        // opacità iniziale
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    decay: 0.005 + Math.random() * 0.008,      // velocità di scomparsa
  };
}

export default function FireParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Adatta il canvas alla finestra
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Popola inizialmente con alcune particelle già in volo
    const PARTICLE_COUNT = 120;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
      const p = createParticle(canvas.width, canvas.height);
      // Distribuite a diverse altezze iniziali
      p.y = canvas.height * Math.random();
      p.opacity = Math.random() * 0.6;
      return p;
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Genera nuove particelle per mantenere il flusso
      if (particlesRef.current.length < PARTICLE_COUNT) {
        particlesRef.current.push(createParticle(canvas.width, canvas.height));
      }

      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0);

      for (const p of particlesRef.current) {
        // Movimento
        p.x += p.vx + Math.sin(p.y * 0.03) * 0.3;  // ondeggiamento naturale
        p.y -= p.vy;
        p.opacity -= p.decay;
        p.size *= 0.995;

        // Disegno con glow dorato
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
