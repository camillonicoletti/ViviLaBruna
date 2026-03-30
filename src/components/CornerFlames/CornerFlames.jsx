import { useEffect, useRef } from 'react';

/* ----------------------------------------------------------------
   Fiamma "vera" agli angoli della pergamena.
   Tecnica: canvas con algoritmo cellular automata 1D (classico fire
   effect di Axel-Tobias Schreiner / demo#9), proiettato ai 4 angoli.
   È il metodo più simile a una vera fiamma senza usare video.
---------------------------------------------------------------- */

const W = 80;   // larghezza "tile" fuoco per angolo
const H = 80;   // altezza

function createFireBuffer() {
  return new Uint8Array(W * H);
}

// Palette: 256 step dal nero all'arancio dorato al bianco
function buildPalette() {
  const p = [];
  for (let i = 0; i < 256; i++) {
    let r, g, b;
    if (i < 85) {
      r = Math.round((i / 85) * 180);
      g = 0;
      b = 0;
    } else if (i < 170) {
      const t = (i - 85) / 85;
      r = 180 + Math.round(t * 75);
      g = Math.round(t * 120);
      b = 0;
    } else {
      const t = (i - 170) / 85;
      r = 255;
      g = 120 + Math.round(t * 135);
      b = Math.round(t * 80);
    }
    p.push([r, g, b]);
  }
  return p;
}

const PALETTE = buildPalette();

// Corner definitions: [canvasX offset, canvasY offset, flipX, flipY]
function getCornerTransform(corner, cw, ch) {
  switch (corner) {
    case 'tl': return { dx: 0,      dy: 0,       scaleX:  1, scaleY:  1 };
    case 'tr': return { dx: cw - W, dy: 0,       scaleX: -1, scaleY:  1 };
    case 'bl': return { dx: 0,      dy: ch - H,  scaleX:  1, scaleY: -1 };
    case 'br': return { dx: cw - W, dy: ch - H,  scaleX: -1, scaleY: -1 };
    default:   return { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
  }
}

export default function CornerFlames({ active }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Il canvas copre l'intera pergamena
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    // Un buffer fire per ogni angolo
    const corners = ['tl', 'tr', 'bl', 'br'];
    const buffers = Object.fromEntries(corners.map(c => [c, createFireBuffer()]));

    // ImageData temporaneo per disegnare ogni angolo-tile
    const imgData = ctx.createImageData(W, H);

    function spreadFire(buf) {
      // Mantieni la riga "sorgente" sempre calda
      for (let x = 0; x < W; x++) {
        buf[(H - 1) * W + x] = 180 + Math.floor(Math.random() * 75); // 180-255
      }

      // Propaga verso l'alto con diffusione laterale
      for (let y = 0; y < H - 1; y++) {
        for (let x = 0; x < W; x++) {
          const below = buf[(y + 1) * W + x];
          const decay  = Math.floor(Math.random() * 3);         // 0-2
          const drift  = Math.floor(Math.random() * 3) - 1;    // -1, 0, +1
          const nx = (x + drift + W) % W;
          const newVal = Math.max(0, below - decay);
          buf[y * W + nx] = newVal;
        }
      }
    }

    function drawCorner(corner) {
      const buf = buffers[corner];
      const { dx, dy, scaleX, scaleY } = getCornerTransform(corner, cw, ch);

      // Pixel → imgData
      for (let i = 0; i < W * H; i++) {
        const v   = buf[i];
        const [r, g, b] = PALETTE[v];
        const base = i * 4;
        imgData.data[base]     = r;
        imgData.data[base + 1] = g;
        imgData.data[base + 2] = b;
        imgData.data[base + 3] = v; // alpha = intensità fuoco
      }

      // Disegna con potenziale flip
      ctx.save();
      ctx.translate(dx + (scaleX === -1 ? W : 0), dy + (scaleY === -1 ? H : 0));
      ctx.scale(scaleX, scaleY);
      ctx.putImageData(imgData, 0, 0);
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, cw, ch);
      corners.forEach(c => {
        spreadFire(buffers[c]);
        drawCorner(c);
      });
      rafRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        borderRadius: '4px',
        mixBlendMode: 'screen', // si fonde perfettamente con la pergamena chiara
      }}
    />
  );
}
