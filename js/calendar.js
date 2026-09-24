/* ============================================================
   DEADLINE RADAR — calendar.js
   Monthly grid + deadline indicators. Click a day to add a
   deadline on that date; click an event to open its details.
============================================================ */
(function () {
  "use strict";

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const MAX_VISIBLE = 3;

  const view = { year: 0, month: 0 };

  /* ---------- date helpers ---------- */
  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  function dateKey(y, m, day) {
    return y + "-" + pad2(m + 1) + "-" + pad2(day);
  }
  function keyOfDeadline(d) {
    const dt = new Date(d.due);
    return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  /* ---------- grouping ---------- */
  function groupByDay() {
    const map = {};
    DR.getDeadlines().forEach((d) => {
      const k = keyOfDeadline(d);
      (map[k] = map[k] || []).push(d);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => new Date(a.due) - new Date(b.due));
    });
    return map;
  }

  /* ---------- rendering ---------- */
  function renderDow() {
    const row = document.getElementById("calDow");
    row.innerHTML = DOW.map((d) => '<div class="cal-dow">' + d + "</div>").join("");
  }

  function renderGrid() {
    const grid = document.getElementById("calGrid");
    const byDay = groupByDay();
    const today = startOfToday();

    const firstWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const daysInPrev = new Date(view.year, view.month, 0).getDate();

    const cells = [];

    // trailing days of the previous month
    for (let i = firstWeekday - 1; i >= 0; i--) {
      cells.push({ pad: true, day: daysInPrev - i });
    }
    // this month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ pad: false, day: day });
    }
    // opening days of the next month, to complete the final week
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ pad: true, day: nextDay++ });
    }

    document.getElementById("calMonthLabel").textContent =
      MONTHS[view.month] + " " + view.year;

    grid.innerHTML = cells
      .map((c) => {
        if (c.pad) {
          return '<div class="cal-day pad"><span class="num">' + c.day + "</span></div>";
        }

        const key = dateKey(view.year, view.month, c.day);
        const items = byDay[key] || [];
        const cellDate = new Date(view.year, view.month, c.day);
        const isToday = cellDate.getTime() === today.getTime();

        const events = items
          .slice(0, MAX_VISIBLE)
          .map((d) => {
            const status = DR.getStatus(d);
            return (
              '<div class="cal-event ' + status + '" data-id="' + d.id +
              '" title="' + DR.escapeHTML(d.title + " — " + d.course) + '">' +
              DR.escapeHTML(d.title) + "</div>"
            );
          })
          .join("");

        const more =
          items.length > MAX_VISIBLE
            ? '<div class="cal-event" data-more="' + key +
              '" style="color:var(--text-low);background:rgba(255,255,255,.04);">+' +
              (items.length - MAX_VISIBLE) + " more</div>"
            : "";

        return (
          '<div class="cal-day' + (isToday ? " today" : "") + '" data-date="' + key + '">' +
          '<span class="num">' + c.day + "</span>" +
          events + more +
          "</div>"
        );
      })
      .join("");

    wireGrid();
  }

  function wireGrid() {
    const grid = document.getElementById("calGrid");

    grid.querySelectorAll(".cal-event[data-id]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        DR.modal.openDetail(el.getAttribute("data-id"));
      });
    });

    // "+N more" expands that day in place
    grid.querySelectorAll(".cal-event[data-more]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        expandDay(el.getAttribute("data-more"));
      });
    });

    // clicking empty space in a day starts a new deadline on that date
    grid.querySelectorAll(".cal-day[data-date]").forEach((cell) => {
      cell.addEventListener("click", () => {
        DR.modal.openAdd(cell.getAttribute("data-date"));
      });
    });
  }

  function expandDay(key) {
    const cell = document.querySelector('.cal-day[data-date="' + key + '"]');
    if (!cell) return;
    const items = groupByDay()[key] || [];
    cell.querySelectorAll(".cal-event").forEach((el) => el.remove());
    items.forEach((d) => {
      const el = document.createElement("div");
      el.className = "cal-event " + DR.getStatus(d);
      el.textContent = d.title;
      el.title = d.title + " — " + d.course;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        DR.modal.openDetail(d.id);
      });
      cell.appendChild(el);
    });
  }

  /* ---------- navigation ---------- */
  function shiftMonth(delta) {
    view.month += delta;
    if (view.month < 0) {
      view.month = 11;
      view.year--;
    } else if (view.month > 11) {
      view.month = 0;
      view.year++;
    }
    renderGrid();
  }

  function goToday() {
    const now = new Date();
    view.year = now.getFullYear();
    view.month = now.getMonth();
    renderGrid();
  }

  function wireControls() {
    document.getElementById("calPrev").addEventListener("click", () => shiftMonth(-1));
    document.getElementById("calNext").addEventListener("click", () => shiftMonth(1));
    document.getElementById("calToday").addEventListener("click", goToday);

    document.addEventListener("keydown", (e) => {
      if (document.querySelector(".modal-overlay.open")) return;
      if (e.key === "ArrowLeft") shiftMonth(-1);
      if (e.key === "ArrowRight") shiftMonth(1);
    });
  }

  function openingMonth() {
    const now = new Date();
    view.year = now.getFullYear();
    view.month = now.getMonth();
    if (DR.settings.get().defaultCalView === "next") shiftMonth(1);
    else renderGrid();
  }

  document.addEventListener("DOMContentLoaded", () => {
  DR.initShell();

  DR.modal.onChange = renderGrid;

  renderDow();
  openingMonth();
  wireControls();

  // Refresh calendar when MongoDB deadlines finish loading
  window.addEventListener("dr-mongo-loaded", () => {
    console.log("Calendar refreshed with MongoDB data.");
    renderGrid();
  });

  // Refresh calendar whenever a deadline is added,
  // edited, completed, or deleted
  window.addEventListener("dr-deadline-changed", () => {
    console.log("Calendar refreshed after deadline change.");
    renderGrid();
  });
});
})();
