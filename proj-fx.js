/* ==========================================================================
   proj-fx.js — démos interactives propres à chaque page projet.
   Chaque fonction ne s'active que si son élément existe dans la page.
   ========================================================================== */
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = (v, fallback) => getComputedStyle(document.body).getPropertyValue(v).trim() || fallback;

document.addEventListener('DOMContentLoaded', () => {
  initRadar();
  initGesture();
  initInvaders();
  initEnergy();
  initCrossword();
  initLayerToggles();
  initModules();
  initSmoke();
});

/* Évite de consommer du CPU quand l'élément est hors écran */
function whenVisible(el, onChange) {
  if (!('IntersectionObserver' in window)) { onChange(true); return; }
  new IntersectionObserver((e) => onChange(e[0].isIntersecting), { threshold: 0.1 }).observe(el);
}

/* ---------- 004 · Radar à balayage ---------- */
function initRadar() {
  const c = document.getElementById('radar-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = (c.width = 900), H = (c.height = 490);
  const cx = W / 2, cy = H - 22, R = 410;
  const accent = css('--accent', '#4ade80');
  const readout = document.getElementById('radar-readout');
  const targets = [
    { a: 32, d: 0.58, ph: 0 }, { a: 76, d: 0.82, ph: 1.7 },
    { a: 112, d: 0.42, ph: 3.1 }, { a: 151, d: 0.7, ph: 4.4 },
  ].map((t) => ({ ...t, life: 0 }));
  let angle = 0, dir = 1, last = performance.now(), running = true, t0 = last;

  const pos = (a, d) => [cx + Math.cos((a * Math.PI) / 180) * d * R, cy - Math.sin((a * Math.PI) / 180) * d * R];

  function frame(now) {
    const dt = Math.min(now - last, 50) / 1000; last = now;
    if (running) {
      angle += dir * 62 * dt;
      if (angle >= 180) { angle = 180; dir = -1; } else if (angle <= 0) { angle = 0; dir = 1; }
    }
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(74,222,128,.22)'; ctx.lineWidth = 1;
    [1 / 3, 2 / 3, 1].forEach((k, i) => {
      ctx.beginPath(); ctx.arc(cx, cy, R * k, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(74,222,128,.55)'; ctx.font = '12px monospace';
      ctx.fillText(['50 cm', '100 cm', '150 cm'][i], cx + R * k - 46, cy - 6);
    });
    for (let a = 0; a <= 180; a += 30) {
      const [x, y] = pos(a, 1);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

    for (let i = 0; i < 42; i++) {                          // traînée du balayage
      const a = angle - dir * i * 0.9;
      if (a < 0 || a > 180) continue;
      const [x, y] = pos(a, 1);
      ctx.strokeStyle = `rgba(74,222,128,${(0.55 * (1 - i / 42)).toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    }

    let nearest = null;
    targets.forEach((tg) => {
      const d = tg.d + Math.sin(t * 0.6 + tg.ph) * 0.03;
      if (Math.abs(angle - tg.a) < 2.2) tg.life = 1;
      tg.life = Math.max(0, tg.life - dt * 0.45);
      if (tg.life > 0.02) {
        const [x, y] = pos(tg.a, d);
        ctx.fillStyle = `rgba(248,113,113,${tg.life.toFixed(2)})`;
        ctx.shadowColor = '#f87171'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        if (!nearest || d < nearest) nearest = d;
      }
    });
    if (readout) {
      readout.innerHTML = `ANGLE <b>${String(Math.round(angle)).padStart(3, '0')}°</b> · ÉCHOS <b>${targets.filter((x) => x.life > 0.05).length}</b> · PLUS PROCHE <b>${nearest ? Math.round(nearest * 150) + ' cm' : '—'}</b>`;
    }
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
    if (!REDUCE) requestAnimationFrame(frame);
  }
  if (REDUCE) { angle = 100; targets.forEach((t) => (t.life = 0.8)); frame(performance.now()); return; }
  whenVisible(c, (v) => { running = v; });
  requestAnimationFrame(frame);
}

/* ---------- 003 · Pilotage gestuel ---------- */
function initGesture() {
  const pad = document.getElementById('gesture-pad');
  const arena = document.getElementById('car-arena');
  const car = document.getElementById('car');
  const out = document.getElementById('gesture-readout');
  if (!pad || !arena || !car) return;
  let pitch = 0, roll = 0;
  let x = 0.5, y = 0.5, heading = -90, last = performance.now();
  const DEAD = 8;

  function setFromPointer(e) {
    const r = pad.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    roll = nx * 40; pitch = -ny * 40;
    pad.style.setProperty('--roll', roll.toFixed(1) + 'deg');
    pad.style.setProperty('--pitch', pitch.toFixed(1) + 'deg');
  }
  function reset() {
    pitch = roll = 0;
    pad.style.setProperty('--roll', '0deg'); pad.style.setProperty('--pitch', '0deg');
  }
  pad.addEventListener('pointermove', setFromPointer);
  pad.addEventListener('pointerdown', setFromPointer);
  pad.addEventListener('pointerleave', reset);

  function loop(now) {
    const dt = Math.min(now - last, 50) / 1000; last = now;
    const p = Math.abs(pitch) < DEAD ? 0 : pitch;     // zone morte (deadzone)
    const r = Math.abs(roll) < DEAD ? 0 : roll;
    const speed = p * 0.011;                          // fraction de l'arène par seconde
    heading += r * 2.2 * dt * (p >= 0 ? 1 : -1);
    x += Math.cos((heading * Math.PI) / 180) * speed * dt * (arena.clientHeight / arena.clientWidth);
    y += Math.sin((heading * Math.PI) / 180) * speed * dt;
    x = Math.max(0.04, Math.min(0.96, x)); y = Math.max(0.06, Math.min(0.94, y));
    car.style.left = x * 100 + '%'; car.style.top = y * 100 + '%';
    car.style.transform = `rotate(${heading + 90}deg)`;
    if (out) {
      const cmd = p === 0 && r === 0 ? 'ARRÊT (zone morte)' : `${p > 0 ? 'AVANT' : p < 0 ? 'ARRIÈRE' : ''} ${r > 0 ? 'DROITE' : r < 0 ? 'GAUCHE' : ''}`.trim();
      out.innerHTML = `PITCH <b>${pitch >= 0 ? '+' : ''}${pitch.toFixed(0)}°</b> · ROLL <b>${roll >= 0 ? '+' : ''}${roll.toFixed(0)}°</b> → <b>${cmd}</b>`;
    }
    requestAnimationFrame(loop);
  }
  car.style.left = '50%'; car.style.top = '50%';
  requestAnimationFrame(loop);
}

/* ---------- 005 · Mini Space Invaders jouable ---------- */
function initInvaders() {
  const c = document.getElementById('invaders-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = (c.width = 520), H = (c.height = 320);
  const accent = css('--accent', '#e879f9');
  const SPR = ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'];
  const keys = { left: false, right: false, fire: false };
  let state = 'idle', ship, bullets, inv, dir, speed, score, cool, last = performance.now(), visible = true;

  function reset() {
    ship = { x: W / 2 - 14, y: H - 30, w: 28, h: 12 };
    bullets = []; inv = []; dir = 1; speed = 24; score = 0; cool = 0;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) inv.push({ x: 50 + k * 44, y: 34 + r * 30, alive: true });
    state = 'play';
  }
  function drawInv(x, y, col) {
    ctx.fillStyle = col;
    SPR.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') ctx.fillRect(x + i * 2.4, y + j * 2.4, 2.4, 2.4); }));
  }
  function text(t, y, size, col) {
    ctx.fillStyle = col; ctx.font = `bold ${size}px monospace`; ctx.textAlign = 'center'; ctx.fillText(t, W / 2, y);
  }
  function frame(now) {
    const dt = Math.min(now - last, 50) / 1000; last = now;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (state === 'play' && visible) {
      ship.x += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 260 * dt;
      ship.x = Math.max(6, Math.min(W - ship.w - 6, ship.x));
      cool -= dt;
      if (keys.fire && cool <= 0) { bullets.push({ x: ship.x + ship.w / 2, y: ship.y }); cool = 0.35; }
      bullets.forEach((b) => (b.y -= 300 * dt));
      bullets = bullets.filter((b) => b.y > -10);
      const alive = inv.filter((i) => i.alive);
      const edge = alive.some((i) => (dir > 0 && i.x + 26 > W - 8) || (dir < 0 && i.x < 8));
      if (edge) { dir *= -1; alive.forEach((i) => (i.y += 14)); speed += 5; }
      alive.forEach((i) => (i.x += dir * speed * dt));
      bullets.forEach((b) => alive.forEach((i) => {
        if (i.alive && b.x > i.x && b.x < i.x + 26 && b.y > i.y && b.y < i.y + 19) { i.alive = false; b.y = -99; score += 10; }
      }));
      if (!alive.some((i) => i.alive)) state = 'win';
      if (alive.some((i) => i.alive && i.y + 19 >= ship.y)) state = 'over';
    }
    if (state !== 'idle') {
      inv.forEach((i) => i.alive && drawInv(i.x, i.y, accent));
      ctx.fillStyle = '#fff'; bullets.forEach((b) => ctx.fillRect(b.x - 1, b.y, 2, 9));
      ctx.fillStyle = '#4ade80'; ctx.fillRect(ship.x, ship.y, ship.w, ship.h); ctx.fillRect(ship.x + 11, ship.y - 6, 6, 6);
      ctx.textAlign = 'left'; ctx.fillStyle = accent; ctx.font = 'bold 13px monospace'; ctx.fillText('SCORE ' + String(score).padStart(5, '0'), 10, 18);
    }
    if (state === 'idle') { text('SPACE INVADERS', 130, 26, accent); text('[ CLIQUE POUR JOUER ]', 175, 15, '#f5a623'); text('← →  déplacer · ESPACE  tirer', 215, 12, '#a9c2b4'); }
    if (state === 'win') { text('GRILLE NETTOYÉE !', 150, 24, '#4ade80'); text('clique pour rejouer', 185, 13, '#a9c2b4'); }
    if (state === 'over') { text('GAME OVER', 150, 26, '#f87171'); text('clique pour rejouer', 185, 13, '#a9c2b4'); }
    requestAnimationFrame(frame);
  }
  c.tabIndex = 0;
  c.addEventListener('click', () => { c.focus(); if (state !== 'play') reset(); });
  const map = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ' ': 'fire' };
  c.addEventListener('keydown', (e) => { const k = map[e.key]; if (k) { keys[k] = true; e.preventDefault(); } });
  c.addEventListener('keyup', (e) => { const k = map[e.key]; if (k) keys[k] = false; });
  c.addEventListener('blur', () => { keys.left = keys.right = keys.fire = false; });
  document.querySelectorAll('[data-pad]').forEach((b) => {
    const k = b.dataset.pad;
    ['pointerdown'].forEach((ev) => b.addEventListener(ev, (e) => { e.preventDefault(); keys[k] = true; if (state !== 'play') reset(); }));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => (keys[k] = false)));
  });
  whenVisible(c, (v) => { visible = v; });
  requestAnimationFrame(frame);
}

/* ---------- 006 · Bascule solaire / secteur ---------- */
function initEnergy() {
  const box = document.getElementById('energy');
  if (!box) return;
  const status = document.getElementById('energy-status');
  const btns = document.querySelectorAll('[data-source-btn]');
  let timer = null;

  function set(src) {
    box.dataset.source = src;
    btns.forEach((b) => b.classList.toggle('on', b.dataset.sourceBtn === src));
    if (status) status.innerHTML = src === 'solar'
      ? 'SOURCE <b>SOLAIRE</b> · relais réseau <b>OFF</b> · séchage <b>continu ✔</b>'
      : 'SOURCE <b>RÉSEAU</b> · bascule automatique <b>ON</b> · séchage <b>continu ✔</b>';
  }
  btns.forEach((b) => b.addEventListener('click', () => { clearInterval(timer); set(b.dataset.sourceBtn); }));
  set('solar');
  if (!REDUCE) timer = setInterval(() => set(box.dataset.source === 'solar' ? 'grid' : 'solar'), 5000);
}

/* ---------- 007 · Backtracking du générateur de mots croisés ---------- */
function initCrossword() {
  const gridEl = document.getElementById('xw-grid');
  const logEl = document.getElementById('xw-log');
  if (!gridEl || !logEl) return;
  const ROWS = 5, COLS = 8;
  gridEl.innerHTML = '';
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
    const d = document.createElement('div'); d.className = 'xw-cell'; gridEl.appendChild(d); cells.push(d);
  }
  const at = (r, k) => cells[r * COLS + k];
  const steps = [
    { w: 'CAPTEUR', r: 1, c: 0, v: false }, { w: 'SERIE', r: 0, c: 4, v: true },
    { w: 'PIXEL', r: 3, c: 3, v: false }, { w: 'CODE', r: 1, c: 0, v: true },
    { w: 'RADIO', r: 1, c: 6, v: true }, { w: 'REEL', r: 1, c: 6, v: true },
  ];
  const sleep = (ms) => new Promise((res) => setTimeout(res, REDUCE ? 0 : ms));
  const log = (html) => { logEl.insertAdjacentHTML('beforeend', html + '<br>'); logEl.scrollTop = logEl.scrollHeight; };
  let token = 0;

  async function run() {
    const me = ++token;
    gridEl.querySelectorAll('.xw-cell').forEach((d) => { d.className = 'xw-cell'; d.textContent = ''; });
    logEl.innerHTML = '';
    const board = {};
    for (const s of steps) {
      if (me !== token) return;
      log(`<span class="fn">placer</span>("${s.w}", ${s.v ? 'V' : 'H'}, ${s.r}, ${s.c})`);
      let conflict = null; const temp = [];
      for (let i = 0; i < s.w.length; i++) {
        const r = s.r + (s.v ? i : 0), k = s.c + (s.v ? 0 : i), key = r + ',' + k, ch = s.w[i];
        const el = at(r, k);
        if (board[key] && board[key] !== ch) { conflict = { r, k, have: board[key], want: ch }; el.classList.add('bad'); el.textContent = ch; break; }
        if (!board[key]) { el.classList.add('try'); el.textContent = ch; temp.push({ key, el, ch }); }
        await sleep(110);
        if (me !== token) return;
      }
      if (me !== token) return;
      if (conflict) {
        log(`<span class="ko">✘ collision en (${conflict.r},${conflict.k}) : '${conflict.want}' ≠ '${conflict.have}' → backtrack</span>`);
        await sleep(650);
        temp.forEach((t) => { t.el.className = 'xw-cell'; t.el.textContent = ''; });
        at(conflict.r, conflict.k).className = 'xw-cell on';
        at(conflict.r, conflict.k).textContent = conflict.have;
        await sleep(300);
      } else {
        temp.forEach((t) => { t.el.className = 'xw-cell on'; board[t.key] = t.ch; });
        for (let i = 0; i < s.w.length; i++) { board[(s.r + (s.v ? i : 0)) + ',' + (s.c + (s.v ? 0 : i))] = s.w[i]; at(s.r + (s.v ? i : 0), s.c + (s.v ? 0 : i)).classList.add('on'); }
        log('<span class="ok">✔ placé</span>');
        await sleep(350);
      }
    }
    log('<span class="ok">✔ grille cohérente — 5 mots, 0 collision</span>');
    if (!REDUCE) { await sleep(4200); if (me === token) run(); }
  }
  const btn = document.getElementById('xw-replay');
  if (btn) btn.addEventListener('click', run);
  whenVisible(gridEl, (v) => { if (v && !gridEl.dataset.started) { gridEl.dataset.started = '1'; run(); } });
}

/* ---------- 008 · Couches du PCB ---------- */
function initLayerToggles() {
  document.querySelectorAll('[data-toggle-layer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.toggleLayer;
      const target = document.querySelector(`[data-layer="${name}"]`);
      if (!target) return;
      const off = target.classList.toggle('layer-off');
      btn.classList.toggle('on', !off);
    });
  });
}

/* ---------- 009 · Barrière optique + tonalité 800 Hz ---------- */
function initSmoke() {
  const beam = document.getElementById('beam');
  const btn = document.getElementById('smoke-btn');
  const tone = document.getElementById('tone-btn');
  if (!beam || !btn) return;
  const L = (id) => document.getElementById(id);
  const fill = L('timer-fill'), tval = L('timer-val');
  let busy = false;

  const lit = (id, on) => L(id) && L(id).classList.toggle('lit', on);
  function reset() {
    beam.classList.remove('active');
    ['led-schmitt', 'led-mono', 'led-astable', 'led-siren'].forEach((i) => lit(i, false));
    if (fill) fill.style.width = '0'; if (tval) tval.textContent = '0,0 s';
    busy = false; btn.disabled = false;
  }
  btn.addEventListener('click', () => {
    if (busy) return; busy = true; btn.disabled = true;
    beam.classList.add('active');
    setTimeout(() => lit('led-schmitt', true), 350);
    setTimeout(() => { lit('led-mono', true); lit('led-astable', true); lit('led-siren', true); }, 700);
    const start = performance.now() + 700;
    (function tick(now) {
      const e = Math.max(0, Math.min(1, (now - start) / 1000));
      if (fill) fill.style.width = e * 100 + '%';
      if (tval) tval.textContent = (e).toFixed(1).replace('.', ',') + ' s';
      if (e < 1) requestAnimationFrame(tick); else setTimeout(reset, 500);
    })(performance.now());
  });

  if (tone) {
    let ac = null, osc = null, gain = null;
    tone.addEventListener('click', () => {
      if (osc) { gain.gain.setTargetAtTime(0, ac.currentTime, 0.03); const o = osc; setTimeout(() => o.stop(), 120); osc = null; tone.classList.remove('on'); tone.textContent = '🔊 Écouter la tonalité 800 Hz'; return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = ac || new AC();
      osc = ac.createOscillator(); gain = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = 800; gain.gain.value = 0.0001;
      osc.connect(gain).connect(ac.destination); osc.start();
      gain.gain.setTargetAtTime(0.06, ac.currentTime, 0.03);
      tone.classList.add('on'); tone.textContent = '⏹ Arrêter la tonalité';
    });
  }
}

/* ---------- 008 · Architecture modulaire : sélection d'une carte ---------- */
function initModules() {
  const triggers = document.querySelectorAll('[data-module-btn]');
  const panels = document.querySelectorAll('[data-module]');
  if (!triggers.length || !panels.length) return;
  function show(key) {
    panels.forEach((p) => p.classList.toggle('active', p.dataset.module === key));
    triggers.forEach((t) => {
      const on = t.dataset.moduleBtn === key;
      t.classList.toggle(t.tagName === 'BUTTON' ? 'on' : 'active', on);
    });
  }
  triggers.forEach((t) => {
    t.addEventListener('click', () => show(t.dataset.moduleBtn));
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(t.dataset.moduleBtn); } });
  });
  show(panels[0].dataset.module);
}
