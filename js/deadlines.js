/* ============================================================
   DEADLINE RADAR — deadlines.js
   Deadline list, filters, sorting and actions
============================================================ */

(function () {
  "use strict";

  /* ============================================================
     STATE
  ============================================================ */

  const state = {
    status: "all",
    category: "all",
    sort: "nearest",
    query: ""
  };


  /* ============================================================
     CATEGORY
  ============================================================ */

  function categoryOf(type) {
    const exam = [
      "Class Test",
      "Midterm",
      "Final Exam",
      "Quiz"
    ];

    if (type === "Assignment") return "Assignment";
    if (type === "Project") return "Project";
    if (type === "Presentation") return "Presentation";

    if (exam.includes(type)) {
      return "exam";
    }

    return "other";
  }


  /* ============================================================
     DATE HELPERS
  ============================================================ */

  function isSameCalendarDay(iso) {
    const a = new Date(iso);
    const b = new Date();

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }


  /* ============================================================
     PRIORITY
  ============================================================ */

  function priorityWeight(priority) {
    return {
      High: 0,
      Medium: 1,
      Low: 2
    }[priority] ?? 3;
  }


  /* ============================================================
     FILTER + SORT
  ============================================================ */

  function getFiltered() {
    let list = DR.getDeadlines();

    if (!Array.isArray(list)) {
      list = [];
    }

    /* ---------- search ---------- */

    if (state.query.trim()) {
      const q =
        state.query
          .trim()
          .toLowerCase();

      list = list.filter((d) => {

        const title =
          String(d.title || "")
            .toLowerCase();

        const course =
          String(d.course || "")
            .toLowerCase();

        const type =
          String(d.type || "")
            .toLowerCase();

        return (
          title.includes(q) ||
          course.includes(q) ||
          type.includes(q)
        );
      });
    }


    /* ---------- status ---------- */

    if (state.status !== "all") {

      list = list.filter((d) => {

        const status =
          DR.getStatus(d);

        if (
          state.status === "completed"
        ) {
          return d.completed === true;
        }

        if (d.completed) {
          return false;
        }

        if (
          state.status === "today"
        ) {
          return (
            isSameCalendarDay(d.due) &&
            status !== "overdue"
          );
        }

        if (
          state.status === "overdue"
        ) {
          return status === "overdue";
        }

        if (
          state.status === "upcoming"
        ) {
          return (
            status !== "overdue" &&
            !isSameCalendarDay(d.due)
          );
        }

        return true;
      });
    }


    /* ---------- category ---------- */

    if (state.category !== "all") {

      list = list.filter(
        (d) =>
          categoryOf(d.type) ===
          state.category
      );
    }


    /* ---------- sorting ---------- */

    list = list
      .slice()
      .sort((a, b) => {

        if (state.sort === "nearest") {
          return (
            new Date(a.due) -
            new Date(b.due)
          );
        }

        if (state.sort === "farthest") {
          return (
            new Date(b.due) -
            new Date(a.due)
          );
        }

        if (state.sort === "priority") {

          const pw =
            priorityWeight(a.priority) -
            priorityWeight(b.priority);

          return pw !== 0
            ? pw
            : new Date(a.due) -
              new Date(b.due);
        }

        if (state.sort === "recent") {

          return (
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
          );
        }

        return 0;
      });

    return list;
  }


  /* ============================================================
     RENDER
  ============================================================ */

  function render() {

    const root =
      document.getElementById(
        "deadlineListRoot"
      );

    if (!root) {
      console.warn(
        "DeadlineRadar: deadlineListRoot not found."
      );
      return;
    }

    const list =
      getFiltered();


    /* ---------- empty state ---------- */

    if (!list.length) {

      root.innerHTML = `
        <div class="empty-state">
          <div class="glyph">🎉</div>

          <h3>No deadlines yet</h3>

          <p>
            Add your first deadline to start
            tracking your academic workload.
          </p>

          <button
            class="btn btn-primary"
            data-open-add
          >
            + Add Deadline
          </button>
        </div>
      `;

      const addButton =
        root.querySelector(
          "[data-open-add]"
        );

      if (addButton) {
        addButton.addEventListener(
          "click",
          () => DR.modal.openAdd()
        );
      }

      return;
    }


    /* ---------- cards ---------- */

    root.innerHTML =
      list
        .map((d, i) => {

          const status =
            DR.getStatus(d);

          const title =
            DR.escapeHTML(
              d.title || ""
            );

          const course =
            DR.escapeHTML(
              d.course || ""
            );

          const type =
            DR.escapeHTML(
              d.type || ""
            );

          const priority =
            DR.escapeHTML(
              d.priority || "Medium"
            );

          const progress =
            Math.max(
              0,
              Math.min(
                100,
                Number(d.progress) || 0
              )
            );

          return `
            <div
              class="dl-card ${status}"
              style="transition-delay:${Math.min(i, 8) * 50}ms"
              data-id="${DR.escapeHTML(String(d.id))}"
            >

              <div class="stripe"></div>

              <div class="dl-main">

                <div class="title">
                  ${title}
                </div>

                <div class="meta">

                  <span>
                    ${course}
                  </span>

                  <span>
                    ${type}
                  </span>

                  <span>
                    Due ${DR.fmtDate(d.due)}
                  </span>

                  <span class="chip ${status}">
                    ${DR.remainingLabel(d)}
                  </span>

                  <span class="chip priority-${priority}">
                    Priority: ${priority}
                  </span>

                </div>

              </div>


              <div class="dl-progress">

                <div class="bar-track">
                  <div
                    class="bar-fill"
                    style="width:${progress}%"
                  ></div>
                </div>

                <div class="pct">
                  Progress: ${progress}%
                </div>

              </div>


              <div
                class="dl-countdown ${status}"
                data-due
                data-id="${DR.escapeHTML(String(d.id))}"
              >
                ${DR.countdownString(d)}
              </div>


              <div class="dl-actions">

                <!-- VIEW -->

                <button
                  class="icon-btn"
                  title="View"
                  data-act="view"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                  >
                    <path
                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                </button>


                <!-- EDIT -->

                <button
                  class="icon-btn"
                  title="Edit"
                  data-act="edit"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                  >
                    <path
                      d="m4 20 1-4.6L16.5 4 20 7.5 8.6 19 4 20z"
                    />
                  </svg>
                </button>


                <!-- COMPLETE -->

                <button
                  class="icon-btn complete"
                  title="${
                    d.completed
                      ? "Mark incomplete"
                      : "Mark complete"
                  }"
                  data-act="complete"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M4 12.5l5 5L20 6"
                    />
                  </svg>
                </button>


                <!-- DELETE -->

                <button
                  class="icon-btn danger"
                  title="Delete"
                  data-act="delete"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                  >
                    <path
                      d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7m2 0-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7"
                    />
                  </svg>
                </button>

              </div>

            </div>
          `;
        })
        .join("");


    /* ---------- entrance animation ---------- */

    requestAnimationFrame(() => {

      root
        .querySelectorAll(".dl-card")
        .forEach((card) => {
          card.classList.add("in");
        });
    });


    /* ==========================================================
       ACTION BUTTONS
    ========================================================== */

    root
      .querySelectorAll(".dl-card")
      .forEach((card) => {

        const id =
          card.getAttribute(
            "data-id"
          );


        /* ---------- VIEW ---------- */

        const viewButton =
          card.querySelector(
            '[data-act="view"]'
          );

        if (viewButton) {
          viewButton.addEventListener(
            "click",
            () =>
              DR.modal.openDetail(id)
          );
        }


        /* ---------- EDIT ---------- */

        const editButton =
          card.querySelector(
            '[data-act="edit"]'
          );

        if (editButton) {
          editButton.addEventListener(
            "click",
            () =>
              DR.modal.openEdit(id)
          );
        }


        /* ---------- COMPLETE ---------- */

        const completeButton =
          card.querySelector(
            '[data-act="complete"]'
          );

        if (completeButton) {

          completeButton.addEventListener(
            "click",
            () => {

              const d =
                DR.toggleComplete(id);

              if (!d) {
                return;
              }

              DR.toast(
                "safe",
                d.completed
                  ? "Task Completed"
                  : "Marked incomplete",
                d.completed
                  ? "You completed " +
                      d.title +
                      "."
                  : d.title +
                      " is back on your list."
              );

              render();

              if (
                typeof DR.renderNotifPanel ===
                "function"
              ) {
                DR.renderNotifPanel();
              }
            }
          );
        }


        /* ---------- DELETE ---------- */

        const deleteButton =
          card.querySelector(
            '[data-act="delete"]'
          );

        if (deleteButton) {

          deleteButton.addEventListener(
            "click",
            () => {

              const d =
                DR.getById(id);

              if (!d) {
                return;
              }

              if (
                confirm(
                  'Delete "' +
                    d.title +
                    '"? This can\'t be undone.'
                )
              ) {

                DR.deleteDeadline(id);

                DR.toast(
                  "info",
                  "Deadline deleted",
                  d.title +
                    " was removed."
                );

                render();

                if (
                  typeof DR.renderNotifPanel ===
                  "function"
                ) {
                  DR.renderNotifPanel();
                }
              }
            }
          );
        }

      });
  }


  /* ============================================================
     CONTROLS
  ============================================================ */

  function wireControls() {

    /* ---------- status filters ---------- */

    document
      .querySelectorAll(
        "#statusFilters .pill"
      )
      .forEach((btn) => {

        btn.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                "#statusFilters .pill"
              )
              .forEach((b) => {
                b.classList.remove(
                  "active"
                );
              });

            btn.classList.add(
              "active"
            );

            state.status =
              btn.getAttribute(
                "data-filter"
              );

            render();
          }
        );
      });


    /* ---------- category filters ---------- */

    document
      .querySelectorAll(
        "#categoryFilters .pill"
      )
      .forEach((btn) => {

        btn.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                "#categoryFilters .pill"
              )
              .forEach((b) => {
                b.classList.remove(
                  "active"
                );
              });

            btn.classList.add(
              "active"
            );

            state.category =
              btn.getAttribute(
                "data-cat"
              );

            render();
          }
        );
      });


    /* ---------- sort ---------- */

    const sortSelect =
      document.getElementById(
        "sortSelect"
      );

    if (sortSelect) {

      sortSelect.addEventListener(
        "change",
        (e) => {

          state.sort =
            e.target.value;

          render();
        }
      );
    }


    /* ---------- page search ---------- */

    const pageSearch =
      document.getElementById(
        "pageSearchInput"
      );

    if (pageSearch) {

      pageSearch.addEventListener(
        "input",
        () => {

          state.query =
            pageSearch.value;

          render();
        }
      );
    }


    /* ==========================================================
       TOPBAR SEARCH + QUERY PARAMETERS
    ========================================================== */

    const params =
      new URLSearchParams(
        window.location.search
      );

    const q =
      params.get("q");


    if (q && pageSearch) {

      pageSearch.value =
        q;

      state.query =
        q;

      const topSearchInput =
        document.getElementById(
          "topSearchInput"
        );

      if (topSearchInput) {

        topSearchInput.value =
          q;
      }
    }


    /* ---------- action=add ---------- */

    if (
      params.get("action") ===
      "add"
    ) {

      setTimeout(
        () =>
          DR.modal.openAdd(),
        300
      );
    }
  }


  /* ============================================================
     DEFAULT SORT
  ============================================================ */

  function applyDefaults() {

    const settings =
      DR.settings.get();

    const pref =
      settings.defaultSort;

    const select =
      document.getElementById(
        "sortSelect"
      );

    if (
      !select ||
      !pref
    ) {
      return;
    }

    const option =
      select.querySelector(
        'option[value="' +
          pref +
          '"]'
      );

    if (option) {

      state.sort =
        pref;

      select.value =
        pref;
    }
  }


  /* ============================================================
     BOOT
  ============================================================ */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      DR.initShell();

      DR.modal.onChange =
        render;

      applyDefaults();

      wireControls();

      /*
        Render immediately using
        currently available data.
      */

      render();


      /* ========================================================
         MONGODB DATA LOADED
      ======================================================== */

      window.addEventListener(
        "dr-mongo-loaded",
        () => {

          console.log(
            "Deadlines page refreshed with MongoDB data."
          );

          render();
        }
      );


      /* ========================================================
         DEADLINE CHANGED
      ======================================================== */

      window.addEventListener(
        "dr-deadline-changed",
        () => {

          console.log(
            "Deadlines page refreshed after deadline change."
          );

          render();
        }
      );

    }
  );

})();