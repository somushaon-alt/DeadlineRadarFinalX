/* ============================================================
   DEADLINE RADAR — firebase-auth.js
   Real Firebase Google Sign-In + MongoDB user profile loading
============================================================ */

(function () {
  "use strict";

  /* ---------- Firebase check ---------- */

  if (
    typeof firebase === "undefined" ||
    !window.FIREBASE_CONFIG
  ) {
    console.error(
      "Deadline Radar: Firebase SDK or config missing — Google sign-in is disabled."
    );
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
  }

  const provider =
    new firebase.auth.GoogleAuthProvider();

  const AUTH_PAGES = [
    "login.html",
    "register.html",
    "index.html",
    ""
  ];

  /* ---------- page helpers ---------- */

  function currentPage() {
    return location.pathname.split("/").pop();
  }

  function isAuthPage() {
    return AUTH_PAGES.indexOf(currentPage()) !== -1;
  }

  /* ---------- Firebase user → DeadlineRadar user ---------- */

  function mapUser(fbUser) {
    return {
      uid: fbUser.uid,

      name:
        fbUser.displayName ||
        (fbUser.email
          ? fbUser.email.split("@")[0]
          : "Student"),

      email: fbUser.email || "",

      photo: fbUser.photoURL || ""
    };
  }

  /* ============================================================
     GOOGLE SIGN-IN
  ============================================================ */

  DR.auth.signInWithGoogle = function () {
    return firebase
      .auth()
      .signInWithPopup(provider)
      .then(async (result) => {

        const incoming = mapUser(result.user);

        const existing =
          DR.auth.getUser() || {};

        /* ---------- basic Firebase user ---------- */

        DR.auth.updateUser(
          Object.assign(
            {
              department: "CSE",
              semester: "N/A"
            },
            existing,
            incoming
          )
        );

        localStorage.setItem(
          DR.KEYS.session,
          "true"
        );

        /* ======================================================
           SAVE / LOAD USER FROM MONGODB
        ====================================================== */

        try {
          const response = await fetch(
            "http://localhost:5000/api/users",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json"
              },

              body: JSON.stringify({
                firebaseUid: incoming.uid,
                name: incoming.name,
                email: incoming.email
              })
            }
          );

          const data =
            await response.json();

          if (!response.ok) {

            console.error(
              "MongoDB user save/load failed:",
              data.message
            );

          } else {

            console.log(
              "MongoDB user:",
              data.user
            );

            /* ==================================================
               IMPORTANT:
               If MongoDB already has this user, load the
               saved department and semester.
            ================================================== */

            if (data.user) {

              DR.auth.updateUser({
                uid:
                  data.user.firebaseUid ||
                  incoming.uid,

                name:
                  data.user.name ||
                  incoming.name,

                email:
                  data.user.email ||
                  incoming.email,

                department:
                  data.user.department || "",

                semester:
                  data.user.semester || "",

                photo:
                  incoming.photo || ""
              });

              console.log(
                "MongoDB profile loaded into DeadlineRadar."
              );
            }
          }

        } catch (error) {

          console.error(
            "Could not connect to DeadlineRadar backend:",
            error
          );
        }

        /* ---------- return final user ---------- */

        return DR.auth.getUser();
      });
  };

  /* ============================================================
     LOGOUT
  ============================================================ */

  DR.auth.logout = function () {

    localStorage.removeItem(
      DR.KEYS.session
    );

    return firebase
      .auth()
      .signOut();
  };

  /* ============================================================
     LOGIN STATUS
  ============================================================ */

  DR.auth.isLoggedIn = function () {

    return (
      localStorage.getItem(
        DR.KEYS.session
      ) === "true"
    );
  };

  /* ============================================================
     REQUIRE LOGIN
  ============================================================ */

  DR.auth.requireLogin = function () {

    /*
      If there is no cached session,
      go directly to login.
    */

    if (
      !DR.auth.isLoggedIn() &&
      !isAuthPage()
    ) {

      window.location.href =
        "login.html";

      return;
    }

    /*
      Confirm the real Firebase session.
    */

    firebase
      .auth()
      .onAuthStateChanged(async (user) => {

        if (user) {

          const firebaseUser =
            mapUser(user);

          const existing =
            DR.auth.getUser() || {};

          /*
            First update the local Firebase
            information.
          */

          DR.auth.updateUser(
            Object.assign(
              {},
              existing,
              firebaseUser
            )
          );

          localStorage.setItem(
            DR.KEYS.session,
            "true"
          );

          /* ==============================================
             LOAD PROFILE FROM MONGODB
          ============================================== */

          try {

            const response =
              await fetch(
                "http://localhost:5000/api/users/" +
                  encodeURIComponent(
                    firebaseUser.uid
                  )
              );

            if (response.ok) {

              const data =
                await response.json();

              if (data.user) {

                DR.auth.updateUser({
                  uid:
                    data.user.firebaseUid ||
                    firebaseUser.uid,

                  name:
                    data.user.name ||
                    firebaseUser.name,

                  email:
                    data.user.email ||
                    firebaseUser.email,

                  department:
                    data.user.department || "",

                  semester:
                    data.user.semester || "",

                  photo:
                    firebaseUser.photo || ""
                });

                console.log(
                  "MongoDB profile loaded after authentication."
                );

                /*
                  Tell pages that MongoDB/user data
                  has finished loading.
                */

                window.dispatchEvent(
                  new Event(
                    "dr-mongo-loaded"
                  )
                );
              }

            } else {

              console.warn(
                "MongoDB profile could not be loaded."
              );
            }

          } catch (error) {

            console.error(
              "Could not load MongoDB profile:",
              error
            );
          }

        } else {

          localStorage.removeItem(
            DR.KEYS.session
          );

          if (!isAuthPage()) {

            window.location.href =
              "login.html";
          }
        }
      });
  };

})();