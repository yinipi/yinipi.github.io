document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialisation des fonctions de base
  initMobileMenu();
  initBackToTop();
  initScrollspy();
  initScrollReveal();
  initContactForm();
  initPhotoUpload();
  
  // 2. Initialisation des animations d'interface
  initCardTilt();
  initTerminalTyping(); 
  initMagneticButtons();

  // 3. Initialisation des Widgets
  initProgressBar();
  initSystemWidget();

  // 4. Initialisation des Easter Eggs (Spécialités Hardware/Cyber)
  initHexDecrypt();
  initPcbRouter();
  initWatchdog();
});

// =========================================
// WIDGETS & MOUVEMENTS
// =========================================

// ---------- Barre de progression de lecture ----------
function initProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = percent + '%';
  }, { passive: true });
}

// ---------- Widget Système Flottant (Temps réel) ----------
function initSystemWidget() {
  const widget = document.createElement('div');
  widget.className = 'sys-widget';
  
  const statusLine = document.createElement('div');
  statusLine.innerHTML = `STATUS: <span class="val">ONLINE</span> <span class="signal-bars"><span></span><span></span><span></span><span></span></span>`;
  
  const uptimeLine = document.createElement('div');
  
  widget.appendChild(statusLine);
  widget.appendChild(uptimeLine);
  document.body.appendChild(widget);

  const startTime = Date.now();
  setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    uptimeLine.innerHTML = `UPTIME: <span class="val">00:${m}:${s}</span>`;
  }, 1000);
}

// ---------- Boutons Magnétiques (Mouvement fluide au survol) ----------
function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const magnets = document.querySelectorAll('.btn, .navcta');
  
  magnets.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = `translate(0px, 0px)`;
    });
  });
}

// ---------- Effet "Machine à écrire" pour le Terminal ----------
function initTerminalTyping() {
  const termBody = document.querySelector('.hero-terminal .term-body');
  if (!termBody) return;
  
  const lines = Array.from(termBody.children);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lines.forEach((line) => { line.style.display = 'block'; line.style.opacity = '1'; });
    return;
  }

  lines.forEach(line => line.style.display = 'none'); 
  
  let delay = 600; 
  
  lines.forEach((line) => {
    setTimeout(() => {
      line.style.display = 'block';
      line.style.opacity = '0';
      line.animate(
        [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], 
        { duration: 250, fill: 'forwards' }
      );
    }, delay);
    
    delay += line.textContent.includes('[OK]') ? 200 : 900;
  });
}

// ---------- Effet tilt sur les cartes projet ----------
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return; 

  const cards = document.querySelectorAll('a.ic-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---------- Apparition au scroll (Cascade intelligente) ----------
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll('section, .proj-header, .proj-body, .contact-box, .ic-card, .skill-block, .tl-item');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    let delayCounter = 0; 
    
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, delayCounter * 120); 
        
        delayCounter++;
        observer.unobserve(entry.target);
      }
    });
    
    setTimeout(() => { delayCounter = 0; }, 100);
    
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  targets.forEach((t) => {
    t.classList.add('reveal');
    observer.observe(t);
  });
}

// =========================================
// FONCTIONNALITÉS DE BASE
// =========================================

// ---------- Photo de profil (upload local) ----------
function initPhotoUpload() {
  const input = document.getElementById('photo-input');
  const preview = document.getElementById('photo-preview');
  const placeholder = document.getElementById('photo-placeholder');
  const removeBtn = document.getElementById('photo-remove');
  if (!input || !preview) return;

  const STORAGE_KEY = 'portfolio_photo_data_url';

  function showPhoto(dataUrl) {
    preview.src = dataUrl;
    preview.style.display = 'block';
    if(placeholder) placeholder.style.display = 'none';
    if(removeBtn) removeBtn.style.display = 'inline';
  }

  function clearPhoto() {
    preview.src = '';
    preview.style.display = 'none';
    if(placeholder) placeholder.style.display = 'block';
    if(removeBtn) removeBtn.style.display = 'none';
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) showPhoto(saved);
  } catch (err) {}

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      showPhoto(dataUrl);
      try { localStorage.setItem(STORAGE_KEY, dataUrl); } catch (err) {}
    };
    reader.readAsDataURL(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      clearPhoto();
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
      input.value = '';
    });
  }
}

// ---------- Menu mobile ----------
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const panel = document.querySelector('.mobile-menu');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  panel.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------- Bouton retour en haut ----------
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 480);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------- Scrollspy (lien de nav actif) ----------
function initScrollspy() {
  const allLinks = document.querySelectorAll('nav.links a[href*="#"], .mobile-menu a[href*="#"]');
  if (!allLinks.length) return;

  const bySection = {};
  allLinks.forEach((a) => {
    const id = a.getAttribute('href').split('#')[1];
    const el = id ? document.getElementById(id) : null;
    if (el) {
      bySection[id] = bySection[id] || [];
      bySection[id].push(a);
    }
  });

  const sectionIds = Object.keys(bySection);
  if (!sectionIds.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        allLinks.forEach((l) => l.classList.remove('active'));
        (bySection[entry.target.id] || []).forEach((l) => l.classList.add('active'));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  sectionIds.forEach((id) => observer.observe(document.getElementById(id)));
}

// ---------- Formulaire de contact en AJAX ----------
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    form.appendChild(status);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.action.includes('VOTRE_ID_FORMSPREE')) {
      status.textContent = "Le formulaire n'est pas encore connecté — remplace VOTRE_ID_FORMSPREE.";
      status.className = 'form-status error';
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';
    status.textContent = '';
    status.className = 'form-status';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        status.textContent = 'Message envoyé — merci, je reviens vers toi rapidement !';
        status.className = 'form-status success';
        form.reset();
      } else {
        status.textContent = 'Une erreur est survenue.';
        status.className = 'form-status error';
      }
    } catch (err) {
      status.textContent = 'Erreur réseau.';
      status.className = 'form-status error';
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}


// =========================================
// EASTER EGGS & EFFETS SPECIAUX
// =========================================

// ---------- 1. Effet Reverse Engineering (Décryptage Hex/ASCII) ----------
function initHexDecrypt() {
  const titles = document.querySelectorAll('h2.sec-title');
  if (!titles.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const chars = "0123456789ABCDEF!@#$%^&*";
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.decrypted) {
        entry.target.dataset.decrypted = "true"; // Empêche de relancer l'animation
        
        const el = entry.target;
        const originalText = el.innerText;
        let iteration = 0;
        
        const interval = setInterval(() => {
          el.innerText = originalText.split('').map((letter, index) => {
            if (index < iteration) {
              return originalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
          
          if (iteration >= originalText.length) {
            clearInterval(interval);
          }
          iteration += 1 / 3; // Vitesse de décryptage
        }, 30);
      }
    });
  }, { threshold: 0.5, rootMargin: '0px 0px -50px 0px' });

  titles.forEach(t => observer.observe(t));
}

// ---------- 2. Auto-Routeur PCB Dynamique (Canvas) ----------
function initPcbRouter() {
  const canvas = document.getElementById('pcb-canvas');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const traces = [];
  const maxTraces = 6; // Nombre de pistes simultanées
  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  class Trace {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() < 0.5 ? (Math.random() < 0.5 ? 0 : width) : Math.random() * width;
      this.y = this.x === 0 || this.x === width ? Math.random() * height : (Math.random() < 0.5 ? 0 : height);
      this.history = [{x: this.x, y: this.y}];
      this.length = 0;
      this.maxLength = Math.random() * 200 + 100;
      this.speed = 4;
      this.direction = Math.floor(Math.random() * 8); // 8 directions (0, 45, 90... degrés)
      this.dead = false;
      this.viaSize = 0;
      
      // Récupère la couleur dynamique selon le thème
      const colorRaw = getComputedStyle(document.body).getPropertyValue('--copper-bright').trim() || '#e0b872';
      this.color = colorRaw;
    }

    update() {
      if (this.dead) return;

      // Choix de la direction (angles de 45° pour simuler KiCad/Altium)
      if (Math.random() < 0.05) {
        // Tendance à aller vers la souris
        const angleToMouse = Math.atan2(mouseY - this.y, mouseX - this.x);
        let dir = Math.round((angleToMouse * 4) / Math.PI);
        if (dir < 0) dir += 8;
        this.direction = dir;
      } else if (Math.random() < 0.1) {
        // Changement de direction aléatoire (45 ou 90 deg)
        this.direction = (this.direction + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;
      }

      const rad = (this.direction * Math.PI) / 4;
      this.x += Math.cos(rad) * this.speed;
      this.y += Math.sin(rad) * this.speed;

      this.history.push({x: this.x, y: this.y});
      if (this.history.length > 50) this.history.shift(); // Longueur de la traîne

      this.length += this.speed;
      
      if (this.length > this.maxLength || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
        this.dead = true;
      }
    }

    draw() {
      if (this.history.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      
      // Dégradé pour l'effet de traîne lumineuse
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = this.dead ? 0.2 : 0.8;
      ctx.stroke();

      // Dessine un VIA (pastille) à la fin quand la piste meurt
      if (this.dead && this.viaSize < 4) {
        this.viaSize += 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.viaSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  for (let i = 0; i < maxTraces; i++) {
    setTimeout(() => traces.push(new Trace()), i * 1000);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    traces.forEach(trace => {
      trace.update();
      trace.draw();
      if (trace.dead && trace.viaSize >= 4 && Math.random() < 0.01) {
        trace.reset();
      }
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ---------- 3. L'Easter Egg "Kernel Panic / Watchdog" ----------
function initWatchdog() {
  const btn = document.getElementById('wdt-trigger');
  const panicScreen = document.getElementById('kernel-panic');
  const actionText = document.getElementById('panic-action');
  
  if (!btn || !panicScreen) return;

  btn.addEventListener('click', () => {
    // Affiche l'écran noir de crash
    panicScreen.classList.remove('hidden');
    // Bloque le défilement de la page
    document.body.style.overflow = 'hidden';
    
    // Séquence temporelle du Watchdog
    setTimeout(() => {
      actionText.textContent = "[ Watchdog Timer expired. Attempting hardware reset... ]";
      actionText.style.color = "#38bdf8"; // Passe au bleu/cyan
    }, 2500);

    setTimeout(() => {
      actionText.textContent = "[ Rebooting System... ]";
      actionText.style.color = "#8fd6a8"; // Passe au vert
      
      // On efface la mémoire session pour FORCER le bootloader à se relancer
      sessionStorage.removeItem('portfolio_booted');
    }, 4000);

    setTimeout(() => {
      // Recharge la page
      window.location.reload();
    }, 5000);
  });
}

