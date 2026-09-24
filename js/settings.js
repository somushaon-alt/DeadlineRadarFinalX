/* ============================================================
   DEADLINE RADAR — settings.js

   Profile, appearance, notification toggles, defaults and
   data management.

   Profile data:
   - Firebase/local user data
   - MongoDB persistence

   Other settings:
   - localStorage

   Deadline data:
   - MongoDB + local browser cache
============================================================ */

(function () {
  "use strict";

  /* ============================================================
     PROFILE
  ============================================================ */

  function loadProfile() {
    const u = DR.auth.getUser() || {};

    const sName =
      document.getElementById("sName");

    const sEmail =
      document.getElementById("sEmail");

    const sDept =
      document.getElementById("sDept");

    const sSem =
      document.getElementById("sSem");

    if (sName) {
      sName.value = u.name || "";
    }

    if (sEmail) {
      sEmail.value = u.email || "";
    }

    if (sDept) {
      sDept.value = u.department || "";
    }

    if (sSem) {
      sSem.value = u.semester || "";
    }
  }


  async function saveProfile() {
    const name =
      document
        .getElementById("sName")
        .value
        .trim();

    const email =
      document
        .getElementById("sEmail")
        .value
        .trim();

    const department =
      document
        .getElementById("sDept")
        .value
        .trim();

    const semester =
      document
        .getElementById("sSem")
        .value;

    const nameOk =
      name.length >= 2;

    const emailOk =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );

    const nameField =
      document.getElementById(
        "sFieldName"
      );

    const emailField =
      document.getElementById(
        "sFieldEmail"
      );

    if (nameField) {
      nameField.classList.toggle(
        "invalid",
        !nameOk
      );
    }

    if (emailField) {
      emailField.classList.toggle(
        "invalid",
        !emailOk
      );
    }

    if (!nameOk || !emailOk) {
      DR.toast(
        "critical",
        "Check the form",
        "A name and a valid email are required."
      );

      return;
    }

    /* ---------- get Firebase user ---------- */

    const user =
      DR.auth.getUser() || {};

    const firebaseUid =
      user.uid;

    if (!firebaseUid) {
      DR.toast(
        "critical",
        "Profile error",
        "Could not find your Firebase account."
      );

      return;
    }

    /* ---------- update local user ---------- */

    DR.auth.updateUser({
      name,
      email,
      department,
      semester
    });

    /* ---------- update MongoDB ---------- */

    try {
      const response =
        await fetch(
          "https://deadlineradarfinalx.onrender.com/api/users/" +
            encodeURIComponent(
              firebaseUid
            ),
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              name,
              email,
              department,
              semester
            })
          }
        );

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch (error) {
        data = {
          message:
            text ||
            "Invalid server response."
        };
      }

      if (!response.ok) {
        console.error(
          "MongoDB profile update failed:",
          data.message
        );

        DR.toast(
          "critical",
          "Profile not saved",
          data.message ||
            "Could not update your profile."
        );

        return;
      }

      console.log(
        "Profile saved to MongoDB:",
        data.message
      );

      /* Update local copy with MongoDB result */

      if (data.user) {
        DR.auth.updateUser({
          uid:
            data.user.firebaseUid ||
            firebaseUid,

          name:
            data.user.name ||
            name,

          email:
            data.user.email ||
            email,

          department:
            data.user.department ||
            department,

          semester:
            data.user.semester ||
            semester,

          photo:
            user.photo || ""
        });
      }

      DR.toast(
        "safe",
        "Profile saved",
        "Your details have been saved to MongoDB."
      );

    } catch (error) {
      console.error(
        "Could not connect to DeadlineRadar backend:",
        error
      );

      DR.toast(
        "critical",
        "Connection error",
        "Could not connect to the DeadlineRadar backend."
      );

      return;
    }

    /* ---------- refresh sidebar ---------- */

    document
      .querySelectorAll(
        "[data-user-name]"
      )
      .forEach(
        (el) => {
          el.textContent =
            name;
        }
      );

    document
      .querySelectorAll(
        "[data-user-dept]"
      )
      .forEach(
        (el) => {
          el.textContent =
            (department ||
              "Student") +
            (semester
              ? " · " +
                semester
              : "");
        }
      );

    document
      .querySelectorAll(
        "[data-user-initial]"
      )
      .forEach(
        (el) => {
          el.textContent =
            name
              .charAt(0)
              .toUpperCase();
        }
      );

    document
      .querySelectorAll(
        "[data-user-firstname]"
      )
      .forEach(
        (el) => {
          el.textContent =
            name.split(" ")[0];
        }
      );
  }


  /* ============================================================
     APPEARANCE
  ============================================================ */

  function paintTheme(theme) {
    document
      .querySelectorAll(
        ".theme-opt"
      )
      .forEach(
        (opt) => {
          opt.classList.toggle(
            "active",
            opt.getAttribute(
              "data-theme"
            ) === theme
          );
        }
      );
  }


  function wireTheme() {
    document
      .querySelectorAll(
        ".theme-opt"
      )
      .forEach(
        (opt) => {
          opt.addEventListener(
            "click",
            () => {
              const theme =
                opt.getAttribute(
                  "data-theme"
                );

              DR.settings.save({
                theme
              });

              paintTheme(
                theme
              );

              DR.toast(
                "info",
                "Theme updated",
                "Switched to the " +
                  theme +
                  " theme."
              );
            }
          );
        }
      );
  }


  /* ============================================================
     TOGGLES
  ============================================================ */

  function wireSwitch(
    id,
    key
  ) {
    const el =
      document.getElementById(
        id
      );

    if (!el) {
      return;
    }

    const flip = () => {
      const on =
        !el.classList.contains(
          "on"
        );

      el.classList.toggle(
        "on",
        on
      );

      el.setAttribute(
        "aria-checked",
        String(on)
      );

      const patch = {};

      patch[key] =
        on;

      DR.settings.save(
        patch
      );
    };

    el.addEventListener(
      "click",
      flip
    );

    el.addEventListener(
      "keydown",
      (e) => {
        if (
          e.key === " " ||
          e.key === "Enter"
        ) {
          e.preventDefault();

          flip();
        }
      }
    );
  }


  /* ============================================================
     DEFAULTS
  ============================================================ */

  function wireDefaults() {
    const sort =
      document.getElementById(
        "sSort"
      );

    const cal =
      document.getElementById(
        "sCalView"
      );

    if (sort) {
      sort.addEventListener(
        "change",
        () => {
          DR.settings.save({
            defaultSort:
              sort.value
          });

          DR.toast(
            "info",
            "Default saved",
            "Deadlines will sort by " +
              sort.options[
                sort.selectedIndex
              ].text.toLowerCase() +
              "."
          );
        }
      );
    }

    if (cal) {
      cal.addEventListener(
        "change",
        () => {
          DR.settings.save({
            defaultCalView:
              cal.value
          });

          DR.toast(
            "info",
            "Calendar default saved",
            "Your default calendar view has been updated."
          );
        }
      );
    }
  }


  /* ============================================================
     DATA MANAGEMENT
  ============================================================ */

  function exportData() {
    const payload = {
      exported:
        new Date().toISOString(),

      user:
        DR.auth.getUser(),

      deadlines:
        DR.getDeadlines()
    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            payload,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      "deadline-radar-backup.json";

    document.body.appendChild(
      a
    );

    a.click();

    a.remove();

    setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );

    DR.toast(
      "safe",
      "Export ready",
      "Your deadlines were saved as a JSON file."
    );
  }


  function updateStorageLine() {
    const n =
      DR.getDeadlines()
        .length;

    const storageLine =
      document.getElementById(
        "storageLine"
      );

    if (!storageLine) {
      return;
    }

    storageLine.textContent =
      n +
      (n === 1
        ? " deadline"
        : " deadlines") +
      " stored in this browser.";
  }


  /* ============================================================
     CLEAR ALL DEADLINES
  ============================================================ */

  async function clearAllDeadlines() {
    const user =
      DR.auth.getUser() || {};

    const firebaseUid =
      user.uid;

    if (!firebaseUid) {
      DR.toast(
        "critical",
        "Delete failed",
        "Could not find your Firebase account."
      );

      return;
    }

    try {
      const response =
        await fetch(
          "https://deadlineradarfinalx.onrender.com/api/deadlines/user/" +
            encodeURIComponent(
              firebaseUid
            ),
          {
            method: "DELETE"
          }
        );

      const text =
        await response.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch (error) {
        data = {
          message:
            text ||
            "Invalid server response."
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not delete deadlines."
        );
      }

      /* ---------- clear browser copy ---------- */

      DR.saveDeadlines([]);

      updateStorageLine();

      /* ---------- notify other pages ---------- */

      window.dispatchEvent(
        new Event(
          "dr-deadline-changed"
        )
      );

      console.log(
        "MongoDB deadlines deleted:",
        data.deletedCount
      );

      DR.toast(
        "safe",
        "All deadlines deleted",
        (data.deletedCount || 0) +
          " deadline(s) were removed from MongoDB."
      );

    } catch (error) {
      console.error(
        "Could not delete deadlines from MongoDB:",
        error
      );

      DR.toast(
        "critical",
        "Delete failed",
        error.message ||
          "Could not connect to the DeadlineRadar backend."
      );

      throw error;
    }
  }


  /* ============================================================
     RESTORE DEMO DEADLINES
  ============================================================ */

  async function restoreDemoDeadlines() {
    if (
      typeof DR.restoreSeedDataToMongo !==
      "function"
    ) {
      throw new Error(
        "Restore Demo function is missing from app.js."
      );
    }

    return await DR.restoreSeedDataToMongo();
  }


  /* ============================================================
     WIRE DATA BUTTONS
  ============================================================ */

  function wireData() {
    const exportBtn =
      document.getElementById(
        "exportBtn"
      );

    const restoreDemoBtn =
      document.getElementById(
        "restoreDemoBtn"
      );

    const clearAllBtn =
      document.getElementById(
        "clearAllBtn"
      );


    /* ---------- EXPORT ---------- */

    if (exportBtn) {
      exportBtn.addEventListener(
        "click",
        exportData
      );
    }


    /* ---------- RESTORE DEMO ---------- */

    if (restoreDemoBtn) {
      restoreDemoBtn.addEventListener(
        "click",
        async () => {

          if (
            !confirm(
              "Replace your current deadlines with the sample set?"
            )
          ) {
            return;
          }

          const originalText =
            restoreDemoBtn.textContent;

          restoreDemoBtn.disabled =
            true;

          restoreDemoBtn.textContent =
            "Restoring...";

          try {
            const restored =
              await restoreDemoDeadlines();

            updateStorageLine();

            DR.toast(
              "safe",
              "Sample deadlines restored",
              restored.length +
                " demo deadlines were saved to MongoDB."
            );

          } catch (error) {
            console.error(
              "Restore Demo failed:",
              error
            );

            DR.toast(
              "critical",
              "Restore failed",
              error.message ||
                "Could not restore demo deadlines to MongoDB."
            );

          } finally {
            restoreDemoBtn.disabled =
              false;

            restoreDemoBtn.textContent =
              originalText;
          }
        }
      );
    }


    /* ---------- CLEAR ALL ---------- */

    if (clearAllBtn) {
      clearAllBtn.addEventListener(
        "click",
        async () => {

          if (
            !confirm(
              "Delete every deadline? This can't be undone."
            )
          ) {
            return;
          }

          const originalText =
            clearAllBtn.textContent;

          clearAllBtn.disabled =
            true;

          clearAllBtn.textContent =
            "Deleting...";

          try {
            await clearAllDeadlines();

          } catch (error) {
            /*
              clearAllDeadlines already
              displays the error toast.
            */

          } finally {
            clearAllBtn.disabled =
              false;

            clearAllBtn.textContent =
              originalText;
          }
        }
      );
    }
  }


  /* ============================================================
     BOOT
  ============================================================ */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      /* Initialize shared DeadlineRadar shell */

      DR.initShell();

      const s =
        DR.settings.get();

      /* Load profile */

      loadProfile();

      /* Apply theme */

      paintTheme(
        s.theme
      );


      /* ---------- notification toggles ---------- */

      const swReminders =
        document.getElementById(
          "swReminders"
        );

      const swEmail =
        document.getElementById(
          "swEmail"
        );

      if (swReminders) {
        swReminders.classList.toggle(
          "on",
          !!s.reminders
        );

        swReminders.setAttribute(
          "aria-checked",
          String(
            !!s.reminders
          )
        );
      }

      if (swEmail) {
        swEmail.classList.toggle(
          "on",
          !!s.emailNotifs
        );

        swEmail.setAttribute(
          "aria-checked",
          String(
            !!s.emailNotifs
          )
        );
      }


      /* ---------- default values ---------- */

      const sSort =
        document.getElementById(
          "sSort"
        );

      const sCalView =
        document.getElementById(
          "sCalView"
        );

      if (sSort) {
        sSort.value =
          s.defaultSort;
      }

      if (sCalView) {
        sCalView.value =
          s.defaultCalView;
      }


      /* ---------- profile button ---------- */

      const saveProfileBtn =
        document.getElementById(
          "saveProfileBtn"
        );

      if (saveProfileBtn) {
        saveProfileBtn.addEventListener(
          "click",
          saveProfile
        );
      }


      /* ---------- wire settings ---------- */

      wireTheme();

      wireSwitch(
        "swReminders",
        "reminders"
      );

      wireSwitch(
        "swEmail",
        "emailNotifs"
      );

      wireDefaults();

      wireData();

      updateStorageLine();


      /* ---------- refresh after MongoDB loads ---------- */

      window.addEventListener(
        "dr-mongo-loaded",
        () => {

          loadProfile();

          updateStorageLine();

          /*
            Re-read settings in case
            another page changed them.
          */

          const currentSettings =
            DR.settings.get();

          paintTheme(
            currentSettings.theme
          );

          console.log(
            "Settings refreshed with MongoDB data."
          );
        }
      );


      /* ---------- refresh after deadline changes ---------- */

      window.addEventListener(
        "dr-deadline-changed",
        () => {
          updateStorageLine();
        }
      );

    }
  );

})();