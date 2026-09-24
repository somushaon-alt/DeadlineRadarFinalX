/* ============================================================
   DEADLINE RADAR — animations.js
   Living background: particles, orbs, floating academic
   objects, light trails + subtle mouse parallax.
============================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.innerWidth < 720;

  function init() {
    const root = document.getElementById("bg-root");
    if (!root) return;

    // grid overlay
    const grid = document.createElement("div");
    grid.className = "grid-overlay";
    root.appendChild(grid);

    buildOrbs(root);
    if (!reduceMotion) {
      buildParticles(root);
      buildFloatingObjects(root);
      if (!isMobile) buildLightTrails(root);
      buildMouseParallax(root);
    }
  }

  /* ---------- Big blurred orbs ---------- */
  function buildOrbs(root) {
    const configs = [
      { cls: "orb-cyan", w: 420, top: "8%", left: "5%", dur: 22 },
      { cls: "orb-purple", w: 460, top: "45%", left: "72%", dur: 26 },
      { cls: "orb-blue", w: 360, top: "75%", left: "20%", dur: 30 },
    ];
    configs.forEach((c, i) => {
      const o = document.createElement("div");
      o.className = "orb " + c.cls;
      o.style.width = c.w + "px";
      o.style.height = c.w + "px";
      o.style.top = c.top;
      o.style.left = c.left;
      if (!reduceMotion) {
        o.style.animation = `orbDrift ${c.dur}s ease-in-out infinite`;
        o.style.animationDelay = i * 2 + "s";
      }
      root.appendChild(o);
    });
  }

  /* ---------- Floating particles ---------- */
  function buildParticles(root) {
    const count = isMobile ? 18 : 42;
    const colors = ["#22d3ee", "#3b82f6", "#8b5cf6"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const size = 1 + Math.random() * 2.6;
      const color = colors[i % colors.length];
      const dur = 10 + Math.random() * 16;
      const delay = Math.random() * 12;
      const dx = (Math.random() - 0.5) * 120;
      const dy = -60 - Math.random() * 160;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = Math.random() * 100 + "%";
      p.style.top = Math.random() * 100 + "%";
      p.style.color = color;
      p.style.background = color;
      p.style.setProperty("--pmax", 0.35 + Math.random() * 0.4);
      p.style.setProperty("--dx", dx + "px");
      p.style.setProperty("--dy", dy + "px");
      p.style.animation = `particleDrift ${dur}s ease-in-out ${delay}s infinite`;
      root.appendChild(p);
    }
  }

  /* ---------- Floating academic objects (inline SVG icons) ---------- */
  function buildFloatingObjects(root) {
    const icons = {
      book: '<svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5A1.5 1.5 0 0 0 20 18.5v-13z"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
      clock: '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
      cap: '<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M20 10v6"/></svg>',
      laptop: '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="5" width="16" height="10.5" rx="1.2"/><path d="M2.5 19h19"/></svg>',
      doc: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M9 12h6M9 15.5h6M9 8.5h3"/></svg>',
      chart: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20.5h19"/></svg>',
      pencil: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m4 20 1-4.6L16.5 4 20 7.5 8.6 19 4 20z"/><path d="m14.5 6 3.5 3.5"/></svg>',
      bell: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"/><path d="M9.5 18.5a2.5 2.5 0 0 0 5 0"/></svg>',
    };
    const keys = Object.keys(icons);
    const count = isMobile ? 5 : 9;
    for (let i = 0; i < count; i++) {
      const key = keys[i % keys.length];
      const el = document.createElement("div");
      el.className = "float-object";
      el.innerHTML = icons[key];
      el.style.left = 4 + Math.random() * 90 + "%";
      el.style.top = 6 + Math.random() * 86 + "%";
      const dur = 16 + Math.random() * 14;
      const delay = Math.random() * 10;
      el.style.animation = `floatObj ${dur}s ease-in-out ${delay}s infinite`;
      root.appendChild(el);
    }
  }

  /* ---------- Occasional light trails ---------- */
  function buildLightTrails(root) {
    function spawnTrail() {
      const t = document.createElement("div");
      t.className = "light-trail";
      const fromBottom = Math.random() > 0.5;
      const startX = Math.random() * 90;
      const startY = fromBottom ? 90 + Math.random() * 8 : Math.random() * 10;
      const tx = (Math.random() - 0.5) * 260;
      const ty = fromBottom ? -(320 + Math.random() * 220) : 320 + Math.random() * 220;
      t.style.left = startX + "%";
      t.style.top = startY + "%";
      t.style.setProperty("--tx", tx + "px");
      t.style.setProperty("--ty", ty + "px");
      const dur = 4 + Math.random() * 3;
      t.style.animation = `trailMove ${dur}s ease-out forwards`;
      root.appendChild(t);
      setTimeout(() => t.remove(), dur * 1000 + 200);
    }
    setInterval(spawnTrail, 2600);
    spawnTrail();
  }

  /* ---------- Subtle mouse parallax on orbs + tiltable cards ---------- */
  function buildMouseParallax(root) {
    let mx = 0.5,
      my = 0.5;
    const orbs = root.querySelectorAll(".orb");
    window.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX / window.innerWidth;
        my = e.clientY / window.innerHeight;
        orbs.forEach((o, i) => {
          const strength = 18 + i * 6;
          o.style.transform = `translate(${(mx - 0.5) * strength}px, ${(my - 0.5) * strength}px)`;
        });
      },
      { passive: true }
    );

    // subtle 3D tilt for elements marked [data-tilt]
    document.addEventListener("mousemove", (e) => {
      document.querySelectorAll("[data-tilt]").forEach((card) => {
        const r = card.getBoundingClientRect();
        if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 40 || e.clientY > r.bottom + 40) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const rx = ((e.clientY - cy) / r.height) * -4;
        const ry = ((e.clientX - cx) / r.width) * 4;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
    });
    document.addEventListener("mouseleave", () => {
      document.querySelectorAll("[data-tilt]").forEach((card) => (card.style.transform = ""));
    });
  }

  /* ---------- Scroll reveal for cards/sections ---------- */
  function initScrollReveal() {
    const targets = document.querySelectorAll(".feature-card, .dl-card, .stat-card");
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view", "in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- Sticky navbar shrink on scroll ---------- */
  function initNavbarScroll() {
    const nav = document.querySelector(".navbar");
    if (!nav) return;
    window.addEventListener(
      "scroll",
      () => {
        nav.classList.toggle("scrolled", window.scrollY > 30);
      },
      { passive: true }
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    initScrollReveal();
    initNavbarScroll();
  });

  window.DRAnim = { countUpNumber: null };
})();