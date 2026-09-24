/* ============================================================
   DEADLINE RADAR — radar.js
   Plots every open deadline as a blip. Distance from the
   centre = time remaining, so the most urgent work sits
   closest to the middle of the scope.
============================================================ */
(function () {
  "use strict";

  const HORIZON_DAYS = 14; // anything further out sits on the outer ring
  const MIN_R = 0.08;      // keep blips off the exact centre
  const MAX_R = 0.45;      // stay inside the outermost ring
  const GOLDEN = 137.508;  // degrees — spreads blips evenly, no clustering

  function radiusFor(d) {
    const diff = new Date(d.due).getTime() - Date.now();
    if (diff <= 0) return MIN_R; // overdue: dead centre
    const days = diff / 86400000;
    const t = Math.min(days / HORIZON_DAYS, 1);
    return MIN_R + (MAX_R - MIN_R) * t;
  }

  function plot() {
    const scope = document.getElementById("bigRadar");
    scope.querySelectorAll(".radar-point, .orbit-particle").forEach((el) => el.remove());

    const open = DR.getDeadlines()
      .filter((d) => !d.completed)
      .sort((a, b) => new Date(a.due) - new Date(b.due));

    open.forEach((d, i) => {
      const status = DR.getStatus(d);
      const r = radiusFor(d);
      const angle = ((i * GOLDEN) % 360) * (Math.PI / 180);

      const left = 50 + r * 100 * Math.cos(angle);
      const top = 50 + r * 100 * Math.sin(angle);

      const point = document.createElement("div");
      point.className = "radar-point " + status;
      point.style.left = left + "%";
      point.style.top = top + "%";
      point.setAttribute("data-id", d.id);
      point.innerHTML =
        '<div class="radar-tip"><b>' + DR.escapeHTML(d.title) + "</b>" +
        DR.escapeHTML(d.course) + "<br>" +
        DR.escapeHTML(DR.remainingLabel(d)) + " · Priority: " + DR.escapeHTML(d.priority) +
        "</div>";
      point.addEventListener("click", () => DR.modal.openDetail(d.id));
      scope.appendChild(point);
    });

    addOrbitParticles(scope);
    renderList(open);
  }

  function addOrbitParticles(scope) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = scope.getBoundingClientRect();
    const half = (rect.width || 600) / 2;
    [0.55, 0.78, 0.92].forEach((frac, i) => {
      const p = document.createElement("div");
      p.className = "orbit-particle";
      p.style.left = "50%";
      p.style.top = "50%";
      p.style.setProperty("--radius", Math.round(half * frac) + "px");
      p.style.animation = "orbitSpin " + (14 + i * 6) + "s linear infinite";
      p.style.animationDelay = i * -3 + "s";
      scope.appendChild(p);
    });
  }

  function renderList(open) {
    const root = document.getElementById("radarList");
    if (!open.length) {
      root.innerHTML =
        '<div class="empty-state"><div class="glyph">🛰️</div>' +
        "<h3>Radar is clear</h3><p>Nothing outstanding. Add a deadline to start tracking it.</p>" +
        '<button class="btn btn-primary" data-open-add>+ Add Deadline</button></div>';
      root.querySelector("[data-open-add]").addEventListener("click", () => DR.modal.openAdd());
      return;
    }

    root.innerHTML = open
      .map((d, i) => {
        const status = DR.getStatus(d);
        return (
          '<div class="dl-card ' + status + '" style="transition-delay:' + Math.min(i, 8) * 50 + 'ms" data-id="' + d.id + '">' +
          '<div class="stripe"></div>' +
          '<div class="dl-main">' +
          '<div class="title">' + DR.escapeHTML(d.title) + "</div>" +
          '<div class="meta">' +
          "<span>" + DR.escapeHTML(d.course) + "</span>" +
          "<span>" + DR.escapeHTML(d.type) + "</span>" +
          '<span class="chip ' + status + '">' + DR.statusLabel(status) + "</span>" +
          "</div></div>" +
          '<div class="dl-countdown ' + status + '" data-due data-id="' + d.id + '">' + DR.countdownString(d) + "</div>" +
          '<div class="dl-actions">' +
          '<button class="icon-btn" title="View details" data-act="view">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>' +
          "</button></div></div>"
        );
      })
      .join("");

    requestAnimationFrame(() => {
      root.querySelectorAll(".dl-card").forEach((c) => c.classList.add("in"));
    });

    root.querySelectorAll(".dl-card").forEach((card) => {
      const id = card.getAttribute("data-id");
      card.querySelector('[data-act="view"]').addEventListener("click", () => DR.modal.openDetail(id));
    });
  }

  function animateScanText() {
    const el = document.getElementById("scanText");
    if (!el) return;
    let n = 0;
    setInterval(() => {
      n = (n + 1) % 4;
      el.textContent = "SCANNING" + ".".repeat(n);
    }, 500);
  }

  document.addEventListener("DOMContentLoaded", () => {
  DR.initShell();

  DR.modal.onChange = plot;

  // Initial radar render
  plot();

  animateScanText();

  // Blips drift inward as time passes
  setInterval(plot, 60000);

  // Refresh when MongoDB data finishes loading
  window.addEventListener("dr-mongo-loaded", () => {
    console.log("Radar refreshed with MongoDB data.");
    plot();
  });

  // Refresh whenever a deadline is added, edited,
  // completed, or deleted
  window.addEventListener("dr-deadline-changed", () => {
    console.log("Radar refreshed after deadline change.");
    plot();
  });
});
})();
