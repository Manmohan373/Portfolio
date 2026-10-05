(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme (remembered, falls back safely) ---- */
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('theme');
    if (saved) root.setAttribute('data-theme', saved);
    else if (window.matchMedia('(prefers-color-scheme: light)').matches) root.setAttribute('data-theme', 'light');
  } catch (e) {}
  $('#themeBtn').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    drawNet();
  });

  /* ---- Mobile menu ---- */
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---- Scroll: nav state, progress bar, timeline rail ---- */
  var nav = $('#nav'), bar = $('#progress'), rail = $('#railFill'), tl = $('.timeline');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 10);
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (tl && rail) {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      rail.style.height = (p * 100) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Active nav link ---- */
  var links = $$('.menu a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---- Reveal on scroll + count-up ---- */
  function countUp(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduce || target === 0) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step); else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); $$('[data-count]', el).forEach(countUp); });
  }

  /* ---- Typing effect ---- */
  var phrases = [
    'Java 21 · Spring Boot 3 microservices',
    'OAuth2 · LDAP · RBAC security',
    'Spring Cloud Gateway · REST · SOAP',
    'Enterprise banking, built to stay up'
  ];
  var typed = $('#typed');
  if (reduce) { typed.textContent = phrases[0]; }
  else {
    var pi = 0, ci = 0, del = false;
    (function tick() {
      var full = phrases[pi];
      typed.textContent = full.slice(0, ci);
      var delay = del ? 28 : 60;
      if (!del && ci === full.length) { del = true; delay = 1700; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; delay = 350; }
      else ci += del ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }

  /* ---- Hero 3D tilt ---- */
  var tilt = $('#tilt');
  if (tilt && !reduce && window.matchMedia('(hover: hover)').matches) {
    tilt.addEventListener('mousemove', function (e) {
      var r = tilt.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';
    });
    tilt.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  /* ---- Hero network canvas ---- */
  var cv = $('#net'), ctx = cv.getContext('2d'), nodes = [], W = 0, H = 0, raf = null, mouse = { x: -999, y: -999 };
  function color(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(70, (W * H) / 18000));
    nodes = [];
    for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 });
  }
  function drawNet() {
    ctx.clearRect(0, 0, W, H);
    var c = color('--accent') || '#38bdf8';
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      if (!reduce) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.globalAlpha = (1 - d / 130) * 0.35; ctx.strokeStyle = c; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 160) {
        ctx.globalAlpha = (1 - md / 160) * 0.6; ctx.strokeStyle = c;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.globalAlpha = 0.8; ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(a.x, a.y, 2, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function loop() { drawNet(); raf = requestAnimationFrame(loop); }
  size();
  if (reduce) drawNet(); else loop();
  window.addEventListener('resize', function () { size(); if (reduce) drawNet(); });
  $('#top').addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  $('#top').addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });
  document.addEventListener('visibilitychange', function () {
    if (reduce) return;
    if (document.hidden) cancelAnimationFrame(raf); else loop();
  });

  /* ---- Architecture diagram ---- */
  var cap = $('#archCap');
  $$('#archSvg .node').forEach(function (n) {
    function show() {
      $$('#archSvg .node').forEach(function (o) { o.classList.remove('on'); });
      n.classList.add('on');
      cap.textContent = n.getAttribute('data-info');
      cap.classList.add('set');
    }
    n.addEventListener('mouseenter', show);
    n.addEventListener('focus', show);
    n.addEventListener('click', show);
  });

  /* ---- Skill filters ---- */
  var chips = $$('.f'), skills = $$('.sk');
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-selected', 'false'); });
      ch.classList.add('active'); ch.setAttribute('aria-selected', 'true');
      var f = ch.dataset.f;
      skills.forEach(function (s) {
        var show = f === 'all' || s.dataset.c === f;
        s.classList.toggle('hide', !show);
        s.classList.remove('pop');
        if (show) { void s.offsetWidth; s.classList.add('pop'); }
      });
    });
  });

  /* ---- Contact form: opens the visitor's mail app (no backend needed) ---- */
  var form = $('#contact-form'), note = $('#formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = ['name', 'email', 'message'].map(function (id) { return $('#' + id); });
    var ok = true;
    f.forEach(function (el) {
      var bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
      el.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    note.classList.toggle('err', !ok);
    if (!ok) { note.textContent = 'Please fill in all fields with a valid email.'; return; }
    var subject = encodeURIComponent('Portfolio enquiry from ' + f[0].value.trim());
    var body = encodeURIComponent(f[2].value.trim() + '\n\n— ' + f[0].value.trim() + ' (' + f[1].value.trim() + ')');
    note.textContent = 'Opening your email app…';
    window.location.href = 'mailto:pattnaikmanmohan373@gmail.com?subject=' + subject + '&body=' + body;
  });

  $('#year').textContent = new Date().getFullYear();
})();
