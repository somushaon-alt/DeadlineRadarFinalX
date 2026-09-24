/* ============================================================
   DEADLINE RADAR — app.js
   Core data layer + shared UI wiring used on every page.
   Firebase user + MongoDB deadline integration.
============================================================ */

const DR = (function () {
  "use strict";

  const KEYS = {
    deadlines: "dr_deadlines_v1",
    user: "dr_user_v1",
    session: "dr_session_v1",
    settings: "dr_settings_v1",
    notifSeen: "dr_notifs_seen_v1",
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  function uid() {
    return (
      "d_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function isoAt(dayOffset, hour, min) {
    const d = new Date();

    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, min, 0, 0);

    return d.toISOString();
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return fallback;
      }

      return JSON.parse(raw);
    } catch (error) {
      console.error("Could not read localStorage:", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.error(
        "Deadline Radar: storage failed",
        error
      );

      return false;
    }
  }

  /* =========================================================
     SEED DATA
  ========================================================= */

  function seedDeadlines() {
    return [
      {
        id: uid(),
        title: "Java Assignment",
        course: "Object Oriented Programming",
        type: "Assignment",
        due: isoAt(1, 23, 59),
        priority: "High",
        progress: 80,
        completed: false,
        description:
          "Complete the inheritance and polymorphism exercises from chapter 7.",
      },

      {
        id: uid(),
        title: "Calculus CT",
        course: "Mathematics",
        type: "Class Test",
        due: isoAt(4, 10, 0),
        priority: "High",
        progress: 30,
        completed: false,
        description:
          "Covers integration by parts and improper integrals.",
      },

      {
        id: uid(),
        title: "Internet Programming Project",
        course: "Internet Programming",
        type: "Project",
        due: isoAt(10, 23, 59),
        priority: "Medium",
        progress: 60,
        completed: false,
        description:
          "Full-stack web project: build and deploy a small CRUD application.",
      },

      {
        id: uid(),
        title: "Physics Lab Report",
        course: "Physics",
        type: "Lab Report",
        due: isoAt(13, 17, 0),
        priority: "Low",
        progress: 20,
        completed: false,
        description:
          "Write up the pendulum motion experiment with error analysis.",
      },

      {
        id: uid(),
        title: "Data Structures Quiz",
        course: "Data Structures",
        type: "Quiz",
        due: isoAt(-2, 9, 0),
        priority: "Medium",
        progress: 40,
        completed: false,
        description:
          "Short quiz on balanced trees and heaps.",
      },

      {
        id: uid(),
        title: "Database Presentation",
        course: "DBMS",
        type: "Presentation",
        due: isoAt(6, 14, 0),
        priority: "Medium",
        progress: 50,
        completed: false,
        description:
          "Present the normalization case study to the class.",
      },

      {
        id: uid(),
        title: "English Essay",
        course: "English",
        type: "Assignment",
        due: isoAt(-9, 23, 59),
        priority: "Low",
        progress: 100,
        completed: true,
        description:
          "Comparative essay on two assigned short stories.",
      },

      {
        id: uid(),
        title: "Algorithms Midterm",
        course: "Algorithms",
        type: "Midterm",
        due: isoAt(-14, 10, 0),
        priority: "High",
        progress: 100,
        completed: true,
        description:
          "Covered greedy algorithms, dynamic programming and graphs.",
      },

      {
        id: uid(),
        title: "Software Engineering Report",
        course: "Software Engineering",
        type: "Lab Report",
        due: isoAt(-6, 23, 59),
        priority: "Medium",
        progress: 100,
        completed: true,
        description:
          "Sprint retrospective and architecture write-up.",
      },

      {
        id: uid(),
        title: "Digital Logic Quiz",
        course: "Digital Logic",
        type: "Quiz",
        due: isoAt(-11, 9, 0),
        priority: "Low",
        progress: 100,
        completed: true,
        description:
          "Karnaugh maps and combinational circuits.",
      },

      {
        id: uid(),
        title: "Statistics Assignment",
        course: "Statistics",
        type: "Assignment",
        due: isoAt(-4, 23, 59),
        priority: "Medium",
        progress: 100,
        completed: true,
        description:
          "Problem set on hypothesis testing.",
      },

      {
        id: uid(),
        title: "Chemistry Lab Report",
        course: "Chemistry",
        type: "Lab Report",
        due: isoAt(-18, 23, 59),
        priority: "Low",
        progress: 100,
        completed: true,
        description:
          "Titration experiment write-up.",
      },

      {
        id: uid(),
        title: "History Presentation",
        course: "History",
        type: "Presentation",
        due: isoAt(-22, 23, 59),
        priority: "Low",
        progress: 100,
        completed: true,
        description:
          "Group presentation on post-war economic policy.",
      },
    ];
  }

  /* =========================================================
     MONGODB API
  ========================================================= */

 const API_BASE = "https://deadlineradarfinalx.onrender.com/api";

  async function readApiResponse(response) {
    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      data = {
        message:
          text || "Invalid server response.",
      };
    }

    return data;
  }

  /* =========================================================
     FIREBASE USER INFORMATION
  ========================================================= */

  function getFirebaseUser() {
    try {
      if (
        typeof firebase !== "undefined" &&
        firebase.auth
      ) {
        return firebase.auth().currentUser || null;
      }
    } catch (error) {
      console.error(
        "Could not get Firebase user:",
        error
      );
    }

    return null;
  }

  function getFirebaseUid() {
    const firebaseUser = getFirebaseUser();

    if (firebaseUser && firebaseUser.uid) {
      return firebaseUser.uid;
    }

    /*
      Fallback only if your local user object already
      contains a Firebase UID.
    */
    const localUser =
      auth && auth.getUser
        ? auth.getUser()
        : null;

    if (localUser && localUser.firebaseUid) {
      return localUser.firebaseUid;
    }

    if (localUser && localUser.uid) {
      return localUser.uid;
    }

    return null;
  }

  function getCurrentUserInfo() {
    const firebaseUser = getFirebaseUser();
    const localUser = auth.getUser() || {};

    /*
      Firebase is the source of truth for identity.
      LocalStorage is used as fallback for department,
      semester and other app-specific information.
    */

    const firebaseUid =
      firebaseUser && firebaseUser.uid
        ? firebaseUser.uid
        : localUser.firebaseUid ||
          localUser.uid ||
          null;

    const userName =
      firebaseUser &&
      firebaseUser.displayName
        ? firebaseUser.displayName
        : localUser.name || "";

    const userEmail =
      firebaseUser &&
      firebaseUser.email
        ? firebaseUser.email
        : localUser.email || "";

    return {
      firebaseUid,
      userName,
      userEmail,
    };
  }

  /*
    Keep localStorage user information synchronized
    with the currently logged-in Firebase user.
  */
  function syncFirebaseUserToLocal() {
    const firebaseUser = getFirebaseUser();

    if (!firebaseUser) {
      return auth.getUser();
    }

    const existingUser =
      auth.getUser() || {};

    const syncedUser = {
      ...existingUser,

      firebaseUid:
        firebaseUser.uid ||
        existingUser.firebaseUid ||
        "",

      uid:
        firebaseUser.uid ||
        existingUser.uid ||
        "",

      name:
        firebaseUser.displayName ||
        existingUser.name ||
        "Student",

      email:
        firebaseUser.email ||
        existingUser.email ||
        "",
    };

    auth.updateUser(syncedUser);

    localStorage.setItem(
      KEYS.session,
      "true"
    );

    console.log(
      "Firebase user synchronized:",
      syncedUser
    );

    return syncedUser;
  }

  /* =========================================================
     LOAD DEADLINES FROM MONGODB
  ========================================================= */

  async function loadDeadlinesFromMongo() {
    const userInfo =
      getCurrentUserInfo();

    const firebaseUid =
      userInfo.firebaseUid;

    if (!firebaseUid) {
      console.warn(
        "No Firebase user found. Using local deadlines."
      );

      return false;
    }

    try {
      console.log(
        "Loading MongoDB deadlines for Firebase UID:",
        firebaseUid
      );

      const response =
        await fetch(
          `${API_BASE}/deadlines/${encodeURIComponent(
            firebaseUid
          )}`
        );

      const mongoDeadlines =
        await readApiResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          mongoDeadlines.message ||
            `HTTP ${response.status}`
        );
      }

      if (
        !Array.isArray(
          mongoDeadlines
        )
      ) {
        throw new Error(
          "Invalid deadlines response from server."
        );
      }

      const converted =
        mongoDeadlines.map(
          (d) => ({
            id: d._id,

            title:
              d.title || "",

            course:
              d.course || "",

            type:
              d.type ||
              "Assignment",

            due:
              d.due ||
              d.dueDate,

            priority:
              d.priority ||
              "Medium",

            progress:
              Number(
                d.progress ?? 0
              ),

            completed:
              !!d.completed,

            description:
              d.description ||
              "",

            /*
              Keep user information locally too.
              This is useful if you want to display
              who created a deadline later.
            */
            firebaseUid:
              d.firebaseUid ||
              firebaseUid,

            userName:
              d.userName ||
              userInfo.userName ||
              "",

            userEmail:
              d.userEmail ||
              userInfo.userEmail ||
              "",

            createdAt:
              d.createdAt
                ? new Date(
                    d.createdAt
                  ).getTime()
                : Date.now(),
          })
        );

      writeJSON(
        KEYS.deadlines,
        converted
      );

      console.log(
        "Deadlines loaded from MongoDB:",
        converted.length
      );

      return true;
    } catch (error) {
      console.error(
        "Could not load deadlines from MongoDB:",
        error
      );

      return false;
    }
  }

  /* =========================================================
     CREATE DEADLINE IN MONGODB
  ========================================================= */

  async function createDeadlineInMongo(
    data
  ) {
    /*
      IMPORTANT:
      Get the actual Firebase user here.
      This makes sure the deadline is connected
      to the correct user.
    */
    const userInfo =
      getCurrentUserInfo();

    const firebaseUid =
      userInfo.firebaseUid;

    if (!firebaseUid) {
      throw new Error(
        "No logged-in Firebase user. Please sign in with Google first."
      );
    }

    if (
      !data ||
      !data.title ||
      !data.due
    ) {
      throw new Error(
        "Deadline title and due date are required."
      );
    }

    /*
      This is the important part.

      MongoDB will receive:

      firebaseUid
      userName
      userEmail
      title
      course
      type
      description
      due
      priority
      progress
      completed
    */

    const payload = {
      firebaseUid:

        firebaseUid,

      userName:
        userInfo.userName || "",

      userEmail:
        userInfo.userEmail || "",

      title:
        data.title,

      course:
        data.course || "",

      type:
        data.type ||
        "Assignment",

      description:
        data.description ||
        "",

      due:
        data.due,

      priority:
        data.priority ||
        "Medium",

      progress:
        Number(
          data.progress ?? 0
        ),

      completed:
        !!data.completed,
    };

    console.log(
      "========================================"
    );

    console.log(
      "SENDING DEADLINE TO MONGODB"
    );

    console.log(
      "Firebase UID:",
      payload.firebaseUid
    );

    console.log(
      "User Name:",
      payload.userName
    );

    console.log(
      "User Email:",
      payload.userEmail
    );

    console.log(
      "Deadline:",
      payload.title
    );

    console.log(
      "Full payload:",
      payload
    );

    console.log(
      "========================================"
    );

    const response =
      await fetch(
        `${API_BASE}/deadlines`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const result =
      await readApiResponse(
        response
      );

    console.log(
      "MongoDB server response:",
      result
    );

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to save deadline."
      );
    }

    if (!result.deadline) {
      throw new Error(
        "Server did not return the saved deadline."
      );
    }

    return result.deadline;
  }

  /* =========================================================
     UPDATE DEADLINE IN MONGODB
  ========================================================= */

  async function updateDeadlineInMongo(
    id,
    patch
  ) {
    const userInfo =
      getCurrentUserInfo();

    const firebaseUid =
      userInfo.firebaseUid;

    if (!firebaseUid) {
      throw new Error(
        "No logged-in Firebase user."
      );
    }

    const updateData = {
      firebaseUid,
      ...patch,
    };

    if (patch.due) {
      updateData.due =
        patch.due;
    }

    const response =
      await fetch(
        `${API_BASE}/deadlines/${encodeURIComponent(
          id
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              updateData
            ),
        }
      );

    const result =
      await readApiResponse(
        response
      );

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to update deadline."
      );
    }

    return result.deadline;
  }

  /* =========================================================
     DELETE DEADLINE FROM MONGODB
  ========================================================= */

  async function deleteDeadlineFromMongo(
    id
  ) {
    const firebaseUid =
      getFirebaseUid();

    if (!firebaseUid) {
      throw new Error(
        "No logged-in Firebase user."
      );
    }

    const response =
      await fetch(
        `${API_BASE}/deadlines/${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              firebaseUid,
            }),
        }
      );

    const result =
      await readApiResponse(
        response
      );

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to delete deadline."
      );
    }

    return result;
  }

  /* =========================================================
     DEADLINE CRUD
  ========================================================= */

  function getDeadlines() {
    let list =
      readJSON(
        KEYS.deadlines,
        null
      );

    if (!list) {
      list =
        seedDeadlines();

      writeJSON(
        KEYS.deadlines,
        list
      );
    }

    return list;
  }

  function saveDeadlines(
    list
  ) {
    writeJSON(
      KEYS.deadlines,
      list
    );
  }

  /* =========================================================
     ADD DEADLINE
  ========================================================= */

  function addDeadline(
    data
  ) {
    const list =
      getDeadlines();

    const userInfo =
      getCurrentUserInfo();

    const item =
      Object.assign(
        {
          id: uid(),

          completed:
            false,

          progress:
            0,

          priority:
            "Medium",

          description:
            "",

          firebaseUid:
            userInfo.firebaseUid ||
            "",

          userName:
            userInfo.userName ||
            "",

          userEmail:
            userInfo.userEmail ||
            "",
        },

        data
      );

    list.push(item);

    saveDeadlines(
      list
    );

    /*
      Save to MongoDB.
      This runs in the background so the UI
      remains responsive.
    */
    createDeadlineInMongo(
      item
    )
      .then(
        (
          mongoDeadline
        ) => {
          const updatedList =
            getDeadlines().map(
              (d) =>
                d.id ===
                item.id
                  ? {
                      ...d,

                      id:
                        mongoDeadline._id,

                      firebaseUid:
                        mongoDeadline.firebaseUid ||
                        item.firebaseUid,

                      userName:
                        mongoDeadline.userName ||
                        item.userName,

                      userEmail:
                        mongoDeadline.userEmail ||
                        item.userEmail,

                      createdAt:
                        mongoDeadline.createdAt
                          ? new Date(
                              mongoDeadline.createdAt
                            ).getTime()
                          : Date.now(),
                    }
                  : d
            );

          saveDeadlines(
            updatedList
          );

          console.log(
            "========================================"
          );

          console.log(
            "DEADLINE SAVED TO MONGODB SUCCESSFULLY"
          );

          console.log(
            "MongoDB ID:",
            mongoDeadline._id
          );

          console.log(
            "User:",
            mongoDeadline.userName
          );

          console.log(
            "Email:",
            mongoDeadline.userEmail
          );

          console.log(
            "Deadline:",
            mongoDeadline.title
          );

          console.log(
            "========================================"
          );

          window.dispatchEvent(
            new Event(
              "dr-deadline-changed"
            )
          );
        }
      )
      .catch(
        (error) => {
          console.error(
            "MongoDB deadline save failed:",
            error
          );

          toast(
            "critical",
            "Database Error",
            error.message ||
              "The deadline could not be saved to MongoDB."
          );
        }
      );

    return item;
  }

  /* =========================================================
     UPDATE DEADLINE
  ========================================================= */

  function updateDeadline(
    id,
    patch
  ) {
    const list =
      getDeadlines();

    const idx =
      list.findIndex(
        (d) =>
          d.id === id
      );

    if (idx === -1) {
      return null;
    }

    list[idx] =
      Object.assign(
        {},
        list[idx],
        patch
      );

    saveDeadlines(
      list
    );

    updateDeadlineInMongo(
      id,
      patch
    )
      .then(
        (
          mongoDeadline
        ) => {
          console.log(
            "Deadline updated in MongoDB:",
            mongoDeadline.title
          );

          window.dispatchEvent(
            new Event(
              "dr-deadline-changed"
            )
          );
        }
      )
      .catch(
        (error) => {
          console.error(
            "MongoDB deadline update failed:",
            error
          );
        }
      );

    return list[idx];
  }

  /* =========================================================
     DELETE DEADLINE
  ========================================================= */

  function deleteDeadline(
    id
  ) {
    const list =
      getDeadlines().filter(
        (d) =>
          d.id !== id
      );

    saveDeadlines(
      list
    );

    deleteDeadlineFromMongo(
      id
    )
      .then(() => {
        console.log(
          "Deadline deleted from MongoDB:",
          id
        );

        window.dispatchEvent(
          new Event(
            "dr-deadline-changed"
          )
        );
      })
      .catch(
        (error) => {
          console.error(
            "MongoDB deadline delete failed:",
            error
          );
        }
      );
  }

  /* =========================================================
     TOGGLE COMPLETE
  ========================================================= */

  function toggleComplete(
    id
  ) {
    const list =
      getDeadlines();

    const idx =
      list.findIndex(
        (d) =>
          d.id === id
      );

    if (idx === -1) {
      return null;
    }

    list[idx].completed =
      !list[idx]
        .completed;

    if (
      list[idx].completed
    ) {
      list[idx].progress =
        100;
    }

    saveDeadlines(
      list
    );

    updateDeadlineInMongo(
      id,
      {
        completed:
          list[idx]
            .completed,

        progress:
          list[idx]
            .progress,
      }
    )
      .then(() => {
        console.log(
          "Completion status updated in MongoDB."
        );

        window.dispatchEvent(
          new Event(
            "dr-deadline-changed"
          )
        );
      })
      .catch(
        (error) => {
          console.error(
            "MongoDB completion update failed:",
            error
          );
        }
      );

    return list[idx];
  }

  function getById(
    id
  ) {
    return (
      getDeadlines().find(
        (d) =>
          d.id === id
      ) || null
    );
  }

  /* =========================================================
     LOCAL RESET
  ========================================================= */

  function resetSeedData() {
    writeJSON(
      KEYS.deadlines,
      seedDeadlines()
    );
  }

  /* =========================================================
     RESTORE DEMO DATA TO MONGODB
  ========================================================= */

  async function restoreSeedDataToMongo() {
    const firebaseUid =
      getFirebaseUid();

    if (!firebaseUid) {
      throw new Error(
        "No logged-in Firebase user."
      );
    }

    const deleteResponse =
      await fetch(
        `${API_BASE}/deadlines/user/${encodeURIComponent(
          firebaseUid
        )}`,
        {
          method: "DELETE",
        }
      );

    const deleteResult =
      await readApiResponse(
        deleteResponse
      );

    if (!deleteResponse.ok) {
      throw new Error(
        deleteResult.message ||
          "Could not clear existing deadlines."
      );
    }

    const demoDeadlines =
      seedDeadlines();

    const savedDeadlines =
      [];

    for (
      const demo of
        demoDeadlines
    ) {
      const mongoDeadline =
        await createDeadlineInMongo(
          demo
        );

      savedDeadlines.push({
        id:
          mongoDeadline._id,

        title:
          mongoDeadline.title,

        course:
          mongoDeadline.course ||
          "",

        type:
          mongoDeadline.type ||
          "Assignment",

        description:
          mongoDeadline.description ||
          "",

        due:
          mongoDeadline.due ||
          mongoDeadline.dueDate,

        priority:
          mongoDeadline.priority ||
          "Medium",

        progress:
          Number(
            mongoDeadline.progress ??
              0
          ),

        completed:
          !!mongoDeadline.completed,

        firebaseUid:
          mongoDeadline.firebaseUid ||
          firebaseUid,

        userName:
          mongoDeadline.userName ||
          "",

        userEmail:
          mongoDeadline.userEmail ||
          "",

        createdAt:
          mongoDeadline.createdAt
            ? new Date(
                mongoDeadline.createdAt
              ).getTime()
            : Date.now(),
      });
    }

    writeJSON(
      KEYS.deadlines,
      savedDeadlines
    );

    window.dispatchEvent(
      new Event(
        "dr-mongo-loaded"
      )
    );

    window.dispatchEvent(
      new Event(
        "dr-deadline-changed"
      )
    );

    console.log(
      "Demo deadlines restored to MongoDB:",
      savedDeadlines.length
    );

    return savedDeadlines;
  }

  /* =========================================================
     URGENCY ENGINE
  ========================================================= */

  function getStatus(
    d
  ) {
    if (d.completed) {
      return "completed";
    }

    const diff =
      new Date(
        d.due
      ).getTime() -
      Date.now();

    if (diff < 0) {
      return "overdue";
    }

    const days =
      diff / 86400000;

    if (days <= 2) {
      return "critical";
    }

    if (days <= 7) {
      return "upcoming";
    }

    return "safe";
  }

  function statusLabel(
    status
  ) {
    return (
      {
        critical:
          "Critical",

        upcoming:
          "Upcoming",

        safe:
          "Safe",

        overdue:
          "Overdue",

        completed:
          "Completed",
      }[status] ||
      status
    );
  }

  function remainingLabel(
    d
  ) {
    if (d.completed) {
      return "Completed";
    }

    const diff =
      new Date(
        d.due
      ).getTime() -
      Date.now();

    if (diff <= 0) {
      const days =
        Math.floor(
          Math.abs(diff) /
            86400000
        );

      return days <= 0
        ? "Overdue today"
        : days +
            (days === 1
              ? " day overdue"
              : " days overdue");
    }

    const days =
      Math.floor(
        diff /
          86400000
      );

    const hours =
      Math.floor(
        (diff %
          86400000) /
          3600000
      );

    if (days === 0) {
      return hours <= 1
        ? "Due within the hour"
        : "Due today";
    }

    if (days === 1) {
      return "Due tomorrow";
    }

    return (
      days +
      " days remaining"
    );
  }

  function countdownString(
    d
  ) {
    if (d.completed) {
      return "DONE";
    }

    const diff =
      new Date(
        d.due
      ).getTime() -
      Date.now();

    if (diff <= 0) {
      return "OVERDUE";
    }

    const days =
      Math.floor(
        diff /
          86400000
      );

    const hours =
      Math.floor(
        (diff %
          86400000) /
          3600000
      );

    const mins =
      Math.floor(
        (diff %
          3600000) /
          60000
      );

    const secs =
      Math.floor(
        (diff %
          60000) /
          1000
      );

    if (days > 0) {
      return (
        days +
        "d " +
        pad(hours) +
        "h " +
        pad(mins) +
        "m"
      );
    }

    return (
      pad(hours) +
      "h " +
      pad(mins) +
      "m " +
      pad(secs) +
      "s"
    );
  }

  function pad(n) {
    return n < 10
      ? "0" + n
      : "" + n;
  }

  function fmtDate(
    iso,
    withTime
  ) {
    const d =
      new Date(iso);

    const opts = {
      year:
        "numeric",
      month:
        "long",
      day:
        "numeric",
    };

    let out =
      d.toLocaleDateString(
        "en-US",
        opts
      );

    if (withTime) {
      out +=
        " — " +
        d.toLocaleTimeString(
          "en-US",
          {
            hour:
              "numeric",
            minute:
              "2-digit",
          }
        );
    }

    return out;
  }

  function computeStats(
    list
  ) {
    list =
      list ||
      getDeadlines();

    const total =
      list.length;

    let completed = 0;
    let overdue = 0;
    let pending = 0;

    list.forEach(
      (d) => {
        const s =
          getStatus(d);

        if (
          s ===
          "completed"
        ) {
          completed++;
        } else if (
          s ===
          "overdue"
        ) {
          overdue++;
        } else {
          pending++;
        }
      }
    );

    return {
      total,
      completed,
      overdue,
      pending,
    };
  }

  /* =========================================================
     AUTH
  ========================================================= */

  const auth = {
    register(data) {
      writeJSON(
        KEYS.user,
        data
      );

      localStorage.setItem(
        KEYS.session,
        "true"
      );
    },

    login(
      email,
      password
    ) {
      const user =
        auth.getUser();

      if (user) {
        if (
          user.email &&
          user.email
            .toLowerCase() ===
            email.toLowerCase()
        ) {
          localStorage.setItem(
            KEYS.session,
            "true"
          );

          return true;
        }

        return false;
      }

      writeJSON(
        KEYS.user,
        {
          name:
            email
              .split("@")[0]
              .replace(
                /[._]/g,
                " "
              ),

          email,

          department:
            "CSE",

          semester:
            "N/A",
        }
      );

      localStorage.setItem(
        KEYS.session,
        "true"
      );

      return true;
    },

    logout() {
      localStorage.removeItem(
        KEYS.session
      );

      try {
        if (
          typeof firebase !==
            "undefined" &&
          firebase.auth &&
          firebase
            .auth()
            .currentUser
        ) {
          return firebase
            .auth()
            .signOut();
        }
      } catch (error) {
        console.error(
          "Firebase logout failed:",
          error
        );
      }
    },

    isLoggedIn() {
      return (
        localStorage.getItem(
          KEYS.session
        ) === "true"
      );
    },

    getUser() {
      return readJSON(
        KEYS.user,
        null
      );
    },

    updateUser(patch) {
      const u =
        auth.getUser() ||
        {};

      const merged =
        Object.assign(
          {},
          u,
          patch
        );

      writeJSON(
        KEYS.user,
        merged
      );

      return merged;
    },

    requireLogin() {
      if (
        !auth.isLoggedIn()
      ) {
        if (
          !auth.getUser()
        ) {
          auth.updateUser({
            name:
              "Shaon Somu",

            email:
              "shaon@university.edu",

            department:
              "CSE",

            semester:
              "6th Semester",
          });
        }

        localStorage.setItem(
          KEYS.session,
          "true"
        );
      }

      /*
        If Firebase is already ready, synchronize
        the real Firebase account.
      */
      syncFirebaseUserToLocal();
    },
  };

  /* =========================================================
     SETTINGS
  ========================================================= */

  const defaultSettings = {
    theme:
      "dark",

    reminders:
      true,

    emailNotifs:
      false,

    defaultSort:
      "nearest",

    defaultCalView:
      "month",
  };

  const settings = {
    get() {
      return Object.assign(
        {},
        defaultSettings,
        readJSON(
          KEYS.settings,
          {}
        )
      );
    },

    save(patch) {
      const merged =
        Object.assign(
          {},
          settings.get(),
          patch
        );

      writeJSON(
        KEYS.settings,
        merged
      );

      settings.apply(
        merged
      );

      return merged;
    },

    apply(s) {
      s =
        s ||
        settings.get();

      document.body.classList.toggle(
        "light-mode",
        s.theme ===
          "light"
      );
    },
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  function buildNotifications() {
    const list =
      getDeadlines();

    const notifs = [];

    list.forEach(
      (d) => {
        const status =
          getStatus(d);

        if (d.completed) {
          return;
        }

        if (
          status ===
          "critical"
        ) {
          notifs.push({
            id:
              d.id +
              "_critical",

            type:
              "critical",

            title:
              remainingLabel(
                d
              ).includes(
                "tomorrow"
              )
                ? "Deadline Tomorrow"
                : "Deadline Approaching",

            body:
              d.title +
              " is " +
              remainingLabel(
                d
              ).toLowerCase() +
              ".",

            time:
              d.due,
          });
        } else if (
          status ===
          "upcoming"
        ) {
          notifs.push({
            id:
              d.id +
              "_upcoming",

            type:
              "upcoming",

            title:
              "Upcoming Deadline",

            body:
              d.title +
              " is due in " +
              remainingLabel(
                d
              ).replace(
                "days remaining",
                "days"
              ) +
              ".",

            time:
              d.due,
          });
        } else if (
          status ===
          "overdue"
        ) {
          notifs.push({
            id:
              d.id +
              "_overdue",

            type:
              "critical",

            title:
              "Overdue",

            body:
              d.title +
              " is " +
              remainingLabel(
                d
              ).toLowerCase() +
              ".",

            time:
              d.due,
          });
        }
      }
    );

    notifs.sort(
      (a, b) =>
        new Date(a.time) -
        new Date(b.time)
    );

    return notifs;
  }

  function timeAgoLabel(
    iso
  ) {
    const diff =
      Date.now() -
      new Date(
        iso
      ).getTime();

    const days =
      Math.round(
        diff /
          86400000
      );

    if (days === 0) {
      return "today";
    }

    if (days > 0) {
      return (
        days +
        "d ago"
      );
    }

    return (
      "in " +
      Math.abs(days) +
      "d"
    );
  }

  function renderNotifPanel() {
    const panel =
      document.getElementById(
        "notifPanel"
      );

    const badge =
      document.getElementById(
        "bellBadge"
      );

    if (!panel) {
      return;
    }

    const notifs =
      buildNotifications();

    if (badge) {
      badge.style.display =
        notifs.length
          ? "block"
          : "none";
    }

    if (!notifs.length) {
      panel.innerHTML =
        '<div class="notif-item"><div class="n-title">You\'re all caught up 🎉</div><div class="n-body">No urgent notifications right now.</div></div>';

      return;
    }

    panel.innerHTML =
      notifs
        .slice(0, 8)
        .map(
          (n) => `
      <div class="notif-item">
        <div class="n-title">${escapeHTML(
          n.title
        )}</div>

        <div class="n-body">${escapeHTML(
          n.body
        )}</div>

        <div class="n-time">${timeAgoLabel(
          n.time
        )}</div>
      </div>
    `
        )
        .join("");
  }

  function toast(
    type,
    title,
    body,
    timeout
  ) {
    const stack =
      document.getElementById(
        "toastStack"
      );

    if (!stack) {
      return;
    }

    const icons = {
      critical:
        "⚠",

      upcoming:
        "⏳",

      safe:
        "✓",

      info:
        "ℹ",
    };

    const el =
      document.createElement(
        "div"
      );

    el.className =
      "toast " +
      (type || "info");

    el.innerHTML = `
      <div class="t-ico">${
        icons[type] ||
        icons.info
      }</div>

      <div style="flex:1">
        <div class="t-title">${escapeHTML(
          title
        )}</div>

        <div class="t-body">${escapeHTML(
          body
        )}</div>
      </div>

      <div class="t-close"
           role="button"
           aria-label="Dismiss">
        ✕
      </div>
    `;

    stack.appendChild(
      el
    );

    el.querySelector(
      ".t-close"
    ).addEventListener(
      "click",
      () => el.remove()
    );

    setTimeout(
      () => {
        el.style.transition =
          "opacity .4s ease, transform .4s ease";

        el.style.opacity =
          "0";

        el.style.transform =
          "translateX(120%)";

        setTimeout(
          () =>
            el.remove(),
          420
        );
      },
      timeout || 5000
    );
  }

  function escapeHTML(
    str
  ) {
    return String(
      str
    ).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&":
            "&amp;",

          "<":
            "&lt;",

          ">":
            "&gt;",

          '"':
            "&quot;",

          "'":
            "&#39;",
        }[c])
    );
  }

  /* =========================================================
     SHARED SHELL
  ========================================================= */

  function initShell(
    opts
  ) {
    opts =
      opts || {};

    auth.requireLogin();

    settings.apply();

    /*
      Firebase may finish restoring the session
      slightly after page load.

      Try synchronization again after a short delay.
    */
    setTimeout(
      () => {
        syncFirebaseUserToLocal();

        loadDeadlinesFromMongo()
          .then(
            (loaded) => {
              if (loaded) {
                console.log(
                  "DeadlineRadar: MongoDB data loaded."
                );

                window.dispatchEvent(
                  new Event(
                    "dr-mongo-loaded"
                  )
                );
              }
            }
          )
          .catch(
            (error) => {
              console.error(
                "DeadlineRadar: MongoDB load failed:",
                error
              );
            }
          );
      },
      500
    );

    const user =
      auth.getUser() || {
        name:
          "Student",

        department:
          "Student",
      };

    document
      .querySelectorAll(
        "[data-user-name]"
      )
      .forEach(
        (el) =>
          (el.textContent =
            user.name)
      );

    document
      .querySelectorAll(
        "[data-user-dept]"
      )
      .forEach(
        (el) =>
          (el.textContent =
            (user.department ||
              "Student") +
            (user.semester
              ? " · " +
                user.semester
              : ""))
      );

    document
      .querySelectorAll(
        "[data-user-initial]"
      )
      .forEach(
        (el) =>
          (el.textContent = (
            user.name ||
            "S"
          )
            .trim()
            .charAt(0)
            .toUpperCase())
      );

    document
      .querySelectorAll(
        "[data-user-firstname]"
      )
      .forEach(
        (el) =>
          (el.textContent = (
            user.name ||
            "there"
          ).split(
            " "
          )[0])
      );

    const hour =
      new Date().getHours();

    const greetWord =
      hour < 12
        ? "Good Morning"
        : hour < 17
        ? "Good Afternoon"
        : "Good Evening";

    document
      .querySelectorAll(
        "[data-greeting]"
      )
      .forEach(
        (el) =>
          (el.textContent =
            greetWord)
      );

    const dateStr =
      new Date().toLocaleDateString(
        "en-US",
        {
          weekday:
            "long",

          year:
            "numeric",

          month:
            "long",

          day:
            "numeric",
        }
      );

    document
      .querySelectorAll(
        "[data-today-date]"
      )
      .forEach(
        (el) =>
          (el.textContent =
            dateStr)
      );

    const sidebar =
      document.querySelector(
        ".sidebar"
      );

    const collapseBtn =
      document.getElementById(
        "sideCollapseBtn"
      );

    if (
      collapseBtn &&
      sidebar
    ) {
      const savedCollapsed =
        localStorage.getItem(
          "dr_sidebar_collapsed"
        ) === "true";

      sidebar.classList.toggle(
        "collapsed",
        savedCollapsed
      );

      collapseBtn.addEventListener(
        "click",
        () => {
          sidebar.classList.toggle(
            "collapsed"
          );

          localStorage.setItem(
            "dr_sidebar_collapsed",
            sidebar.classList.contains(
              "collapsed"
            )
          );
        }
      );
    }

    const mobileBtn =
      document.getElementById(
        "mobileMenuBtn"
      );

    const backdrop =
      document.getElementById(
        "sidebarBackdrop"
      );

    if (
      mobileBtn &&
      sidebar &&
      backdrop
    ) {
      mobileBtn.addEventListener(
        "click",
        () => {
          sidebar.classList.add(
            "mobile-open"
          );

          backdrop.classList.add(
            "show"
          );
        }
      );

      backdrop.addEventListener(
        "click",
        () => {
          sidebar.classList.remove(
            "mobile-open"
          );

          backdrop.classList.remove(
            "show"
          );
        }
      );

      sidebar
        .querySelectorAll(
          ".side-menu a"
        )
        .forEach(
          (a) =>
            a.addEventListener(
              "click",
              () => {
                sidebar.classList.remove(
                  "mobile-open"
                );

                backdrop.classList.remove(
                  "show"
                );
              }
            )
        );
    }

    const bellBtn =
      document.getElementById(
        "bellBtn"
      );

    const notifPanel =
      document.getElementById(
        "notifPanel"
      );

    if (
      bellBtn &&
      notifPanel
    ) {
      renderNotifPanel();

      bellBtn.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();

          notifPanel.classList.toggle(
            "open"
          );
        }
      );

      document.addEventListener(
        "click",
        (e) => {
          if (
            !notifPanel.contains(
              e.target
            )
          ) {
            notifPanel.classList.remove(
              "open"
            );
          }
        }
      );
    }

    const logoutBtn =
      document.getElementById(
        "logoutBtn"
      );

    if (logoutBtn) {
      logoutBtn.addEventListener(
        "click",
        (e) => {
          e.preventDefault();

          auth.logout();

          window.location.href =
            "index.html";
        }
      );
    }

    const topSearch =
      document.getElementById(
        "topSearchInput"
      );

    if (topSearch) {
      topSearch.addEventListener(
        "keydown",
        (e) => {
          if (
            e.key === "Enter" &&
            topSearch.value.trim()
          ) {
            window.location.href =
              "deadlines.html?q=" +
              encodeURIComponent(
                topSearch.value.trim()
              );
          }
        }
      );
    }

    startCountdownLoop();

    maybeFireEntryToasts();
  }

  function startCountdownLoop() {
    function tick() {
      document
        .querySelectorAll(
          "[data-due][data-id]"
        )
        .forEach(
          (el) => {
            const d =
              getById(
                el.getAttribute(
                  "data-id"
                )
              );

            if (!d) {
              return;
            }

            const str =
              countdownString(
                d
              );

            el.textContent =
              str;

            el.classList.remove(
              "critical",
              "upcoming",
              "safe",
              "overdue",
              "completed"
            );

            el.classList.add(
              getStatus(d)
            );
          }
        );
    }

    tick();

    setInterval(
      tick,
      1000
    );
  }

  function maybeFireEntryToasts() {
    const seenKey =
      "dr_toast_session";

    if (
      sessionStorage.getItem(
        seenKey
      )
    ) {
      return;
    }

    sessionStorage.setItem(
      seenKey,
      "true"
    );

    const list =
      getDeadlines();

    const critical =
      list.find(
        (d) =>
          !d.completed &&
          getStatus(d) ===
            "critical"
      );

    if (critical) {
      setTimeout(
        () => {
          toast(
            "critical",
            "Deadline Tomorrow",
            critical.title +
              " " +
              remainingLabel(
                critical
              ).toLowerCase() +
              "."
          );
        },
        900
      );
    }

    const upcoming =
      list.find(
        (d) =>
          !d.completed &&
          getStatus(d) ===
            "upcoming"
      );

    if (upcoming) {
      setTimeout(
        () => {
          toast(
            "upcoming",
            "Upcoming Deadline",
            upcoming.title +
              " is " +
              remainingLabel(
                upcoming
              ).toLowerCase() +
              "."
          );
        },
        1900
      );
    }
  }

  /* =========================================================
     ADD / EDIT / DETAIL MODAL
  ========================================================= */

  const modal = {
    onChange: null,

    openAdd(
      prefillDate
    ) {
      const overlay =
        document.getElementById(
          "deadlineFormModal"
        );

      if (!overlay) {
        return;
      }

      document.getElementById(
        "dfId"
      ).value = "";

      document.getElementById(
        "dfModalTitle"
      ).textContent =
        "Add New Deadline";

      document.getElementById(
        "dfSubmitBtn"
      ).textContent =
        "Add Deadline";

      document.getElementById(
        "dfTitle"
      ).value = "";

      document.getElementById(
        "dfCourse"
      ).value = "";

      document.getElementById(
        "dfType"
      ).value =
        "Assignment";

      document.getElementById(
        "dfDueDate"
      ).value =
        prefillDate || "";

      document.getElementById(
        "dfDueTime"
      ).value =
        "23:59";

      document.getElementById(
        "dfPriority"
      ).value =
        "Medium";

      document.getElementById(
        "dfDescription"
      ).value = "";

      document.getElementById(
        "dfProgress"
      ).value =
        0;

      document.getElementById(
        "dfProgressVal"
      ).textContent =
        "0%";

      document
        .querySelectorAll(
          "#deadlineFormModal .field"
        )
        .forEach(
          (f) =>
            f.classList.remove(
              "invalid"
            )
        );

      overlay.classList.add(
        "open"
      );
    },

    openEdit(id) {
      const d =
        getById(id);

      if (!d) {
        return;
      }

      const overlay =
        document.getElementById(
          "deadlineFormModal"
        );

      if (!overlay) {
        return;
      }

      const dt =
        new Date(
          d.due
        );

      document.getElementById(
        "dfId"
      ).value =
        d.id;

      document.getElementById(
        "dfModalTitle"
      ).textContent =
        "Edit Deadline";

      document.getElementById(
        "dfSubmitBtn"
      ).textContent =
        "Save Changes";

      document.getElementById(
        "dfTitle"
      ).value =
        d.title;

      document.getElementById(
        "dfCourse"
      ).value =
        d.course;

      document.getElementById(
        "dfType"
      ).value =
        d.type;

      document.getElementById(
        "dfDueDate"
      ).value =
        dt
          .toISOString()
          .slice(
            0,
            10
          );

      document.getElementById(
        "dfDueTime"
      ).value =
        pad(
          dt.getHours()
        ) +
        ":" +
        pad(
          dt.getMinutes()
        );

      document.getElementById(
        "dfPriority"
      ).value =
        d.priority;

      document.getElementById(
        "dfDescription"
      ).value =
        d.description ||
        "";

      document.getElementById(
        "dfProgress"
      ).value =
        d.progress ||
        0;

      document.getElementById(
        "dfProgressVal"
      ).textContent =
        (d.progress ||
          0) +
        "%";

      document
        .querySelectorAll(
          "#deadlineFormModal .field"
        )
        .forEach(
          (f) =>
            f.classList.remove(
              "invalid"
            )
        );

      overlay.classList.add(
        "open"
      );
    },

    close() {
      document
        .querySelectorAll(
          ".modal-overlay"
        )
        .forEach(
          (o) =>
            o.classList.remove(
              "open"
            )
        );
    },

    handleSubmit(e) {
      e.preventDefault();

      const id =
        document.getElementById(
          "dfId"
        ).value;

      const title =
        document.getElementById(
          "dfTitle"
        ).value.trim();

      const course =
        document.getElementById(
          "dfCourse"
        ).value.trim();

      const type =
        document.getElementById(
          "dfType"
        ).value;

      const dueDate =
        document.getElementById(
          "dfDueDate"
        ).value;

      const dueTime =
        document.getElementById(
          "dfDueTime"
        ).value ||
        "23:59";

      const priority =
        document.getElementById(
          "dfPriority"
        ).value;

      const description =
        document.getElementById(
          "dfDescription"
        ).value.trim();

      const progress =
        Number(
          document.getElementById(
            "dfProgress"
          ).value
        ) || 0;

      let valid =
        true;

      const setInvalid = (
        fieldId,
        bad
      ) => {
        const el =
          document.getElementById(
            fieldId
          );

        if (el) {
          el.classList.toggle(
            "invalid",
            bad
          );
        }

        if (bad) {
          valid =
            false;
        }
      };

      setInvalid(
        "dfFieldTitle",
        title.length < 2
      );

      setInvalid(
        "dfFieldCourse",
        course.length < 2
      );

      setInvalid(
        "dfFieldDate",
        !dueDate
      );

      if (!valid) {
        toast(
          "critical",
          "Check the form",
          "Title, course and due date are required."
        );

        return;
      }

      const due =
        new Date(
          dueDate +
            "T" +
            dueTime +
            ":00"
        ).toISOString();

      const payload = {
        title,
        course,
        type,
        due,
        priority,
        description,
        progress,
      };

      if (id) {
        updateDeadline(
          id,
          payload
        );

        toast(
          "safe",
          "Deadline updated",
          title +
            " has been updated."
        );
      } else {
        payload.createdAt =
          Date.now();

        addDeadline(
          payload
        );

        toast(
          "safe",
          "Deadline added successfully",
          title +
            " is now on your radar."
        );
      }

      modal.close();

      if (
        typeof modal.onChange ===
        "function"
      ) {
        modal.onChange();
      }
    },

    openDetail(id) {
      const d =
        getById(id);

      if (!d) {
        return;
      }

      const overlay =
        document.getElementById(
          "detailModal"
        );

      if (!overlay) {
        return;
      }

      const status =
        getStatus(d);

      const diff =
        new Date(
          d.due
        ).getTime() -
        Date.now();

      const days =
        Math.floor(
          Math.abs(diff) /
            86400000
        );

      const hours =
        Math.floor(
          (Math.abs(diff) %
            86400000) /
            3600000
        );

      const remainingText =
        diff < 0 &&
        !d.completed
          ? days +
            "d " +
            hours +
            "h overdue"
          : days +
            "d " +
            hours +
            "h";

      document.getElementById(
        "detailTitle"
      ).textContent =
        d.title;

      document.getElementById(
        "detailBody"
      ).innerHTML = `
        <div class="modal-detail-row">
          <span>Course</span>
          <span>${escapeHTML(
            d.course
          )}</span>
        </div>

        <div class="modal-detail-row">
          <span>Type</span>
          <span>${escapeHTML(
            d.type
          )}</span>
        </div>

        <div class="modal-detail-row">
          <span>Due</span>
          <span>${fmtDate(
            d.due,
            true
          )}</span>
        </div>

        <div class="modal-detail-row">
          <span>Remaining</span>
          <span>${
            d.completed
              ? "Completed"
              : remainingText
          }</span>
        </div>

        <div class="modal-detail-row">
          <span>Priority</span>
          <span>${escapeHTML(
            d.priority
          )}</span>
        </div>

        <div class="modal-detail-row">
          <span>Progress</span>
          <span>${
            d.progress || 0
          }%</span>
        </div>

        <div class="modal-detail-row">
          <span>Status</span>
          <span class="chip ${status}">
            ${statusLabel(
              status
            )}
          </span>
        </div>

        ${
          d.description
            ? `<p class="modal-desc">${escapeHTML(
                d.description
              )}</p>`
            : ""
        }
      `;

      const completeBtn =
        document.getElementById(
          "detailCompleteBtn"
        );

      completeBtn.textContent =
        d.completed
          ? "Mark Incomplete"
          : "Mark Complete";

      completeBtn.onclick =
        () => {
          const updated =
            toggleComplete(
              d.id
            );

          const nowCompleted =
            !!updated?.completed;

          toast(
            "safe",
            nowCompleted
              ? "Task Completed"
              : "Marked incomplete",
            "You " +
              (nowCompleted
                ? "completed"
                : "reopened") +
              " " +
              d.title +
              "."
          );

          modal.close();

          if (
            typeof modal.onChange ===
            "function"
          ) {
            modal.onChange();
          }
        };

      document.getElementById(
        "detailEditBtn"
      ).onclick =
        () => {
          modal.close();

          modal.openEdit(
            d.id
          );
        };

      document.getElementById(
        "detailDeleteBtn"
      ).onclick =
        () => {
          if (
            confirm(
              'Delete "' +
                d.title +
                '"? This can\'t be undone.'
            )
          ) {
            deleteDeadline(
              d.id
            );

            toast(
              "info",
              "Deadline deleted",
              d.title +
                " was removed."
            );

            modal.close();

            if (
              typeof modal.onChange ===
              "function"
            ) {
              modal.onChange();
            }
          }
        };

      overlay.classList.add(
        "open"
      );
    },
  };

  /* =========================================================
     DOM CONTENT LOADED
  ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      document
        .querySelectorAll(
          ".modal-overlay"
        )
        .forEach(
          (overlay) => {
            overlay.addEventListener(
              "click",
              (e) => {
                if (
                  e.target ===
                  overlay
                ) {
                  modal.close();
                }
              }
            );
          }
        );

      document.addEventListener(
        "keydown",
        (e) => {
          if (
            e.key ===
            "Escape"
          ) {
            modal.close();
          }
        }
      );

      const progressSlider =
        document.getElementById(
          "dfProgress"
        );

      if (progressSlider) {
        progressSlider.addEventListener(
          "input",
          () => {
            const value =
              document.getElementById(
                "dfProgressVal"
              );

            if (value) {
              value.textContent =
                progressSlider.value +
                "%";
            }
          }
        );
      }

      const form =
        document.getElementById(
          "deadlineForm"
        );

      if (form) {
        form.addEventListener(
          "submit",
          modal.handleSubmit
        );
      }

      document
        .querySelectorAll(
          "[data-open-add]"
        )
        .forEach(
          (btn) =>
            btn.addEventListener(
              "click",
              () =>
                modal.openAdd()
            )
        );
    }
  );

  /* =========================================================
     COUNT-UP NUMBER ANIMATION
  ========================================================= */

  function countUp(
    el,
    target,
    duration
  ) {
    duration =
      duration ||
      1200;

    const start =
      performance.now();

    function frame(now) {
      const p =
        Math.min(
          1,
          (now - start) /
            duration
        );

      const eased =
        1 -
        Math.pow(
          1 - p,
          3
        );

      el.textContent =
        Math.round(
          eased * target
        );

      if (p < 1) {
        requestAnimationFrame(
          frame
        );
      } else {
        el.textContent =
          target;
      }
    }

    requestAnimationFrame(
      frame
    );
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  return {
    KEYS,

    getDeadlines,
    saveDeadlines,

    addDeadline,
    updateDeadline,
    deleteDeadline,
    toggleComplete,

    getById,

    resetSeedData,
    restoreSeedDataToMongo,

    getStatus,
    statusLabel,
    remainingLabel,
    countdownString,
    fmtDate,
    computeStats,

    auth,
    settings,
    modal,

    toast,
    renderNotifPanel,
    initShell,
    countUp,
    escapeHTML,
    uid,

    loadDeadlinesFromMongo,
    createDeadlineInMongo,
    updateDeadlineInMongo,
    deleteDeadlineFromMongo,

    getFirebaseUid,
    getFirebaseUser,
    getCurrentUserInfo,
    syncFirebaseUserToLocal,
  };
})();