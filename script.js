/* ═══════════════════════════════════════════════
   CRAXXY STUDIO — Main Script
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Service Worker Registration ───
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // ─── Header Scroll Effect ───
  const header = document.getElementById('header');
  if (header) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ─── Mobile Navigation ───
  const mobileNavTrigger = document.getElementById('mobileNavTrigger');
  const mobileNav = document.getElementById('mobileNav');

  if (mobileNavTrigger && mobileNav) {
    mobileNavTrigger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('open');
      mobileNavTrigger.classList.toggle('active');

      if (isOpen) {
        mobileNav.style.opacity = '0';
        mobileNav.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          mobileNav.classList.remove('open');
        }, 300);
      } else {
        mobileNav.classList.add('open');
        requestAnimationFrame(() => {
          mobileNav.style.opacity = '1';
          mobileNav.style.transform = 'translateY(0)';
        });
      }

      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
  }

  // ─── Live Clock ───
  const clockEl = document.getElementById('liveClock');
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      clockEl.innerHTML = `${h}<span class="separator">:</span>${m}<span class="separator">:</span>${s}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ─── Command Palette ───
  const cmdPalette = document.getElementById('cmdPalette');
  const cmdInput = document.getElementById('cmdInput');
  const cmdResults = document.getElementById('cmdResults');
  const cmdBtn = document.getElementById('cmdBtn');

  const commands = [
    { name: 'Workspace', icon: '⚡', href: 'index.html', shortcut: '' },
    { name: 'Code Editor', icon: '🖥', href: 'code.html', shortcut: '' },
    { name: 'Chat Pro', icon: '💬', href: 'chat.html', shortcut: '' },
    { name: 'Outils IP & Device', icon: '🔧', href: 'tools.html', shortcut: '' },
    { name: 'Crosshair Overlay', icon: '🎯', href: 'crosshair.html', shortcut: '' },
    { name: 'Films & Streaming', icon: '🎬', href: 'films.html', shortcut: '' },
    { name: 'Wallpaper Generator', icon: '🖼', href: 'wallpaper.html', shortcut: '' },
    { name: 'Onde AirDrop', icon: '📡', href: 'airdrop.html', shortcut: '' },
    { name: 'Jeux — Plus ou Moins', icon: '🎮', href: 'games.html', shortcut: '' },
    { name: 'Test Lab', icon: '🧪', href: 'test.html', shortcut: '' },
    { name: 'Recharger la page', icon: '🔄', action: () => location.reload(), shortcut: 'F5' },
    { name: 'Basculer plein écran', icon: '⛶', action: () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }, shortcut: 'F11' },
    { name: 'Copier l\'URL', icon: '🔗', action: () => {
      navigator.clipboard.writeText(location.href);
      showToast('URL copiée ! 🔗', 'success');
    }, shortcut: '' },
  ];

  window.openCmd = function () {
    if (cmdPalette) {
      cmdPalette.classList.add('open');
      cmdInput.value = '';
      renderCommands('');
      setTimeout(() => cmdInput.focus(), 100);
    }
  };

  function closeCmd() {
    if (cmdPalette) cmdPalette.classList.remove('open');
  }

  function renderCommands(query) {
    if (!cmdResults) return;
    const filtered = commands.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    cmdResults.innerHTML = filtered.map((c, i) => `
      <div class="cmd-result${i === 0 ? ' active' : ''}" data-index="${i}">
        <span class="icon">${c.icon}</span>
        <span>${c.name}</span>
        ${c.shortcut ? `<span class="shortcut">${c.shortcut}</span>` : ''}
      </div>
    `).join('');

    cmdResults.querySelectorAll('.cmd-result').forEach((el, idx) => {
      el.addEventListener('click', () => executeCommand(filtered[idx]));
      el.addEventListener('mouseenter', () => {
        cmdResults.querySelectorAll('.cmd-result').forEach(e => e.classList.remove('active'));
        el.classList.add('active');
      });
    });
  }

  function executeCommand(cmd) {
    closeCmd();
    if (cmd.action) cmd.action();
    else if (cmd.href) location.href = cmd.href;
  }

  if (cmdInput) {
    cmdInput.addEventListener('input', () => renderCommands(cmdInput.value));
    cmdInput.addEventListener('keydown', (e) => {
      const results = cmdResults.querySelectorAll('.cmd-result');
      const active = cmdResults.querySelector('.cmd-result.active');
      const idx = Array.from(results).indexOf(active);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        results.forEach(r => r.classList.remove('active'));
        results[(idx + 1) % results.length]?.classList.add('active');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        results.forEach(r => r.classList.remove('active'));
        results[(idx - 1 + results.length) % results.length]?.classList.add('active');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeResult = cmdResults.querySelector('.cmd-result.active');
        if (activeResult) activeResult.click();
      } else if (e.key === 'Escape') {
        closeCmd();
      }
    });
  }

  if (cmdPalette) {
    cmdPalette.addEventListener('click', (e) => {
      if (e.target === cmdPalette) closeCmd();
    });
  }

  if (cmdBtn) {
    cmdBtn.addEventListener('click', openCmd);
  }

  // Ctrl+K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (cmdPalette?.classList.contains('open')) closeCmd();
      else openCmd();
    }
    if (e.key === 'Escape') closeCmd();
  });

  // ─── Toast System ───
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // ─── Reveal on Scroll ───
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // ─── Mouse Tracking for Cards ───
  document.addEventListener('mousemove', (e) => {
    // Update CSS custom properties for card hover effects
    document.querySelectorAll('.glass-card, .bento-card').forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    // Move orbs slightly with mouse
    const orbs = document.querySelectorAll('.orb');
    const mx = (e.clientX / window.innerWidth - 0.5) * 20;
    const my = (e.clientY / window.innerHeight - 0.5) * 20;
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 0.5;
      orb.style.transform = `translate(${mx * factor}px, ${my * factor}px)`;
    });
  });

  // ─── Counter Animation ───
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count);
            if (isNaN(target)) return;

            let current = 0;
            const step = Math.max(1, Math.ceil(target / 40));
            const timer = setInterval(() => {
              current += step;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              el.textContent = current;
            }, 30);

            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  // ─── Background Canvas (Fluid Waves) ───
  const bgCanvas = document.getElementById('bgCanvas');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    let time = 0;

    function resizeBg() {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
    }
    resizeBg();
    window.addEventListener('resize', resizeBg);

    function drawBg() {
      time += 0.005;
      const w = bgCanvas.width;
      const h = bgCanvas.height;

      ctx.clearRect(0, 0, w, h);

      // Subtle fluid waves
      const waves = [
        { color: 'rgba(0,229,255,0.04)', y: 0.5, amp: 60, freq: 0.003, speed: 1 },
        { color: 'rgba(255,45,85,0.03)', y: 0.55, amp: 45, freq: 0.004, speed: 0.7 },
        { color: 'rgba(255,122,24,0.02)', y: 0.6, amp: 35, freq: 0.005, speed: 1.3 },
        { color: 'rgba(0,229,255,0.025)', y: 0.4, amp: 50, freq: 0.002, speed: 0.5 },
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += 4) {
          const y =
            h * wave.y +
            Math.sin(x * wave.freq + time * wave.speed) * wave.amp +
            Math.sin(x * wave.freq * 2.3 + time * wave.speed * 1.4) * wave.amp * 0.3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();
      });

      requestAnimationFrame(drawBg);
    }

    drawBg();
  }

  // ─── Keyboard shortcuts hint ───
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  });

  // ─── Online/Offline Detection ───
  window.addEventListener('online', () => {
    showToast('Connexion rétablie ✅', 'success');
  });

  window.addEventListener('offline', () => {
    showToast('Connexion perdue ⚠️', 'error');
  });

  // ─── Welcome Toast (first visit) ───
  if (!sessionStorage.getItem('craxxy_welcomed')) {
    sessionStorage.setItem('craxxy_welcomed', '1');
    setTimeout(() => {
      showToast('Bienvenue sur Craxxy Studio ⚡', 'success');
    }, 1500);
  }

})();