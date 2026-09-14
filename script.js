document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const scrollProgress = document.getElementById('scrollProgress');
  let lastY = 0;

  // Mobile menu
  function toggleMenu(force){
    const open = typeof force === 'boolean' ? force : !mobileNav?.classList.contains('open');
    mobileNav?.classList.toggle('open', open);
    if(menuBtn){
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }
  }
  menuBtn?.addEventListener('click', () => toggleMenu());
  mobileNav?.addEventListener('click', (e) => {
    if(e.target.closest('a')) toggleMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') toggleMenu(false);
  });

  // Header scroll behavior
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if(header){
        header.classList.toggle('scrolled', y > 20);
        if(y > 200){
          if(y > lastY && y > 400) header.classList.add('hidden');
          else header.classList.remove('hidden');
        } else {
          header.classList.remove('hidden');
        }
      }
      if(scrollProgress){
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? (y / max) * 100 : 0;
        scrollProgress.style.width = p + '%';
      }
      lastY = y;
      ticking = false;
    });
  }, {passive:true});

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Card glow follow mouse
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--x', x + '%');
      card.style.setProperty('--y', y + '%');
    });
  });

  // Parallax orbs subtle mouse
  const orbs = document.querySelectorAll('.orb');
  let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  if(orbs.length && window.innerWidth > 900){
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    (function animateOrbs(){
      curX += (mouseX - curX) * 0.03;
      curY += (mouseY - curY) * 0.03;
      orbs.forEach((orb,i) => {
        const factor = (i+1)*6;
        orb.style.transform = `translate(${curX*factor}px, ${curY*factor}px)`;
      });
      requestAnimationFrame(animateOrbs);
    })();
  }

  // Smooth anchor
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if(id.length > 1){
        const target = document.querySelector(id);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    });
  });
});
