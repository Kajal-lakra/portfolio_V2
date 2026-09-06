(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- Mobile nav ---------------- */
  var menu = document.querySelector('.menu');
  var links = document.querySelector('.nav-links');
  if (menu && links){
    menu.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      menu.textContent = open ? '✕' : '☰';
    });
    links.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        menu.textContent = '☰';
      });
    });
  }

  /* ---------------- Scroll-triggered reveal ---------------- */
  var revealTargets = document.querySelectorAll(
    '.section-label, .section-heading, .about-grid > *, .project, .timeline article, .skill-cloud > div, .recognition, .certs, .contact-inner > *'
  );
  revealTargets.forEach(function(el){ el.classList.add('reveal-up'); });

  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry, i){
        if (entry.isIntersecting){
          var el = entry.target;
          setTimeout(function(){ el.classList.add('in-view'); }, (i % 4) * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(function(el){ io.observe(el); });
  } else {
    revealTargets.forEach(function(el){ el.classList.add('in-view'); });
  }

  /* ---------------- Animated stat counters ---------------- */
  var statEls = document.querySelectorAll('.stats strong');
  if (statEls.length && 'IntersectionObserver' in window){
    var counted = new WeakSet();
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting || counted.has(entry.target)) return;
        counted.add(entry.target);
        animateCount(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    statEls.forEach(function(el){ cio.observe(el); });
  }
  function animateCount(el){
    var raw = el.textContent.trim();
    var match = raw.match(/[\d.]+/);
    if (!match || reduceMotion){ return; }
    var target = parseFloat(match[0]);
    var decimals = match[0].includes('.') ? match[0].split('.')[1].length : 0;
    var prefix = raw.slice(0, match.index);
    var suffix = raw.slice(match.index + match[0].length);
    var dur = 1100, start = null;
    function step(ts){
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = (target * eased).toFixed(decimals);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }

  if (reduceMotion) return; // skip all decorative motion below

  /* ---------------- Twinkling starfield ---------------- */
  var canvas = document.createElement('canvas');
  canvas.id = 'sparkle-canvas';
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  var stars = [];
  var W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
  }
  function buildStars(){
    var count = Math.round((W * H) / 9000);
    count = Math.max(50, Math.min(count, 160));
    stars = [];
    for (var i = 0; i < count; i++){
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        base: Math.random() * 0.5 + 0.15,
        speed: Math.random() * 0.015 + 0.004,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.75 ? '200,255,61' : (Math.random() < 0.5 ? '142,240,255' : '167,139,255')
      });
    }
  }
  var t = 0;
  function tick(){
    t += 1;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++){
      var s = stars[i];
      var tw = s.base + Math.sin(t * s.speed + s.phase) * s.base;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + s.hue + ',' + Math.max(tw, 0.04).toFixed(3) + ')';
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(tick);

  /* ---------------- Desktop-only interaction layer ---------------- */
  if (!fine) return;

  document.documentElement.classList.add('custom-cursor');

  /* Spotlight grid — a technical grid revealed in a soft radius around the cursor */
  var grid = document.createElement('div');
  grid.className = 'grid-overlay';
  document.body.insertBefore(grid, canvas.nextSibling);

  /* Custom cursor: a small dot + a lagging ring */
  var dot = document.createElement('div'); dot.className = 'cursor-dot';
  var ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.appendChild(dot); document.body.appendChild(ring);

  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;
  var seen = false;

  window.addEventListener('mousemove', function(e){
    mx = e.clientX; my = e.clientY;
    grid.style.setProperty('--sx', mx + 'px');
    grid.style.setProperty('--sy', my + 'px');
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    if (!seen){ seen = true; grid.classList.add('active'); dot.classList.add('active'); ring.classList.add('active'); }
  }, { passive: true });

  window.addEventListener('mouseleave', function(){
    grid.classList.remove('active'); dot.classList.remove('active'); ring.classList.remove('active');
  });

  (function raf(){
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    requestAnimationFrame(raf);
  })();

  var hoverables = document.querySelectorAll('a, button, .project, .chips span, .skill-cloud span, .certs span');
  hoverables.forEach(function(el){
    el.addEventListener('mouseenter', function(){ ring.classList.add('hover'); });
    el.addEventListener('mouseleave', function(){ ring.classList.remove('hover'); });
  });

  /* Magnetic pull for primary buttons and CTAs */
  var magnets = document.querySelectorAll('.btn, .nav-cta, .email, .brand');
  magnets.forEach(function(el){
    var strength = el.classList.contains('email') ? 14 : 10;
    var lift = el.classList.contains('btn') ? -3 : 0;
    el.addEventListener('mousemove', function(e){
      var r = el.getBoundingClientRect();
      var ox = (e.clientX - r.left - r.width / 2) / r.width;
      var oy = (e.clientY - r.top - r.height / 2) / r.height;
      el.style.transform = 'translate(' + (ox * strength) + 'px,' + (oy * strength + lift) + 'px)';
    });
    el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
  });

  /* 3D tilt on code-card & project cards, with a mouse-tracked highlight */
  var tiltEls = document.querySelectorAll('.code-card, .project');
  tiltEls.forEach(function(el){
    var isCode = el.classList.contains('code-card');
    var raf2 = null, px = 0, py = 0;
    el.addEventListener('mousemove', function(e){
      var r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100) + '%');
      el.style.setProperty('--my', (py * 100) + '%');
      if (raf2) return;
      raf2 = requestAnimationFrame(function(){
        var rxv = (0.5 - py) * (isCode ? 14 : 6);
        var ryv = (px - 0.5) * (isCode ? 18 : 8);
        el.style.transform = 'rotateX(' + rxv.toFixed(2) + 'deg) rotateY(' + ryv.toFixed(2) + 'deg)' + (isCode ? ' rotate(1.5deg)' : ' translateY(-4px)');
        raf2 = null;
      });
    });
    el.addEventListener('mouseleave', function(){
      el.style.transform = isCode ? 'rotateX(6deg) rotateY(-10deg) rotate(1.5deg)' : '';
    });
  });

  /* Glitch-scramble text on hover: nav links, brand, project titles */
  var GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$%&*';
  function glitchEl(el){
    if (el.dataset.glitching) return;
    var original = el.textContent;
    var len = original.length;
    var frame = 0, maxFrames = 10;
    el.dataset.glitching = '1';
    var iv = setInterval(function(){
      var out = '';
      for (var i = 0; i < len; i++){
        if (original[i] === ' '){ out += ' '; continue; }
        var reveal = frame / maxFrames > i / len;
        out += reveal ? original[i] : GLITCH_CHARS[(Math.random() * GLITCH_CHARS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (frame > maxFrames){
        clearInterval(iv);
        el.textContent = original;
        delete el.dataset.glitching;
      }
    }, 28);
  }
  var glitchTargets = document.querySelectorAll('.nav-links a');
  glitchTargets.forEach(function(el){
    el.addEventListener('mouseenter', function(){ glitchEl(el); });
  });
})();
