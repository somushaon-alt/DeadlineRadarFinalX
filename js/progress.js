/* ============================================================
   DEADLINE RADAR — progress.js
   Completion ring, category bars, status chart and a
   per-course breakdown. All figures come from the same
   store the rest of the app uses.
============================================================ */
(function () {
  "use strict";

  const RING_R = 78;
  const CIRC = 2 * Math.PI * RING_R;

  const GROUPS = {
    assign: ["Assignment", "Lab Report"],
    project: ["Project", "Presentation"],
    exam: ["Class Test", "Midterm", "Final Exam", "Quiz"],
  };

  function pct(done, total) {
    return total ? Math.round((done / total) * 100) : 0;
  }

  // like DR.countUp, but writes a trailing % sign
  function countPercent(el, target, duration) {
    const start = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target) + "%";
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- top stat cards ---------- */
  function renderStats() {
    const s = DR.computeStats();
    const cards = [
      ["pStatTotal", s.total],
      ["pStatCompleted", s.completed],
      ["pStatPending", s.pending],
      ["pStatOverdue", s.overdue],
    ];
    document.querySelectorAll("#progressStats .stat-card").forEach((card, i) => {
      setTimeout(() => {
        card.classList.add("in");
        DR.countUp(document.getElementById(cards[i][0]), cards[i][1], 1100);
      }, i * 110);
    });
    return s;
  }

  /* ---------- completion ring ---------- */
  function renderRing(list) {
    const done = list.filter((d) => d.completed).length;
    const p = pct(done, list.length);

    const ring = document.getElementById("ringFg");
    ring.setAttribute("stroke-dasharray", CIRC);
    ring.setAttribute("stroke-dashoffset", CIRC); // start empty, then animate
    requestAnimationFrame(() => {
      ring.setAttribute("stroke-dashoffset", CIRC * (1 - p / 100));
    });

    countPercent(document.getElementById("ringPct"), p, 1300);
    document.getElementById("ringSub").textContent =
      done + " of " + list.length + " done";
  }

  /* ---------- category bars ---------- */
  function renderCategoryBars(list) {
    function share(types) {
      const subset = list.filter((d) => types.indexOf(d.type) !== -1);
      return { p: pct(subset.filter((d) => d.completed).length, subset.length), n: subset.length };
    }

    const rows = [
      ["barAssign", "barAssignTxt", share(GROUPS.assign)],
      ["barProject", "barProjectTxt", share(GROUPS.project)],
      ["barExam", "barExamTxt", share(GROUPS.exam)],
      [
        "barOverall",
        "barOverallTxt",
        { p: pct(list.filter((d) => d.completed).length, list.length), n: list.length },
      ],
    ];

    rows.forEach(([barId, txtId, data], i) => {
      const bar = document.getElementById(barId);
      document.getElementById(txtId).textContent = data.n ? data.p + "%" : "—";
      setTimeout(() => {
        bar.style.width = data.p + "%";
      }, 120 + i * 120);
    });
  }

  /* ---------- status chart ---------- */
  function renderChart(stats) {
    const max = Math.max(stats.completed, stats.pending, stats.overdue, 1);
    const cols = [
      ["chartCompleted", "chartCompletedVal", stats.completed],
      ["chartPending", "chartPendingVal", stats.pending],
      ["chartOverdue", "chartOverdueVal", stats.overdue],
    ];
    cols.forEach(([barId, valId, value], i) => {
      document.getElementById(valId).textContent = value;
      const bar = document.getElementById(barId);
      bar.style.height = "0%";
      setTimeout(() => {
        bar.style.height = Math.round((value / max) * 88) + "%";
      }, 200 + i * 130);
    });
  }

  /* ---------- per-course breakdown ---------- */
  function renderCourses(list) {
    const byCourse = {};
    list.forEach((d) => {
      const c = d.course || "Unassigned";
      byCourse[c] = byCourse[c] || { total: 0, done: 0 };
      byCourse[c].total++;
      if (d.completed) byCourse[c].done++;
    });

    const root = document.getElementById("courseBars");
    const names = Object.keys(byCourse).sort(
      (a, b) => byCourse[b].total - byCourse[a].total || a.localeCompare(b)
    );

    if (!names.length) {
      root.innerHTML =
        '<div class="empty-state"><div class="glyph">📊</div><h3>Nothing to chart yet</h3>' +
        "<p>Add a few deadlines and your progress will build up here.</p></div>";
      return;
    }

    root.innerHTML = names
      .map((name, i) => {
        const c = byCourse[name];
        const p = pct(c.done, c.total);
        return (
          '<div class="bar-item">' +
          '<div class="bar-label"><span>' + DR.escapeHTML(name) + "</span>" +
          "<b>" + c.done + "/" + c.total + " · " + p + "%</b></div>" +
          '<div class="bar-track-lg"><div class="bar-fill-lg c-overall" data-w="' + p + '" style="animation-delay:' + i * 120 + 'ms"></div></div>' +
          "</div>"
        );
      })
      .join("");

    requestAnimationFrame(() => {
      root.querySelectorAll(".bar-fill-lg").forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.getAttribute("data-w") + "%";
        }, 150 + i * 90);
      });
    });
  }

  function renderAll() {
    const list = DR.getDeadlines();
    const stats = renderStats();
    renderRing(list);
    renderCategoryBars(list);
    renderChart(stats);
    renderCourses(list);
  }

 document.addEventListener("DOMContentLoaded", () => {
  DR.initShell();

  DR.modal.onChange = renderAll;

  // Initial render
  renderAll();

  // Refresh when MongoDB data finishes loading
  window.addEventListener("dr-mongo-loaded", () => {
    console.log("Progress page refreshed with MongoDB data.");
    renderAll();
  });

  // Refresh whenever a deadline is added, edited,
  // completed, or deleted
  window.addEventListener("dr-deadline-changed", () => {
    console.log("Progress page refreshed after deadline change.");
    renderAll();
  });
});
})();
