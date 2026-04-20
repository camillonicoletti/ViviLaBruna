import React, { useEffect, useRef } from 'react';
import './Prova.css';

export default function Prova() {
  const containerRef = useRef(null);

  useEffect(() => {
    // ── DATA ──────────────────────────────────────────────────────────────────
    const ITEMS = [
      { title:"Tour dei Sassi al Tramonto", cat:"Cultura & Storia", price:"25€", rating:"4.9", reviews:1240, duration:"2 ore",
        img:"/hud/matera_sassi_sunset.png" },
      { title:"Volo in Mongolfiera all'Alba", cat:"Avventura", price:"180€", rating:"5.0", reviews:312, duration:"3 ore",
        img:"/hud/matera_hot_air_balloon.png" },
      { title:"Laboratorio del Pane IGP", cat:"Food & Drink", price:"45€", rating:"4.8", reviews:580, duration:"2.5 ore",
        img:"https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1400&auto=format&fit=crop" },
      { title:"Trekking Murgia Materana", cat:"Natura", price:"20€", rating:"4.7", reviews:890, duration:"4 ore",
        img:"https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1400&auto=format&fit=crop" },
      { title:"E-Bike dalla Cripta", cat:"Sport", price:"35€", rating:"4.9", reviews:420, duration:"½ Giornata",
        img:"https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1400&auto=format&fit=crop" },
      { title:"Cena Romantica in Grotta", cat:"Exclusive", price:"90€", rating:"4.9", reviews:215, duration:"Serata intera",
        img:"/hud/matera_romantic_dinner.png" },
    ];
    const N = ITEMS.length;
    let cur = 0, spinning = false;
    const selected = new Set();
    const container = containerRef.current;
    if (!container) return;

    const G = (id) => container.querySelector(`#${id}`);

    // Preload images
    ITEMS.forEach(it => { const i = new Image(); i.src = it.img; });

    // ── BUILD TRACKS ─────────────────────────────────────────────────────────────
    function buildTracks() {
      const b1 = G('band-1');
      const b2 = G('band-2');
      const b3 = G('band-3');
      if(!b1 || !b2 || !b3) return;

      const h1 = b1.offsetHeight;
      const h2 = b2.offsetHeight;
      const h3 = b3.offsetHeight;
      const t1 = G('track-1');
      const t2 = G('track-2');
      const t3 = G('track-3');
      t1.innerHTML = ''; t2.innerHTML = ''; t3.innerHTML = '';

      ITEMS.forEach((it, i) => {
        // Band 1 slide
        const s1 = document.createElement('div');
        s1.className = 'band-slide';
        s1.style.height = h1 + 'px';
        s1.innerHTML = `
          <div class="slide-img" style="background-image:url(${it.img})"></div>
          <div class="slide-cat">${it.cat}</div>
          <div class="slide-counter">${String(i+1).padStart(2,'0')}</div>
        `;
        t1.appendChild(s1);

        // Band 2 slide
        const s2 = document.createElement('div');
        s2.className = 'band-slide';
        s2.style.height = h2 + 'px';
        s2.innerHTML = `
          <div class="slide-title-bg">${it.title}</div>
          <h2 class="slide-title">${it.title}</h2>
          <div class="slide-duration">${it.duration}</div>
        `;
        t2.appendChild(s2);

        // Band 3 slide
        const s3 = document.createElement('div');
        s3.className = 'band-slide';
        s3.style.height = h3 + 'px';
        s3.innerHTML = `
          <div class="slide-price">
            <span class="price-label">A partire da</span>
            <span class="price-val">${it.price}</span>
          </div>
          <div class="b3-line"></div>
          <div class="slide-reviews">★ ${it.rating} · ${it.reviews.toLocaleString()} recensioni</div>
          <div class="slide-cta">
            <div class="add-ring" id="ring-${i}" onclick="window.hudToggleAdd(${i})">
              <span class="add-plus" style="font-size:22px;color:var(--gold-l)">+</span>
            </div>
            <div class="add-label">Aggiungi al programma</div>
          </div>
        `;
        t3.appendChild(s3);
      });

      // Build dots
      const dotsEl = G('dots');
      if(dotsEl) {
        dotsEl.innerHTML = '';
        ITEMS.forEach((_, i) => {
          const d = document.createElement('div');
          d.className = 'dot-p' + (i === 0 ? ' active' : '');
          d.id = `dot-${i}`;
          d.onclick = () => window.hudGoTo(i);
          d.style.cursor = 'none';
          dotsEl.appendChild(d);
        });
      }

      setPositions(0, false);
    }

    // ── POSITION TRACKS ───────────────────────────────────────────────────────────
    function setPositions(idx, animated = true) {
      if(!G('band-1')) return;
      const h1 = G('band-1').offsetHeight;
      const h2 = G('band-2').offsetHeight;
      const h3 = G('band-3').offsetHeight;

      const apply = (track, h, delay, dur) => {
        if(!track) return;
        track.style.transition = animated
          ? `transform ${dur}s cubic-bezier(0.77,0,0.18,1) ${delay}s`
          : 'none';
        track.style.transform = `translateY(-${idx * h}px)`;
      };

      apply(G('track-3'), h3, 0,    0.55);
      apply(G('track-2'), h2, 0.09, 0.58);
      apply(G('track-1'), h1, 0.17, 0.60);
    }

    // ── NAVIGATE ──────────────────────────────────────────────────────────────────
    window.hudGoTo = function(idx) {
      if (spinning || idx === cur || idx < 0 || idx >= N) return;
      spinning = true;
      cur = idx;

      setPositions(cur, true);

      // Flash after all bands settle (~850ms)
      setTimeout(() => {
        const flash = G('scan-flash');
        if(flash) {
          flash.classList.remove('fire');
          void flash.offsetWidth;
          flash.classList.add('fire');
        }
        spinning = false;
        updateMeta();
      }, 850);
    }

    window.hudNavigate = function(dir) { window.hudGoTo(cur + dir); }

    function updateMeta() {
      // Dots
      container.querySelectorAll('.dot-p').forEach((d,i) => d.classList.toggle('active', i === cur));
      // Update header stars
      const starContainer = G('header-stars');
      if(starContainer) {
        starContainer.innerHTML = `<span class="star">★</span>${ITEMS[cur].rating}`;
      }
      // V-fill
      if(G('v-fill')) G('v-fill').style.height = `${((cur+1)/N)*100}%`;
      // Add ring states
      ITEMS.forEach((_, i) => {
        const ring = G(`ring-${i}`);
        if (ring) ring.classList.toggle('done', selected.has(i));
      });
    }

    // ── TOGGLE ADD ────────────────────────────────────────────────────────────────
    window.hudToggleAdd = function(idx) {
      if (selected.has(idx)) {
        selected.delete(idx);
        const ring = G(`ring-${idx}`);
        if(ring) {
          ring.classList.remove('done');
          const plus = ring.querySelector('.add-plus');
          if(plus) plus.style.opacity = '1';
        }
        showToast('Rimosso dal programma');
      } else {
        const ring = G(`ring-${idx}`);
        if(ring) ring.classList.add('spinning');
        setTimeout(() => {
          if(!G(`ring-${idx}`)) return;
          const r = G(`ring-${idx}`);
          r.classList.remove('spinning');
          r.classList.add('done');
          selected.add(idx);
          if(G('badge-count')) G('badge-count').textContent = selected.size;
          showToast(`"${ITEMS[idx].title.split(' ').slice(0,3).join(' ')}…" aggiunto`);
        }, 650);
      }
      if(G('badge-count')) G('badge-count').textContent = selected.size;
    }

    // ── PARALLAX on band-2 title ──────────────────────────────────────────────────
    let curX = 0, curY = 0;
    let rAF;
    
    function mouseMoveHandler(e) {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const titles = container.querySelectorAll('.slide-title');
      const bgs = container.querySelectorAll('.slide-title-bg');
      const imgs = container.querySelectorAll('.slide-img');
      titles.forEach(t => { t.style.transform = `translateX(${mx * 8}px)`; });
      bgs.forEach(t => { t.style.transform = `translateY(-50%) translateX(${mx * -18}px)`; });
      imgs.forEach(img => { img.style.transform = `translateX(${mx * -6}px)`; });

      // cursor
      curX += (e.clientX - curX) * 0.14;
      curY += (e.clientY - curY) * 0.14;
      if(G('cur-ring')) {
        G('cur-ring').style.left = curX + 'px';
        G('cur-ring').style.top = curY + 'px';
      }
      if(G('cur')) {
        G('cur').style.left = e.clientX + 'px';
        G('cur').style.top = e.clientY + 'px';
      }
    }

    function curTick() {
      rAF = requestAnimationFrame(curTick);
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    curTick();

    // big cursor on band2
    const band2 = G('band-2');
    const mhEnter = () => G('cur') && G('cur').classList.add('big');
    const mhLeave = () => G('cur') && G('cur').classList.remove('big');
    if(band2) {
      band2.addEventListener('mouseenter', mhEnter);
      band2.addEventListener('mouseleave', mhLeave);
    }

    // ── KEYBOARD ──────────────────────────────────────────────────────────────────
    function keyDownHandler(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') window.hudNavigate(1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') window.hudNavigate(-1);
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); window.hudToggleAdd(cur); }
    }
    document.addEventListener('keydown', keyDownHandler);

    // ── SCROLL WHEEL ──────────────────────────────────────────────────────────────
    let lastWheelTime = 0;
    
    function wheelHandler(e) {
      const isScrollToFooter = (cur === N - 1 && e.deltaY > 0);
      const isScrollFromFooter = (window.scrollY > 5 && e.deltaY < 0);
      let now = Date.now();
      let delta = e.deltaY;

      // Se sei all'ultima attività e vuoi scendere, permettiamo il native scroll 
      // solo se l'animazione è ferma o c'è un colpo deciso per "sfondare" il footer.
      if (isScrollToFooter && !spinning && (now - lastWheelTime > 100 || Math.abs(delta) > 30)) {
        return;
      }

      // Risalita dal footer
      if (isScrollFromFooter) {
        lastWheelTime = now;
        return;
      }

      e.preventDefault(); // blocca lo scroll nell'HUD

      // Se l'animazione 3D è in corso (dura circa 1s), tracciamo l'arrivo 
      // del segnale ma lo ignoriamo per evitare accavallamenti grafici.
      if (spinning) {
        lastWheelTime = now;
        return;
      }

      // Se siamo fuori dall'animazione, controlliamo se questo scroll è un rimasuglio 
      // di inerzia o un colpo nuovo. (Inerzia = eventi arrivano < 100ms di distanza 
      // ed hanno una potenza debole giunta a fine corsa).
      if (now - lastWheelTime < 100) {
        lastWheelTime = now;
        // Se il tocco è deciso (> 30), è uno scorrimento volontario veloce! Lasciapassare.
        if (Math.abs(delta) < 30) return; 
      } else {
        lastWheelTime = now;
      }
      
      const dir = delta > 0 ? 1 : -1;
      
      // limit navigation bounds
      if (cur + dir >= N || cur + dir < 0) return;
      
      window.hudNavigate(dir);
    }
    container.addEventListener('wheel', wheelHandler, { passive: false });

    // ── SWIPE ─────────────────────────────────────────────────────────────────────
    let ty0 = 0;
    function tStart(e) { ty0 = e.touches[0].clientY; }
    function tEnd(e) {
      const dy = e.changedTouches[0].clientY - ty0;
      if (Math.abs(dy) > 50) window.hudNavigate(dy < 0 ? 1 : -1);
    }
    container.addEventListener('touchstart', tStart);
    container.addEventListener('touchend', tEnd);

    // ── TOAST ─────────────────────────────────────────────────────────────────────
    let toastTimer;
    window.hudShowToast = function showToast(msg) {
      const t = G('toast');
      if(!t) return;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    }

    // ── INIT ──────────────────────────────────────────────────────────────────────
    buildTracks();
    if(G('v-fill')) G('v-fill').style.height = `${(1/N)*100}%`;
    window.addEventListener('resize', buildTracks);

    // ── CLEANUP ───────────────────────────────────────────────────────────────────
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('resize', buildTracks);
      container.removeEventListener('wheel', wheelHandler);
      container.removeEventListener('touchstart', tStart);
      container.removeEventListener('touchend', tEnd);
      if(band2) {
        band2.removeEventListener('mouseenter', mhEnter);
        band2.removeEventListener('mouseleave', mhLeave);
      }
      cancelAnimationFrame(rAF);
      clearTimeout(toastTimer);
      delete window.hudGoTo;
      delete window.hudNavigate;
      delete window.hudToggleAdd;
      delete window.hudShowToast;
    };
  }, []);

  return (
    <div className="prova-wrapper" ref={containerRef}>
      <div id="cur"></div>
      <div id="cur-ring"></div>
      <div id="scan-flash"></div>
      <div className="noise"></div>
      <div id="toast"></div>

      {/* Header */}
      <header className="header-hud">
        <div className="hud-rating-box">
          <div className="hud-stars" id="header-stars">★ 4.9</div>
          <div className="hud-reviews-btn" onClick={() => window.hudShowToast('Apertura recensioni...')}>Vedi Recensioni</div>
        </div>
        <div className="header-right">
          <div className="itinerary-btn" onClick={() => window.hudShowToast('Programma aggiornato')}>
            Il mio programma <span id="badge-count">0</span>
          </div>
        </div>
      </header>

      {/* Left vertical indicator */}
      <div className="v-indicator">
        <div className="v-label">Scorri</div>
        <div className="v-track"><div className="v-fill" id="v-fill"></div></div>
      </div>

      {/* 3 BANDS */}
      <div className="slots">
        {/* Band 1: IMAGE */}
        <div className="band" id="band-1">
          <div className="band-track" id="track-1"></div>
          <div className="band1-grad-top"></div>
          <div className="band1-grad"></div>
        </div>
        {/* Band 2: TITLE */}
        <div className="band" id="band-2">
          <div className="band-track" id="track-2"></div>
        </div>
        {/* Band 3: META */}
        <div className="band" id="band-3">
          <div className="band-track" id="track-3"></div>
        </div>
      </div>

      {/* Bottom nav hints */}
      <div className="nav-hint">
        <div className="hint-key"><div className="key-box">↑</div><div className="key-box">↓</div> navigare</div>
        <div className="dot-progress" id="dots"></div>
        <div className="hint-key"><div className="key-box">Space</div> aggiungi</div>
      </div>
    </div>
  );
}
