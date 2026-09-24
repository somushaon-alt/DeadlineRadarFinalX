/* ============================================================
   DEADLINE RADAR — dashboard.js
============================================================ */
(function () {
  "use strict";

  function statusRank(status) {
    return { critical: 0, overdue: 1, upcoming: 2, safe: 3, completed: 4 }[status];
  }

  function renderStats() {
    const stats = DR.computeStats();
    const cards = [
      { id: "statTotal", val: stats.total, card: ".stat-card.total" },
      { id: "statCompleted", val: stats.completed, card: ".stat-card.completed" },
      { id: "statPending", val: stats.pending, card: ".stat-card.pending" },
      { id: "statOverdue", val: stats.overdue, card: ".stat-card.overdue" },
    ];
    cards.forEach((c, i) => {
      const el = document.getElementById(c.id);
      const cardEl = document.querySelectorAll(".stat-card")[i];
      setTimeout(() => {
        cardEl.classList.add("in");
        DR.countUp(el, c.val, 1100);
      }, i * 110);
    });
  }

  function renderFocus() {
    const list = DR.getDeadlines()
      .filter((d) => !d.completed)
      .sort((a, b) => {
        const ra = statusRank(DR.getStatus(a));
        const rb = statusRank(DR.getStatus(b));
        if (ra !== rb) return ra - rb;
        return new Date(a.due) - new Date(b.due);
      })
      .slice(0, 5);

    const container = document.getElementById("focusList");
    if (!list.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="glyph">🎉</div>
          <h3>No deadlines yet</h3>
          <p>Add your first deadline to start tracking your academic workload.</p>
          <button class="btn btn-primary" data-open-add>+ Add Deadline</button>
        </div>`;
      container.querySelector("[data-open-add]").addEventListener("click", () => DR.modal.openAdd());
      return;
    }

    container.innerHTML = list
      .map((d, i) => {
        const status = DR.getStatus(d);
        return `
        <div class="dl-card ${status}" style="transition-delay:${i * 60}ms" data-id="${d.id}">
          <div class="stripe"></div>
          <div class="dl-main">
            <div class="title">${DR.escapeHTML(d.title)}</div>
            <div class="meta">
              <span>${DR.escapeHTML(d.course)}</span>
              <span class="chip ${status}">${DR.remainingLabel(d)}</span>
              <span class="chip priority-${d.priority}">Priority: ${d.priority}</span>
            </div>
          </div>
          <div class="dl-progress">
            <div class="bar-track"><div class="bar-fill" style="width:${d.progress}%"></div></div>
            <div class="pct">Progress: ${d.progress}%</div>
          </div>
          <div class="dl-countdown ${status}" data-due data-id="${d.id}">${DR.countdownString(d)}</div>
          <div class="dl-actions">
            <button class="icon-btn complete" title="Mark complete" data-act="complete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12.5l5 5L20 6"/></svg>
            </button>
            <button class="icon-btn" title="View details" data-act="view">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>`;
      })
      .join("");

    requestAnimationFrame(() => {
      container.querySelectorAll(".dl-card").forEach((c) => c.classList.add("in"));
    });

    container.querySelectorAll(".dl-card").forEach((card) => {
      const id = card.getAttribute("data-id");
      card.querySelector('[data-act="complete"]').addEventListener("click", () => {
        const d = DR.toggleComplete(id);
        DR.toast("safe", "Task Completed", "You completed " + d.title + ".");
        renderAll();
      });
      card.querySelector('[data-act="view"]').addEventListener("click", () => DR.modal.openDetail(id));
    });
  }

  function renderAll() {
    renderStats();
    renderFocus();
    DR.renderNotifPanel();
  }

  document.addEventListener("DOMContentLoaded", () => {
    DR.initShell();
    DR.modal.onChange = renderAll;
    renderAll();
  });
})();