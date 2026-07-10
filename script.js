const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");

const authGateway = document.getElementById("auth-gateway");
const appFrame = document.getElementById("app-frame");

const loginPanel = document.getElementById("login-panel");
const registerPanel = document.getElementById("register-panel");

const toRegisterBtn = document.getElementById("to-register-btn");
const toLoginBtn = document.getElementById("to-login-btn");
const logoutBtn = document.getElementById("logout-btn");

// ============================================================
// COMETSYNC — FIREBASE POWERED
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDCmGIMfGLXhrP7dJ4SGYfxxVGEc9yjx4A",
  authDomain: "cometsync-44e93.firebaseapp.com",
  projectId: "cometsync-44e93",
  storageBucket: "cometsync-44e93.appspot.com",
  messagingSenderId: "286609927630",
  appId: "1:286609927630:web:15fcc8d3656f0d5df04f9f"
};

// ============================================================
// FIREBASE INIT
// ============================================================

firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
let currentUser = null;
let currentUserProfile = null;
let selectedPostFile = null;
let selectedPostGradient = "none";
let selectedStoryFile = null;
let selectedVideoFile = null;

// Real-time listener unsubscribers
let _userProfileListener = null;
let _postsListener = null;
let _storiesListener = null;
let _communitiesListener = null;
let _messagingUsersListener = null;
let _videosListener = null;
let _joinRequestsListener = null;
let activeChatListener = null;
let activeChatId = null;
let commentsListeners = {};

// Space presets
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
];

const STELLAR_EVENTS = [
  {
    dateStr: "2026-05-03",
    title: "Eta Aquariids Meteor Shower Peak",
    description: "Halley's Comet debris burns up in our atmosphere, producing up to 50 glowing meteors per hour. Best viewed from dark skies!",
    scientists: ["Edmond Halley - Calculated comet orbits", "Giovanni Domenico Cassini - Observed cometary dust structures"]
  },
  {
    dateStr: "2026-05-12",
    title: "SpaceX Starship Mars Simulation Launch",
    description: "SpaceX is launching Starship for an exciting simulated Mars injection flight. Watch live as they test deep space thermal management!",
    scientists: ["Elon Musk - Chief Engineer", "Wernher von Braun - Pioneer of rocket science"]
  },
  {
    dateStr: "2026-05-20",
    title: "ISS Transit Across the Sun",
    description: "Look up! The ISS will transit directly across the face of the Sun at a blistering 28,000 km/h. Don't forget your solar filters!",
    scientists: ["Robert Cabana - ISS Astronaut", "Valery Ryumin - Space station pioneer"]
  },
  {
    dateStr: "2026-05-27",
    title: "Supermoon Alignment",
    description: "Perigee alignment! The Moon will look roughly 14% larger and 30% brighter tonight. A perfect night for photography.",
    scientists: ["Richard Nolle - Coined the term 'Supermoon'", "Johannes Kepler - Discovered elliptical planetary orbits"]
  },
  {
    dateStr: "2026-05-28",
    title: "Comet Halley Debris Passage",
    description: "We are passing directly through the dusty wake of Comet Halley. Look out for beautiful ionization trails overhead.",
    scientists: ["Edmond Halley - Predicted the return of the 1758 comet", "Fred Whipple - Dirty snowball cometary model pioneer"]
  },
  {
    dateStr: "2026-06-03",
    title: "Jupiter Opposition",
    description: "Jupiter will be at opposition, aligning with Earth and the Sun. Its Galilean moons should be clearly visible with binoculars.",
    scientists: ["Galileo Galilei - Discovered Jupiter's moons in 1610", "Simon Marius - Named Io, Europa, Ganymede, and Callisto"]
  },
  {
    dateStr: "2026-06-21",
    title: "Summer Solstice Solar Flare",
    description: "A major solar flare peak is forecast. Active geomagnetic alerts are in place, meaning stunning aurora displays at high latitudes!",
    scientists: ["Richard Carrington - Discovered solar flares in 1859", "Kristian Birkeland - Explained the nature of auroras"]
  },
  {
    dateStr: "2026-07-04",
    title: "Earth at Aphelion",
    description: "Earth reaches its farthest point from the Sun today — about 152 million km. Counterintuitively, Northern Hemisphere summer is near its peak!",
    scientists: ["Johannes Kepler - Laws of planetary motion", "Edmond Halley - Orbital mechanics pioneer"]
  },
  {
    dateStr: "2026-07-09",
    title: "New Moon & Deep Sky Window",
    description: "Tonight's new moon creates ideal dark-sky conditions for observing galaxies, nebulae, and the Milky Way core.",
    scientists: ["Galileo Galilei - First telescopic deep-sky observations", "Caroline Herschel - Catalogued star clusters and nebulae"]
  },
  {
    dateStr: "2026-07-28",
    title: "Delta Aquariids Meteor Shower Peak",
    description: "Up to 20 meteors per hour from Comet 96P/Machholz debris. Best viewed after midnight from the Southern Hemisphere.",
    scientists: ["Donald Machholz - Discovered Comet 96P/Machholz", "Fred Whipple - Cometary debris model"]
  }
];

// ============================================================
// UI HELPERS
// ============================================================

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle("hidden", !!hidden);
}

function showPanel(panelEl) {
  setHidden(loginPanel, panelEl !== loginPanel);
  setHidden(registerPanel, panelEl !== registerPanel);
}

function showApp() {
  setHidden(authGateway, true);
  setHidden(appFrame, false);
  if (!currentUser && auth.currentUser) currentUser = auth.currentUser;
  initAppInteractions();
}

function showAuth() {
  setHidden(appFrame, true);
  setHidden(authGateway, false);
  showPanel(loginPanel);
}

function numOrLen(v) {
  if (Array.isArray(v)) return v.length;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value == null || value === "" ? "—" : String(value);
}

// Fixed: default back to preset avatar instead of breaking 404
function setImg(idOrEl, url) {
  const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  el.src = url && url.startsWith("http") ? url : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
}

// ============================================================
// REAL-TIME USER PROFILE & POST BINDINGS
// ============================================================

function setupUserProfileListener(user) {
  if (!user) return;
  currentUser = user;

  const email = user.email || "";
  setText("current-user-logged-info", `Logged in as: ${email ? email : "—"}`);

  if (_userProfileListener) _userProfileListener();

  _userProfileListener = db.collection("users").doc(user.uid).onSnapshot(
    (doc) => {
      if (!doc.exists) return;
      const profile = doc.data();
      currentUserProfile = profile;

      const username = profile?.username || (email ? email.split("@")[0] : "user");
      const fullName = profile?.fullname || profile?.fullName || username || "—";
      const bio = profile?.bio || "—";
      const avatar = profile?.avatar || "";

      setText("profile-username-label", `@${username || "—"}`);
      setText("profile-fullname-label", fullName);
      setText("profile-bio-label", bio);

      const age = profile?.age;
      if (age != null && age !== "") {
        setText("profile-age-label", `Age: ${age} years`);
      } else {
        setText("profile-age-label", "Age: —");
      }

      setText("profile-followers-count", numOrLen(profile?.followers));
      setText("profile-following-count", numOrLen(profile?.following));

      // Binds avatar globally
      setImg("profile-main-avatar", avatar);
      setImg("sidebar-profile-avatar", avatar);
      document.querySelectorAll("img.profile-pic-bind").forEach((img) => setImg(img, avatar));

      // Prep edit profile values
      const editFullname = document.getElementById("edit-fullname");
      const editBio = document.getElementById("edit-bio");
      if (editFullname) editFullname.value = fullName;
      if (editBio) editBio.value = bio === "—" ? "" : bio;
    },
    (err) => console.error("User profile listener failed:", err)
  );

  // Profile transmission logs (User posts)
  db.collection("posts")
    .where("userId", "==", user.uid)
    .onSnapshot(
      (snap) => {
        setText("profile-posts-count", snap.size);
        const wrapper = document.getElementById("profile-posts-wrapper");
        if (!wrapper) return;
        wrapper.innerHTML = "";
        if (snap.empty) {
          wrapper.innerHTML = `<div class="empty-state" style="grid-column:1/-1; padding: 20px;"><p>No orbital transmissions logged yet.</p></div>`;
          return;
        }

        const postsList = [];
        snap.forEach((d) => postsList.push({ id: d.id, ...d.data() }));
        // Sort in memory to avoid composite indexes requirement
        postsList.sort((a, b) => {
          const tA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });

        postsList.forEach((post) => {
          wrapper.appendChild(renderPostCard({ id: post.id, data: () => post }));
        });
      },
      (err) => console.error("Failed to load profile posts:", err)
    );
}

// ============================================================
// CORE APP INTERACTIONS
// ============================================================

let _appInteractionsInitialized = false;

function initAppInteractions() {
  if (_appInteractionsInitialized) return;
  _appInteractionsInitialized = true;

  // Space Canvas animation
  initSpaceCanvas();

  // Sidebar navigation: switch content panels
  const navItems = Array.from(document.querySelectorAll(".sidebar-nav .nav-item"));
  const panels = Array.from(document.querySelectorAll(".content-panel"));

  function activatePanel(panelId) {
    if (!panelId) return;
    panels.forEach((p) => p.classList.toggle("active", p.id === panelId));
    navItems.forEach((a) => a.classList.toggle("active", a.dataset.target === panelId));
    
    // Custom views triggers
    if (panelId === "panel-calendar") {
      renderCalendar();
    } else if (panelId === "panel-communicate") {
      // Return to list view
      document.getElementById("single-community-view")?.classList.add("hidden");
      document.getElementById("communities-list-wrapper")?.classList.remove("hidden");
    }
  }

  window.currentViewedProfileId = null;
  window.viewUserProfile = async function(userId) {
    if (!userId) return;
    window.currentViewedProfileId = userId;
    activatePanel("panel-profile");
    
    const myUid = (currentUser || auth.currentUser)?.uid;
    const isMe = (userId === myUid);
    const editBtn = document.getElementById("profile-edit-btn");
    const followBtn = document.getElementById("profile-follow-btn");
    if (editBtn) setHidden(editBtn, !isMe);
    if (followBtn) setHidden(followBtn, isMe);
    
    let profileData = null;
    if (isMe && currentUserProfile) {
      profileData = currentUserProfile;
    } else {
      try {
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) profileData = doc.data();
      } catch(err) { console.error(err); }
    }
    
    if (!profileData) return;
    
    const username = profileData.username || "—";
    const fullName = profileData.fullname || profileData.fullName || username;
    const bio = profileData.bio || "—";
    const avatar = profileData.avatar || "";
    
    setText("profile-username-label", `@${username}`);
    setText("profile-fullname-label", fullName);
    setText("profile-bio-label", bio);
    
    const age = profileData.age;
    if (age != null && age !== "") setText("profile-age-label", `Age: ${age}`);
    else setText("profile-age-label", "");
    
    setText("profile-followers-count", numOrLen(profileData.followers));
    setText("profile-following-count", numOrLen(profileData.following));
    
    setImg("profile-main-avatar", avatar);
    
    if (!isMe && followBtn) {
      const iAmFollowing = profileData.followers && profileData.followers.includes(myUid);
      followBtn.textContent = iAmFollowing ? "Unfollow" : "Follow";
    }

    // Private profile guard — show lock screen for non-followers or unallowed users
    const postsWrapper = document.getElementById("profile-posts-wrapper");
    const profileTabSection = document.querySelector(".profile-tab-section");
    const isPrivate = profileData.isPrivate === true;
    const iAmFollowing = profileData.followers && profileData.followers.includes(myUid);
    const iAmAllowed = profileData.allowedUsers && profileData.allowedUsers.includes(myUid);

    if (!isMe && isPrivate && !iAmFollowing && !iAmAllowed) {
      // Show locked placeholder
      if (postsWrapper) {
        postsWrapper.innerHTML = `
          <div class="private-profile-lock" style="grid-column:1/-1;">
            <div class="lock-icon">🔒</div>
            <h3>Private Profile</h3>
            <p>You must follow this user or be on their allowlist to see their transmissions.</p>
          </div>
        `;
      }
      // Also show post count as hidden
      setText("profile-posts-count", "—");
      return;
    }

    try {
      const snap = await db.collection("posts").where("userId", "==", userId).get();
      setText("profile-posts-count", snap.size);
    } catch (err) {}
  };

  const followBtn = document.getElementById("profile-follow-btn");
  if (followBtn) {
    followBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const myId = (currentUser || auth.currentUser)?.uid;
      const targetId = window.currentViewedProfileId;
      if (!myId || !targetId || myId === targetId) return;

      followBtn.disabled = true;
      try {
        const myRef = db.collection("users").doc(myId);
        const targetRef = db.collection("users").doc(targetId);

        await db.runTransaction(async (transaction) => {
          const myDoc = await transaction.get(myRef);
          const targetDoc = await transaction.get(targetRef);

          let myFollowing = myDoc.data().following || [];
          let targetFollowers = targetDoc.data().followers || [];

          if (myFollowing.includes(targetId)) {
            myFollowing = myFollowing.filter(id => id !== targetId);
            targetFollowers = targetFollowers.filter(id => id !== myId);
          } else {
            myFollowing.push(targetId);
            targetFollowers.push(myId);
          }

          transaction.update(myRef, { following: myFollowing });
          transaction.update(targetRef, { followers: targetFollowers });
        });

        // #region agent log
        fetch('http://127.0.0.1:7660/ingest/7f509506-75fc-4924-98b0-2b5712ae800c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aab436'},body:JSON.stringify({sessionId:'aab436',location:'script.js:profileFollow:success',message:'profile follow transaction succeeded',data:{targetId,myId},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        window.viewUserProfile(targetId);
        
        if (currentUserProfile) {
          const myRef2 = await db.collection("users").doc(myId).get();
          currentUserProfile = myRef2.data();
        }
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7660/ingest/7f509506-75fc-4924-98b0-2b5712ae800c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aab436'},body:JSON.stringify({sessionId:'aab436',location:'script.js:profileFollow:error',message:'profile follow failed',data:{error:err.message,code:err.code},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error(err);
        showToast("Error", "Could not follow/unfollow user", "error");
      }
      followBtn.disabled = false;
    });
  }

  navItems.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.dataset.target;
      if (target === "panel-profile" && window.viewUserProfile) {
         window.viewUserProfile((currentUser || auth.currentUser)?.uid);
      } else if (target) {
         activatePanel(target);
      }
    });
  });

  // Settings drawer open/close
  const settingsDrawer = document.getElementById("settings-drawer");
  const settingsTriggerBtn = document.getElementById("settings-trigger-btn");
  const settingsCloseBtn = document.getElementById("settings-close-btn");

  function openSettings() { setHidden(settingsDrawer, false); }
  function closeSettings() { setHidden(settingsDrawer, true); }

  if (settingsTriggerBtn) {
    settingsTriggerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!settingsDrawer) return;
      const isHidden = settingsDrawer.classList.contains("hidden");
      setHidden(settingsDrawer, !isHidden ? true : false);
    });
  }

  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeSettings();
    });
  }

  document.addEventListener("click", (e) => {
    if (!settingsDrawer || settingsDrawer.classList.contains("hidden")) return;
    if (settingsDrawer.contains(e.target)) return;
    if (settingsTriggerBtn && settingsTriggerBtn.contains(e.target)) return;
    closeSettings();
  });

  // Theme switching
  document.querySelectorAll(".theme-card").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const themeId = btn.dataset.themeId;
      if (!themeId) return;
      document.documentElement.setAttribute("data-theme", themeId);
      document.querySelectorAll(".theme-card").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // Profile Edit drawer setup — with visibility toggle
  const editBtn = document.getElementById("profile-edit-btn");
  const editDrawer = document.getElementById("profile-edit-drawer");
  const editCancel = document.getElementById("profile-edit-cancel");
  const editForm = document.getElementById("profile-edit-form");
  const visibilityPublicBtn = document.getElementById("profile-visibility-public");
  const visibilityPrivateBtn = document.getElementById("profile-visibility-private");
  const visibilityHint = document.getElementById("profile-visibility-hint");
  const editIsPrivateInput = document.getElementById("edit-profile-is-private");

  function setVisibilityUI(isPrivate) {
    if (!visibilityPublicBtn || !visibilityPrivateBtn) return;
    visibilityPublicBtn.classList.toggle("active", !isPrivate);
    visibilityPrivateBtn.classList.toggle("active", isPrivate);
    if (editIsPrivateInput) editIsPrivateInput.value = String(isPrivate);
    if (visibilityHint) {
      visibilityHint.textContent = isPrivate
        ? "Only your followers and selected users can see your posts."
        : "Your profile is visible to everyone.";
    }
    const allowListSection = document.getElementById("profile-allowed-users-section");
    if (allowListSection) {
      if (isPrivate) {
        allowListSection.classList.remove("hidden");
        // Re-render list with currently saved allowed users
        renderAllowedUsersList("profile-allowed-users-list", currentUserProfile?.allowedUsers || []);
      } else {
        allowListSection.classList.add("hidden");
      }
    }
  }

  if (visibilityPublicBtn) visibilityPublicBtn.addEventListener("click", () => setVisibilityUI(false));
  if (visibilityPrivateBtn) visibilityPrivateBtn.addEventListener("click", () => setVisibilityUI(true));

  if (editBtn && editDrawer) {
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Sync current privacy setting to UI
      const isPrivate = currentUserProfile?.isPrivate === true;
      setVisibilityUI(isPrivate);
      editDrawer.classList.toggle("hidden");
    });
  }
  if (editCancel && editDrawer) {
    editCancel.addEventListener("click", (e) => {
      e.preventDefault();
      editDrawer.classList.add("hidden");
    });
  }
  if (editForm && editDrawer) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = currentUser || auth.currentUser;
      if (!user) return;
      const fullname = document.getElementById("edit-fullname")?.value?.trim() || "";
      const bio = document.getElementById("edit-bio")?.value?.trim() || "";
      const isPrivate = editIsPrivateInput?.value === "true";
      
      let allowedUsers = [];
      if (isPrivate) {
        const checkboxes = document.querySelectorAll("#profile-allowed-users-list input[type='checkbox']:checked");
        checkboxes.forEach(cb => allowedUsers.push(cb.value));
      }

      try {
        await db.collection("users").doc(user.uid).update({ fullname, bio, isPrivate, allowedUsers });
        editDrawer.classList.add("hidden");
        showToast("Profile Updated", "Deck coordinates synced successfully.", "success");
      } catch (err) {
        console.error("Failed to update profile:", err);
        showToast("Update Failed", err.message || String(err), "error");
      }
    });
  }

  // Helper to render user checklists
  async function renderAllowedUsersList(containerId, checkedIds = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const snap = await db.collection("users").get();
      const myId = (currentUser || auth.currentUser)?.uid;
      let html = "";
      snap.forEach(doc => {
        if (doc.id === myId) return; // don't list self
        const u = doc.data();
        const isChecked = checkedIds.includes(doc.id) ? "checked" : "";
        html += `
          <label class="allowed-user-item">
            <input type="checkbox" value="${doc.id}" ${isChecked}>
            <img src="${u.avatar || ''}" alt="" class="allowed-user-avatar">
            <div class="allowed-user-info">
              <span class="allowed-user-fullname">${u.fullname || u.username}</span>
              <span class="allowed-user-username">@${u.username}</span>
            </div>
          </label>
        `;
      });
      container.innerHTML = html || "<p class='privacy-hint'>No other users found.</p>";
    } catch (err) {
      console.error("Failed to load users for allowlist:", err);
      container.innerHTML = "<p class='privacy-hint'>Error loading users.</p>";
    }
  }

  // Preset Avatar selector
  initAvatarModal();

  // Google Sign-In
  const googleLoginBtn = document.getElementById("google-signin-login-btn");
  const googleRegisterBtn = document.getElementById("google-signin-register-btn");
  async function handleGoogleSignIn() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      // Check if user doc already exists
      const userDocRef = db.collection("users").doc(user.uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        // New Google user — create profile doc
        const displayName = user.displayName || "Cosmic Traveler";
        const username = (user.email || "").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") || "user_" + Date.now();
        await userDocRef.set({
          username,
          fullname: displayName,
          email: user.email || "",
          age: null,
          avatar: user.photoURL || "",
          bio: "",
          followers: [],
          following: [],
          isPrivate: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast("Welcome!", `Account created for ${displayName}`, "success");
      } else {
        showToast("Welcome back!", `Signed in as ${user.displayName || user.email}`, "success");
      }
      showApp();
    } catch (err) {
      console.error("Google sign-in failed:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        showToast("Google Sign-In Failed", err.message || String(err), "error");
      }
    }
  }
  if (googleLoginBtn) googleLoginBtn.addEventListener("click", (e) => { e.preventDefault(); handleGoogleSignIn(); });
  if (googleRegisterBtn) googleRegisterBtn.addEventListener("click", (e) => { e.preventDefault(); handleGoogleSignIn(); });

  // Post media selection + preview
  const postMediaInput = document.getElementById("post-media-upload");
  const creatorMediaPreview = document.getElementById("creator-media-preview");
  const mediaPreviewImg = document.getElementById("media-preview-img");
  const removeMediaBtn = document.getElementById("remove-media-btn");

  function clearPostMedia() {
    selectedPostFile = null;
    if (postMediaInput) postMediaInput.value = "";
    if (mediaPreviewImg) mediaPreviewImg.src = "";
    setHidden(creatorMediaPreview, true);
  }

  if (postMediaInput) {
    postMediaInput.addEventListener("change", () => {
      const file = postMediaInput.files?.[0] || null;
      if (!file) return clearPostMedia();
      selectedPostFile = file;
      if (mediaPreviewImg) mediaPreviewImg.src = URL.createObjectURL(file);
      setHidden(creatorMediaPreview, false);
    });
  }

  if (removeMediaBtn) {
    removeMediaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearPostMedia();
    });
  }

  // Gradient picker
  const gradientTrigger = document.getElementById("post-gradient-trigger");
  const gradientRow = document.getElementById("gradient-picker-row");
  if (gradientTrigger) {
    gradientTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (!gradientRow) return;
      gradientRow.classList.toggle("hidden");
    });
  }
  document.querySelectorAll(".gradient-preset-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      selectedPostGradient = btn.dataset.gradient || "none";
      document.querySelectorAll(".gradient-preset-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // Launch post
  const launchPostBtn = document.getElementById("launch-post-btn");
  const creatorTextarea = document.getElementById("creator-textarea");
  const postsWrapper = document.getElementById("posts-stream-wrapper");

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  async function imageFileToSmallDataURL(file, { maxSize = 1200, quality = 0.8 } = {}) {
    try {
      const src = await fileToDataURL(file);
      const img = new Image();
      img.src = src;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error("Image load failed"));
      });

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return src;

      const scale = Math.min(1, maxSize / Math.max(w, h));
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d");
      if (!ctx) return src;
      ctx.drawImage(img, 0, 0, tw, th);

      return canvas.toDataURL("image/jpeg", quality) || src;
    } catch {
      return fileToDataURL(file);
    }
  }

  async function createPost() {
    const user = currentUser || auth.currentUser;
    if (!user) {
      showToast("Not signed in", "Please log in again.", "error");
      return;
    }

    const text = creatorTextarea?.value?.trim() || "";
    if (!text && !selectedPostFile) {
      showToast("Empty post", "Write something or attach a photo.", "error");
      return;
    }

    try {
      let imageUrl = "";
      if (selectedPostFile) {
        imageUrl = await imageFileToSmallDataURL(selectedPostFile);
      }

      const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
      const userAvatar = currentUserProfile?.avatar || "";

      // Add both userId and authorId to fully comply with strict security rules
      await db.collection("posts").add({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        commentsCount: 0,
        gradient: selectedPostGradient,
        image: imageUrl,
        likes: 0,
        likedBy: [],
        text,
        userAvatar,
        userId: user.uid,
        authorId: user.uid, 
        username
      });

      if (creatorTextarea) creatorTextarea.value = "";
      clearPostMedia();
      showToast("Posted", "Your signal was launched.", "success");
    } catch (err) {
      console.error(err);
      showToast("Post failed", err?.message || String(err), "error");
    }
  }

  if (launchPostBtn) {
    launchPostBtn.addEventListener("click", (e) => {
      e.preventDefault();
      createPost();
    });
  }

  // Home posts stream (Filter out community posts in memory)
  if (postsWrapper) {
    if (_postsListener) _postsListener();
    _postsListener = db.collection("posts")
      .orderBy("createdAt", "desc")
      .limit(100)
      .onSnapshot(
        (snap) => {
          postsWrapper.innerHTML = "";
          let rendered = 0;
          snap.forEach((doc) => {
            const data = doc.data();
            if (!data.communityId && rendered < 50) {
              postsWrapper.appendChild(renderPostCard(doc));
              rendered++;
            }
          });
          if (rendered === 0) {
            postsWrapper.innerHTML = `<div class="empty-state"><h3>No Transmissions</h3><p>Broadcast a signal to fill the stream.</p></div>`;
          }
        },
        (err) => console.error("Posts listener failed:", err)
      );
  }

  // Story upload & reel initialization
  const storyUploadInput = document.getElementById("story-upload-input");
  if (storyUploadInput) {
    const createStoryItem = document.querySelector(".create-story-item");
    if (createStoryItem) {
      createStoryItem.addEventListener("click", () => storyUploadInput.click());
    }

    storyUploadInput.addEventListener("change", async () => {
      const user = currentUser || auth.currentUser;
      if (!user) {
        showToast("Not signed in", "Please log in again.", "error");
        return;
      }

      const file = storyUploadInput.files?.[0] || null;
      if (!file) return;

      try {
        const imageUrl = await imageFileToSmallDataURL(file);
        const now = Date.now();
        const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
        const avatar = currentUserProfile?.avatar || "";

        // Fixed: added authorId
        await db.collection("stories").add({
          avatar,
          caption: "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          expiresAt: now + 24 * 60 * 60 * 1000,
          image: imageUrl,
          userId: user.uid,
          authorId: user.uid,
          username
        });

        storyUploadInput.value = "";
        showToast("Story posted", "Your story is live.", "success");
      } catch (err) {
        console.error(err);
        showToast("Story failed", err?.message || String(err), "error");
      }
    });
  }
  loadStories();

  // Communities: establish community modal & creation
  const createCommunityForm = document.getElementById("create-community-form");
  const communityModal = document.getElementById("community-modal");
  const launchCommunityTrigger = document.getElementById("launch-community-trigger");
  const communityCloseBtn = document.getElementById("community-close-btn");

  if (launchCommunityTrigger && communityModal) {
    launchCommunityTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      communityModal.classList.remove("hidden");
    });
  }

  if (communityCloseBtn && communityModal) {
    communityCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      communityModal.classList.add("hidden");
    });
  }

  if (createCommunityForm && communityModal) {
    // Update privacy hint dynamically
    const commPublicRadio = document.getElementById("comm-public");
    const commPrivateRadio = document.getElementById("comm-private");
    const privacyHint = document.getElementById("privacy-hint-text");
    const allowListSection = document.getElementById("comm-allowed-users-section");
    
    if (commPublicRadio && commPrivateRadio && privacyHint) {
      commPublicRadio.addEventListener("change", () => {
        privacyHint.textContent = "Anyone can discover and join this community.";
        if (allowListSection) allowListSection.classList.add("hidden");
      });
      commPrivateRadio.addEventListener("change", () => {
        privacyHint.textContent = "Only invited members can see and join this community.";
        if (allowListSection) {
          allowListSection.classList.remove("hidden");
          if (typeof renderAllowedUsersList === "function") {
            renderAllowedUsersList("comm-allowed-users-list", []);
          }
        }
      });
    }

    createCommunityForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = currentUser || auth.currentUser;
      if (!user) return;

      let name = document.getElementById("comm-name")?.value?.trim() || "";
      const topic = document.getElementById("comm-topic")?.value?.trim() || "";
      const description = document.getElementById("comm-description")?.value?.trim() || "";
      const isPrivate = document.getElementById("comm-private")?.checked || false;

      let allowedUsers = [];
      if (isPrivate) {
        const checkboxes = document.querySelectorAll("#comm-allowed-users-list input[type='checkbox']:checked");
        checkboxes.forEach(cb => allowedUsers.push(cb.value));
      }

      if (!name || !topic || !description) return;

      if (!name.startsWith("c/")) {
        name = "c/" + name;
      }

      try {
        await db.collection("communities").add({
          name,
          topic,
          description,
          isPrivate,
          allowedUsers,
          creatorId: user.uid,
          membersCount: 1,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        createCommunityForm.reset();
        if (allowListSection) allowListSection.classList.add("hidden");
        communityModal.classList.add("hidden");
        showToast("Community Launched", `Community ${name} established.`, "success");
      } catch (err) {
        console.error("Failed to create community:", err);
        showToast("Launch Failed", err.message || String(err), "error");
      }
    });
  }

  const backToCommBtn = document.getElementById("back-to-communities-btn");
  if (backToCommBtn) {
    backToCommBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("single-community-view")?.classList.add("hidden");
      document.getElementById("communities-list-wrapper")?.classList.remove("hidden");
    });
  }

  loadCommunitiesList();

  // Cosmic Reels (Video Panel)
  initVideosPanel();

  // Notifications logic
  initNotifications();

  // Direct Messaging: sidebar and inputs
  initMessaging();

  // Search logic
  initSearch();

  activatePanel("panel-home");
}

// ============================================================
// RENDER DYNAMIC POST CARDS (Likes & Comments Subcollections)
// ============================================================

function renderPostCard(doc) {
  const d = typeof doc.data === "function" ? doc.data() : doc;
  const postId = doc.id;
  const card = document.createElement("article");
  const gradientClass = d.gradient && d.gradient !== "none" ? ` backdrop-${d.gradient}` : "";
  card.className = `post-card${gradientClass}${d.gradient && d.gradient !== "none" ? " has-backdrop" : ""}`;
  const imgHtml = d.image ? `<img class="post-card-image" src="${d.image}" alt="Post image">` : "";
  
  const user = currentUser || auth.currentUser;

  let commTagHtml = "";
  if (d.communityId) {
    commTagHtml = `<span class="post-comm-tag">${d.communityName || "c/board"}</span>`;
  }

  card.innerHTML = `
    <div class="post-card-header">
      <div class="post-user-info">
        <img class="avatar-sm" src="${d.userAvatar || ""}" alt="avatar">
        <div class="post-user-texts">
          <h4>${d.username || "—"}</h4>
          <div class="handle">@${d.username || "—"}</div>
        </div>
      </div>
      <div class="post-metadata">
        ${commTagHtml}
      </div>
    </div>
    <div class="post-body">
      <p>${(d.text || "").replace(/</g, "&lt;")}</p>
    </div>
    ${imgHtml}
    
    <div class="post-actions">
      <button class="post-action-btn like-btn" data-post-id="${postId}">
        <span class="rocket-fly">🚀</span>
        <span class="like-label">0 Likes</span>
      </button>
      <button class="post-action-btn comment-toggle-btn" data-post-id="${postId}">
        💬 <span class="comment-label">0 Comments</span>
      </button>
    </div>

    <div class="post-comments-section hidden" id="comments-section-${postId}">
      <div class="comments-list" id="comments-list-${postId}"></div>
      <div class="comment-input-box">
        <input type="text" id="comment-field-${postId}" placeholder="Write a comment..." class="glass-input comment-field">
        <button class="btn primary-btn comment-submit-btn" data-post-id="${postId}">Send</button>
      </div>
    </div>
  `;

  // Real-time Likes listener (top-level postLikes collection, queried by postId)
  db.collection("postLikes")
    .where("postId", "==", postId)
    .onSnapshot((snap) => {
      const likesCount = snap.size;
      let isLiked = false;
      if (user) {
        snap.forEach((ldoc) => {
          if (ldoc.data().userId === user.uid) isLiked = true;
        });
      }

      const likeBtn = card.querySelector(".like-btn");
      const likeLabel = card.querySelector(".like-label");
      if (likeBtn) {
        likeBtn.classList.toggle("active-like", isLiked);
        likeBtn.onclick = async (e) => {
          e.preventDefault();
          likeBtn.disabled = true;
          await toggleLike(postId, isLiked);
          likeBtn.disabled = false;
        };
      }
      if (likeLabel) {
        likeLabel.textContent = `${likesCount} Likes`;
      }
    }, (err) => console.error("Likes listener failed:", err));

  // Real-time Comments count listener (top-level postComments collection, queried by postId)
  db.collection("postComments")
    .where("postId", "==", postId)
    .onSnapshot((snap) => {
      const commentLabel = card.querySelector(".comment-label");
      if (commentLabel) {
        commentLabel.textContent = `${snap.size} Comments`;
      }
    }, (err) => console.error("Comments count listener failed:", err));

  // Comments toggler
  const commentToggleBtn = card.querySelector(".comment-toggle-btn");
  const commentsSection = card.querySelector(`#comments-section-${postId}`);
  commentToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isHidden = commentsSection.classList.contains("hidden");
    if (isHidden) {
      commentsSection.classList.remove("hidden");
      loadPostComments(postId);
    } else {
      commentsSection.classList.add("hidden");
    }
  });

  // Comment submission
  const commentSubmitBtn = card.querySelector(".comment-submit-btn");
  const commentInput = card.querySelector(`#comment-field-${postId}`);

  commentSubmitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const text = commentInput?.value?.trim();
    if (!text) return;
    commentSubmitBtn.disabled = true;
    await submitComment(postId, text);
    if (commentInput) commentInput.value = "";
    commentSubmitBtn.disabled = false;
  });

  if (commentInput) {
    commentInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;
        commentInput.disabled = true;
        await submitComment(postId, text);
        commentInput.value = "";
        commentInput.disabled = false;
        commentInput.focus();
      }
    });
  }

  return card;
}

// Like toggle (using top-level postLikes collection)
async function toggleLike(postId, isLiked) {
  const user = currentUser || auth.currentUser;
  if (!user) return;

  try {
    if (isLiked) {
      // Find and delete the existing like doc
      const snap = await db.collection("postLikes")
        .where("postId", "==", postId)
        .where("userId", "==", user.uid)
        .get();
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } else {
      await db.collection("postLikes").add({
        postId,
        userId: user.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (err) {
    console.error("Like toggle failed:", err);
    showToast("Like failed", err?.message || String(err), "error");
  }
}

// Load post comments (reading from top-level postComments collection)
function loadPostComments(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  if (!list) return;

  if (commentsListeners[postId]) commentsListeners[postId]();

  commentsListeners[postId] = db.collection("postComments")
    .where("postId", "==", postId)
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (snap) => {
        list.innerHTML = "";
        if (snap.empty) {
          list.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); padding:4px 0;">No comments yet — be the first!</div>`;
          return;
        }
        snap.forEach((doc) => {
          const c = doc.data();
          const item = document.createElement("div");
          item.className = "comment-item";
          item.innerHTML = `
            <img class="avatar-sm" src="${c.avatar || ""}" alt="avatar" style="width:22px; height:22px; border-color:var(--accent-secondary);">
            <div class="comment-content">
              <span class="comment-user">@${c.username || "user"}</span>
              <span class="comment-text">${(c.text || "").replace(/</g, "&lt;")}</span>
            </div>
          `;
          list.appendChild(item);
        });
        list.scrollTop = list.scrollHeight;
      },
      (err) => console.error("Comments listener failed:", err)
    );
}

// Submit comment (writing to top-level postComments collection)
async function submitComment(postId, text) {
  const user = currentUser || auth.currentUser;
  if (!user) {
    showToast("Not signed in", "Please log in to comment.", "error");
    return;
  }

  const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
  const avatar = currentUserProfile?.avatar || "";

  try {
    await db.collection("postComments").add({
      postId,
      userId: user.uid,
      username,
      avatar,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Comment submit failed:", err);
    showToast("Comment Failed", err?.message || String(err), "error");
  }
}

// ============================================================
// AVATARS SELECTOR MODAL
// ============================================================

function initAvatarModal() {
  const trigger = document.getElementById("profile-avatar-trigger");
  const modal = document.getElementById("avatar-modal");
  const closeBtn = document.getElementById("avatar-close-btn");
  const grid = document.getElementById("avatar-selection-grid");
  const customUrlInput = document.getElementById("custom-avatar-url");
  const saveCustomBtn = document.getElementById("save-custom-avatar");

  if (!modal || !grid) return;

  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.remove("hidden");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("hidden");
    });
  }

  grid.innerHTML = "";
  PRESET_AVATARS.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Preset Space Avatar";
    img.className = "avatar-select-option";
    img.addEventListener("click", async () => {
      document.querySelectorAll(".avatar-select-option").forEach((el) => el.classList.remove("selected"));
      img.classList.add("selected");
      await updateAvatar(url);
      modal.classList.add("hidden");
    });
    grid.appendChild(img);
  });

  if (saveCustomBtn && customUrlInput) {
    saveCustomBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = customUrlInput.value.trim();
      if (!url) {
        showToast("Error", "Please enter a valid URL.", "error");
        return;
      }
      await updateAvatar(url);
      customUrlInput.value = "";
      modal.classList.add("hidden");
    });
  }

  async function updateAvatar(url) {
    const user = currentUser || auth.currentUser;
    if (!user) return;
    try {
      await db.collection("users").doc(user.uid).update({ avatar: url });
      showToast("Avatar Updated", "Spacesuit helmet coordinates matched.", "success");
    } catch (err) {
      console.error("Failed to update avatar:", err);
      showToast("Error", err.message || String(err), "error");
    }
  }
}

// ============================================================
// VIDEOS / COSMIC REELS PANEL
// ============================================================

function initVideosPanel() {
  const uploadTrigger = document.getElementById("upload-reel-trigger");
  const videoModal = document.getElementById("video-modal");
  const videoModalCloseBtn = document.getElementById("video-modal-close-btn");
  const videoFileInput = document.getElementById("video-file-input");
  const videoSelectedName = document.getElementById("video-file-selected-name");
  const videoUploadForm = document.getElementById("video-upload-form");
  const videosGrid = document.getElementById("videos-grid-wrapper");
  const videosEmpty = document.getElementById("videos-empty-state");

  // Open/close modal
  if (uploadTrigger && videoModal) {
    uploadTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      videoModal.classList.remove("hidden");
    });
  }
  if (videoModalCloseBtn && videoModal) {
    videoModalCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      videoModal.classList.add("hidden");
      selectedVideoFile = null;
      if (videoFileInput) videoFileInput.value = "";
      if (videoSelectedName) { videoSelectedName.textContent = ""; videoSelectedName.classList.add("hidden"); }
    });
  }

  // File selection
  if (videoFileInput && videoSelectedName) {
    videoFileInput.addEventListener("change", () => {
      const file = videoFileInput.files?.[0] || null;
      selectedVideoFile = file;
      if (file) {
        videoSelectedName.textContent = `✅ ${file.name}`;
        videoSelectedName.classList.remove("hidden");
      } else {
        videoSelectedName.textContent = "";
        videoSelectedName.classList.add("hidden");
      }
    });
  }

  // Upload submit
  if (videoUploadForm) {
    videoUploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = currentUser || auth.currentUser;
      if (!user) { showToast("Not signed in", "Please log in.", "error"); return; }
      if (!selectedVideoFile) { showToast("No file", "Please select a video file.", "error"); return; }

      const title = document.getElementById("video-title")?.value?.trim() || "";
      const description = document.getElementById("video-description")?.value?.trim() || "";
      if (!title) { showToast("Missing title", "Please add a title for your reel.", "error"); return; }

      const submitBtn = document.getElementById("video-upload-submit-btn");
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Uploading..."; }

      try {
        // Upload video file to Firebase Storage
        const fileExt = selectedVideoFile.name.split('.').pop();
        const storageRef = storage.ref(`videos/${user.uid}_${Date.now()}.${fileExt}`);
        const uploadTask = await storageRef.put(selectedVideoFile);
        const videoDataUrl = await uploadTask.ref.getDownloadURL();

        const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
        const userAvatar = currentUserProfile?.avatar || "";

        await db.collection("videos").add({
          title,
          description,
          videoUrl: videoDataUrl,
          userId: user.uid,
          username,
          userAvatar,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        videoUploadForm.reset();
        selectedVideoFile = null;
        if (videoSelectedName) { videoSelectedName.textContent = ""; videoSelectedName.classList.add("hidden"); }
        videoModal.classList.add("hidden");
        showToast("Reel Launched!", "Your cosmic reel is now live.", "success");
      } catch (err) {
        console.error("Video upload failed:", err);
        showToast("Upload Failed", err.message || String(err), "error");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Launch Reel 🚀"; }
      }
    });
  }

  // Load videos from Firestore
  if (videosGrid) {
    if (_videosListener) _videosListener();
    _videosListener = db.collection("videos")
      .orderBy("createdAt", "desc")
      .onSnapshot((snap) => {
        videosGrid.innerHTML = "";
        if (snap.empty) {
          if (videosEmpty) videosEmpty.classList.remove("hidden");
          return;
        }
        if (videosEmpty) videosEmpty.classList.add("hidden");
        snap.forEach((doc) => {
          const v = doc.data();
          const card = document.createElement("div");
          card.className = "video-card glass";
          card.innerHTML = `
            <div class="video-card-player">
              <video src="${v.videoUrl || ""}" class="video-player" preload="metadata" playsinline></video>
              <div class="video-play-overlay" title="Play">
                <div class="video-play-icon">▶</div>
              </div>
            </div>
            <div class="video-card-info">
              <div class="video-card-user">
                <img src="${v.userAvatar || ""}" alt="avatar" class="avatar-sm">
                <span class="video-card-username">@${v.username || "user"}</span>
              </div>
              <h4 class="video-card-title">${(v.title || "").replace(/</g, "&lt;")}</h4>
              <p class="video-card-desc">${(v.description || "").replace(/</g, "&lt;")}</p>
            </div>
          `;

          // Play/pause on overlay click
          const videoEl = card.querySelector("video");
          const overlay = card.querySelector(".video-play-overlay");
          const playIcon = card.querySelector(".video-play-icon");
          if (overlay && videoEl) {
            overlay.addEventListener("click", (e) => {
              e.stopPropagation();
              if (videoEl.paused) {
                videoEl.play();
                overlay.classList.add("playing");
                playIcon.textContent = "⏸";
              } else {
                videoEl.pause();
                overlay.classList.remove("playing");
                playIcon.textContent = "▶";
              }
            });
            videoEl.addEventListener("ended", () => {
              overlay.classList.remove("playing");
              playIcon.textContent = "▶";
            });
          }

          videosGrid.appendChild(card);
        });
      }, (err) => console.error("Videos listener failed:", err));
  }
}

// ============================================================
// NOTIFICATIONS & JOIN REQUESTS
// ============================================================

async function requestToJoinCommunity(commId, commData) {
  const user = currentUser || auth.currentUser;
  if (!user) return;
  const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
  const avatar = currentUserProfile?.avatar || "";

  try {
    // Check if request already exists
    const existing = await db.collection("joinRequests")
      .where("communityId", "==", commId)
      .where("requesterId", "==", user.uid)
      .where("status", "==", "pending")
      .get();
    
    if (!existing.empty) {
      showToast("Request Pending", "You have already requested to join this community.", "info");
      return;
    }

    await db.collection("joinRequests").add({
      communityId: commId,
      communityName: commData.name,
      hostId: commData.creatorId,
      requesterId: user.uid,
      requesterName: username,
      requesterAvatar: avatar,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast("Request Sent", `Your request to join ${commData.name} has been sent to the host.`, "success");
  } catch (err) {
    console.error("Join request failed:", err);
    showToast("Request Failed", err.message || String(err), "error");
  }
}

function initNotifications() {
  const wrapper = document.getElementById("notifications-wrapper");
  const badge = document.getElementById("notification-badge");
  if (!wrapper || !badge) return;

  const myUid = (currentUser || auth.currentUser)?.uid;
  if (!myUid) return;

  if (_joinRequestsListener) _joinRequestsListener();

  _joinRequestsListener = db.collection("joinRequests")
    .where("hostId", "==", myUid)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      wrapper.innerHTML = "";
      
      if (snap.empty) {
        badge.classList.add("hidden");
        wrapper.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">✨</span>
            <h3>All clear in this sector</h3>
            <p>No new notifications.</p>
          </div>
        `;
        return;
      }

      badge.textContent = snap.size;
      badge.classList.remove("hidden");

      snap.forEach((doc) => {
        const req = doc.data();
        const card = document.createElement("div");
        card.className = "notification-card";
        card.innerHTML = `
          <div class="notif-info">
            <img src="${req.requesterAvatar || 'https://via.placeholder.com/48'}" alt="avatar" class="notif-avatar">
            <div class="notif-text">
              <h4><span>@${req.requesterName}</span> requested to join <span>${req.communityName}</span></h4>
            </div>
          </div>
          <div class="notif-actions">
            <button class="btn btn-approve" data-id="${doc.id}" data-comm="${req.communityId}" data-req="${req.requesterId}">Approve</button>
            <button class="btn btn-reject" data-id="${doc.id}">Reject</button>
          </div>
        `;

        // Approve
        const btnApprove = card.querySelector(".btn-approve");
        if (btnApprove) {
          btnApprove.addEventListener("click", async () => {
            try {
              // 1. Add to community allowlist
              await db.collection("communities").doc(req.communityId).update({
                allowedUsers: firebase.firestore.FieldValue.arrayUnion(req.requesterId)
              });
              // 2. Mark request as approved
              await db.collection("joinRequests").doc(doc.id).update({ status: "approved" });
              showToast("Approved", `@${req.requesterName} has been added to ${req.communityName}.`, "success");
            } catch (err) {
              console.error(err);
              showToast("Error", err.message, "error");
            }
          });
        }

        // Reject
        const btnReject = card.querySelector(".btn-reject");
        if (btnReject) {
          btnReject.addEventListener("click", async () => {
            try {
              await db.collection("joinRequests").doc(doc.id).update({ status: "rejected" });
              showToast("Rejected", `Request denied.`, "info");
            } catch (err) {
              console.error(err);
              showToast("Error", err.message, "error");
            }
          });
        }

        wrapper.appendChild(card);
      });
    }, (err) => {
      console.error("Notifications listener failed:", err);
      // Depending on if index exists, this might need one. But single field equality + orderBy often requires an index.
      // The Firebase error will supply a link to create it if needed.
    });
}

// ============================================================
// COMMUNITIES (Orbit Board Details and Stream)
// ============================================================

function loadCommunitiesList() {
  const wrapper = document.getElementById("communities-list-wrapper");
  if (!wrapper) return;

  if (_communitiesListener) _communitiesListener();

  _communitiesListener = db.collection("communities")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snap) => {
        wrapper.innerHTML = "";
        if (snap.empty) {
          wrapper.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>No orbital channels created yet. Create the first board!</p></div>`;
          return;
        }
        snap.forEach((doc) => {
          const c = doc.data();
          const card = document.createElement("div");
          card.className = "community-card glass";
          const privacyBadge = c.isPrivate ? `<span class="comm-private-badge">🔒 Private</span>` : `<span class="comm-public-badge">🌐 Public</span>`;
          const joinBtnLabel = c.isPrivate ? "Request to Join" : "Orbit";
          card.innerHTML = `
            <div class="comm-card-banner">
              <div class="comm-card-icon">🚀</div>
              ${privacyBadge}
            </div>
            <div class="comm-card-body">
              <h3>${c.name || "c/board"}</h3>
              <span class="comm-topic-badge">Topic: ${c.topic || "General"}</span>
              <p class="comm-card-desc">${c.description || ""}</p>
            </div>
            <div class="comm-card-footer">
              <span class="comm-members-count">${c.membersCount || 1} Orbiters</span>
              <button class="btn primary-btn comm-join-btn">${joinBtnLabel}</button>
            </div>
          `;
          card.addEventListener("click", () => {
            openCommunityView(doc.id, c);
          });
          
          const joinBtn = card.querySelector(".comm-join-btn");
          if (joinBtn) {
            joinBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const myUid = (currentUser || auth.currentUser)?.uid;
              if (c.isPrivate && c.creatorId !== myUid && !(c.allowedUsers && c.allowedUsers.includes(myUid))) {
                requestToJoinCommunity(doc.id, c);
              } else {
                openCommunityView(doc.id, c);
              }
            });
          }
          wrapper.appendChild(card);
        });
      },
      (err) => console.error("Communities failed to load:", err)
    );
}

function openCommunityView(commId, commData) {
  const listWrapper = document.getElementById("communities-list-wrapper");
  const singleView = document.getElementById("single-community-view");
  if (!listWrapper || !singleView) return;

  const myUid = (currentUser || auth.currentUser)?.uid;
  const isCreator = commData.creatorId === myUid;
  const iAmAllowed = commData.allowedUsers && commData.allowedUsers.includes(myUid);
  
  if (commData.isPrivate && !isCreator && !iAmAllowed) {
    showToast("Access Denied", "This community is private and you are not on the allowlist.", "error");
    return;
  }

  listWrapper.classList.add("hidden");
  singleView.classList.remove("hidden");

  setText("comm-view-name", commData.name);
  setText("comm-view-topic", `Topic: ${commData.topic}`);
  setText("comm-view-description", commData.description);
  setText("comm-view-members", `${commData.membersCount || 1} Orbiters in range`);

  const postsWrapper = document.getElementById("comm-posts-wrapper");
  if (postsWrapper) {
    postsWrapper.innerHTML = "";
    db.collection("posts")
      .where("communityId", "==", commId)
      .onSnapshot((snap) => {
        postsWrapper.innerHTML = "";
        if (snap.empty) {
          postsWrapper.innerHTML = `<div class="empty-state" style="padding: 20px;"><p>No telemetry broadcasts in this board yet.</p></div>`;
          return;
        }
        const commPostsList = [];
        snap.forEach((doc) => commPostsList.push(doc));
        // Sort in memory
        commPostsList.sort((a, b) => {
          const tA = a.data().createdAt?.seconds || 0;
          const tB = b.data().createdAt?.seconds || 0;
          return tB - tA;
        });
        commPostsList.forEach((doc) => postsWrapper.appendChild(renderPostCard(doc)));
      });
  }

  const composer = singleView.querySelector(".comm-post-composer");
  if (composer) {
    composer.innerHTML = `
      <button id="comm-post-trigger" class="btn primary-btn btn-full">Post to this Sector</button>
      <div id="comm-post-form-wrap" class="post-creator-box glass hidden" style="margin-top:10px;">
        <textarea id="comm-post-text" placeholder="Broadcast telemetry signal to this community board..." rows="3" class="glass-textarea"></textarea>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
          <button id="comm-post-cancel" class="btn text-btn">Discard</button>
          <button id="comm-post-submit" class="btn primary-btn">Launch Signal</button>
        </div>
      </div>
    `;

    const trigger = composer.querySelector("#comm-post-trigger");
    const formWrap = composer.querySelector("#comm-post-form-wrap");
    const cancel = composer.querySelector("#comm-post-cancel");
    const submit = composer.querySelector("#comm-post-submit");

    if (trigger && formWrap) {
      trigger.addEventListener("click", () => {
        trigger.classList.add("hidden");
        formWrap.classList.remove("hidden");
      });
    }
    if (cancel && trigger && formWrap) {
      cancel.addEventListener("click", () => {
        formWrap.classList.add("hidden");
        trigger.classList.remove("hidden");
        const textarea = composer.querySelector("#comm-post-text");
        if (textarea) textarea.value = "";
      });
    }
    if (submit && trigger && formWrap) {
      submit.addEventListener("click", async () => {
        const textarea = composer.querySelector("#comm-post-text");
        const text = textarea?.value?.trim();
        if (!text) return;

        submit.disabled = true;
        const user = currentUser || auth.currentUser;
        if (!user) return;
        const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
        const userAvatar = currentUserProfile?.avatar || "";

        try {
          // Fixed: added authorId
          await db.collection("posts").add({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            commentsCount: 0,
            gradient: "none",
            image: "",
            likes: 0,
            likedBy: [],
            text,
            userAvatar,
            userId: user.uid,
            authorId: user.uid, 
            username,
            communityId: commId,
            communityName: commData.name
          });

          textarea.value = "";
          formWrap.classList.add("hidden");
          trigger.classList.remove("hidden");
          showToast("Signal Transmitted", "Board transmission completed.", "success");
        } catch (err) {
          console.error("Community post failed:", err);
          showToast("Post Failed", err.message || String(err), "error");
        } finally {
          submit.disabled = false;
        }
      });
    }
  }
}

// ============================================================
// USER STORIES SYSTEM
// ============================================================

function loadStories() {
  const wrapper = document.getElementById("stories-wrapper");
  if (!wrapper) return;

  if (_storiesListener) _storiesListener();

  _storiesListener = db.collection("stories")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snap) => {
        const createItem = wrapper.querySelector(".create-story-item");
        wrapper.innerHTML = "";
        if (createItem) wrapper.appendChild(createItem);

        const now = Date.now();
        const activeStories = [];
        snap.forEach((doc) => {
          const s = doc.data();
          const expiresAt = s.expiresAt || (s.createdAt?.toMillis?.() || now) + 24 * 60 * 60 * 1000;
          if (expiresAt > now) {
            activeStories.push({ id: doc.id, ...s });
          }
        });

        activeStories.forEach((s) => {
          const item = document.createElement("div");
          item.className = "story-item";
          item.innerHTML = `
            <div class="story-circle">
              <img src="${s.avatar || ""}" alt="avatar">
            </div>
            <span class="story-username">${s.username || "Traveler"}</span>
          `;
          item.addEventListener("click", () => {
            playStory(s);
          });
          wrapper.appendChild(item);
        });
      },
      (err) => console.error("Stories load failed:", err)
    );
}

let storyTimer = null;

function playStory(story) {
  const modal = document.getElementById("story-modal");
  const fill = document.getElementById("story-progress-fill");
  const avatar = document.getElementById("story-modal-avatar");
  const username = document.getElementById("story-modal-username");
  const timeLabel = document.getElementById("story-modal-time");
  const image = document.getElementById("story-modal-image");
  const caption = document.getElementById("story-modal-caption");
  const closeBtn = document.getElementById("story-close-btn");

  if (!modal || !fill) return;

  setImg(avatar, story.avatar);
  username.textContent = story.username || "Traveler";
  image.src = story.image || "";
  caption.textContent = story.caption || "";

  let ageText = "2h ago";
  if (story.createdAt) {
    const createdMs = story.createdAt.toMillis?.() || Date.now();
    const diffHours = Math.floor((Date.now() - createdMs) / 3600000);
    ageText = diffHours <= 0 ? "Just now" : `${diffHours}h ago`;
  }
  timeLabel.textContent = ageText;

  modal.classList.remove("hidden");

  // Animate progress bar
  let start = null;
  const duration = 5000; // 5 seconds
  fill.style.width = "0%";

  if (storyTimer) cancelAnimationFrame(storyTimer);

  function step(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(100, (elapsed / duration) * 100);
    fill.style.width = `${progress}%`;

    if (elapsed < duration) {
      storyTimer = requestAnimationFrame(step);
    } else {
      closeStory();
    }
  }
  storyTimer = requestAnimationFrame(step);

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      closeStory();
    };
  }
}

function closeStory() {
  const modal = document.getElementById("story-modal");
  if (modal) modal.classList.add("hidden");
  if (storyTimer) cancelAnimationFrame(storyTimer);
}

// ============================================================
// DIRECT INTERSTELLAR MESSAGING
// ============================================================

function initMessaging() {
  const chatsList = document.getElementById("chats-list-wrapper");
  const sendBtn = document.getElementById("send-chat-btn");
  const chatInput = document.getElementById("chat-message-input");
  const emojiBtn = document.getElementById("chat-emoji-btn");
  const emojiPopup = document.getElementById("emoji-popup");

  if (!chatsList) return;

  if (_messagingUsersListener) _messagingUsersListener();

  _messagingUsersListener = db.collection("users").onSnapshot((snap) => {
    chatsList.innerHTML = "";
    snap.forEach((doc) => {
      if (doc.id === currentUser?.uid) return;
      const u = doc.data();
      const card = document.createElement("div");
      card.className = "chat-list-card";
      card.dataset.uid = doc.id;
      card.innerHTML = `
        <div class="chat-avatar-wrapper">
          <img src="${u.avatar || ""}" alt="avatar" class="avatar-sm">
          <span class="online-indicator active"></span>
        </div>
        <div class="chat-card-texts">
          <div class="chat-card-header">
            <span class="chat-card-name">${u.fullname || u.username || "Traveler"}</span>
          </div>
          <div class="chat-card-preview">@${u.username || "user"}</div>
        </div>
      `;
      card.addEventListener("click", () => {
        document.querySelectorAll(".chat-list-card").forEach((el) => el.classList.remove("active"));
        card.classList.add("active");
        openChatWith(doc.id, u);
      });
      chatsList.appendChild(card);
    });
  });

  if (sendBtn) {
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendChatMessage();
    });
  }
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  if (emojiBtn && emojiPopup) {
    emojiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      emojiPopup.classList.toggle("hidden");
    });
    document.querySelectorAll(".emoji-select").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (chatInput) {
          chatInput.value += el.textContent;
          chatInput.focus();
        }
        emojiPopup.classList.add("hidden");
      });
    });
    document.addEventListener("click", (e) => {
      if (emojiPopup.classList.contains("hidden")) return;
      if (emojiPopup.contains(e.target) || emojiBtn.contains(e.target)) return;
      emojiPopup.classList.add("hidden");
    });
  }
}

function openChatWith(targetUid, targetUser) {
  const emptyState = document.getElementById("chat-empty-state");
  const activeBox = document.getElementById("chat-active-box");
  const chatAvatar = document.getElementById("chat-header-avatar");
  const chatName = document.getElementById("chat-header-name");
  const chatHandle = document.getElementById("chat-header-handle");
  const messagesFlow = document.getElementById("chat-messages-flow");
  const typingIndicator = document.getElementById("chat-typing-indicator");

  if (!activeBox || !emptyState) return;

  emptyState.classList.add("hidden");
  activeBox.classList.remove("hidden");

  setImg(chatAvatar, targetUser.avatar);
  if (chatName) chatName.textContent = targetUser.fullname || targetUser.username || "Traveler";
  if (chatHandle) chatHandle.textContent = `@${targetUser.username || "user"}`;

  if (activeChatListener) activeChatListener();

  const myUid = currentUser.uid;
  activeChatId = [myUid, targetUid].sort().join("_");

  // Show a faked radio-link signal syncing (typing indicator) briefly
  if (typingIndicator) {
    typingIndicator.classList.remove("hidden");
    setTimeout(() => {
      typingIndicator.classList.add("hidden");
    }, 1200);
  }

  activeChatListener = db.collection("chats")
    .doc(activeChatId)
    .collection("messages")
    .orderBy("timestamp", "asc")
    .onSnapshot((snap) => {
      if (messagesFlow) {
        messagesFlow.innerHTML = "";
        snap.forEach((doc) => {
          const m = doc.data();
          const wrap = document.createElement("div");
          const isOutgoing = m.senderId === myUid;
          wrap.className = `msg-bubble-wrap ${isOutgoing ? "outgoing" : "incoming"}`;

          let timeStr = "";
          if (m.timestamp) {
            const date = m.timestamp.toDate?.() || new Date(m.timestamp);
            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          wrap.innerHTML = `
            <div class="msg-bubble">${(m.text || "").replace(/</g, "&lt;")}</div>
            <span class="msg-time">${timeStr}</span>
          `;
          messagesFlow.appendChild(wrap);
        });
        messagesFlow.scrollTop = messagesFlow.scrollHeight;
      }
    });
}

async function sendChatMessage() {
  const input = document.getElementById("chat-message-input");
  if (!input || !activeChatId || !currentUser) return;
  const text = input.value.trim();
  if (!text) return;

  try {
    input.value = "";
    await db.collection("chats")
      .doc(activeChatId)
      .collection("messages")
      .add({
        senderId: currentUser.uid,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  } catch (err) {
    console.error("Failed to send message:", err);
    showToast("Transmission Error", err.message || String(err), "error");
  }
}

// ============================================================
// USER FOLLOW SYSTEM
// ============================================================

async function toggleFollow(targetUserId) {
  const user = currentUser || auth.currentUser;
  if (!user) return;
  
  const isFollowing = currentUserProfile?.following?.includes(targetUserId);
  const myRef = db.collection("users").doc(user.uid);
  const targetRef = db.collection("users").doc(targetUserId);

  // #region agent log
  fetch('http://127.0.0.1:7660/ingest/7f509506-75fc-4924-98b0-2b5712ae800c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aab436'},body:JSON.stringify({sessionId:'aab436',location:'script.js:toggleFollow',message:'toggleFollow called',data:{targetUserId,isFollowing,myUid:user.uid},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  try {
    if (isFollowing) {
      await myRef.update({
        following: firebase.firestore.FieldValue.arrayRemove(targetUserId)
      });
      await targetRef.update({
        followers: firebase.firestore.FieldValue.arrayRemove(user.uid)
      });
      showToast("Link Terminated", "Orbital link with starseed severed.", "success");
    } else {
      await myRef.update({
        following: firebase.firestore.FieldValue.arrayUnion(targetUserId)
      });
      await targetRef.update({
        followers: firebase.firestore.FieldValue.arrayUnion(user.uid)
      });
      showToast("Link Connected", "Telemetry sync established.", "success");
    }
    const mySnap = await myRef.get();
    currentUserProfile = mySnap.data();
    const targetSnap = await targetRef.get();
    // #region agent log
    fetch('http://127.0.0.1:7660/ingest/7f509506-75fc-4924-98b0-2b5712ae800c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aab436'},body:JSON.stringify({sessionId:'aab436',location:'script.js:toggleFollow:success',message:'toggleFollow succeeded',data:{myFollowing:currentUserProfile?.following?.length,targetFollowers:(targetSnap.data()?.followers||[]).length},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7660/ingest/7f509506-75fc-4924-98b0-2b5712ae800c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aab436'},body:JSON.stringify({sessionId:'aab436',location:'script.js:toggleFollow:error',message:'toggleFollow failed',data:{error:err.message,code:err.code},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error("Toggle follow failed:", err);
    showToast("Error", err.message || String(err), "error");
  }
}

// ============================================================
// COSMIC SEMANTIC SEARCH
// ============================================================

const SEARCH_EXPANSION = {
  "sun": ["solar", "heliophysics", "heat", "star", "flare", "corona", "sun"],
  "moon": ["lunar", "apollo", "eclipse", "orbit", "crater", "moon"],
  "nebula": ["orion", "hubble", "jwst", "clouds", "dust", "starfield", "nebula"],
  "mars": ["rover", "perseverance", "colonization", "red planet", "elon", "spacex", "mars"],
  "blackhole": ["singularity", "event horizon", "gravity", "warp", "hawking", "blackhole"],
  "space": ["galaxy", "cosmos", "astronomy", "astronaut", "orbit", "space"]
};

function initSearch() {
  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear-btn");
  const filterTabs = document.querySelectorAll(".filter-tab");

  if (!searchInput) return;

  let searchDebounce = null;
  searchInput.addEventListener("input", () => {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      performSearch();
    }, 300);
  });

  if (searchClear) {
    searchClear.addEventListener("click", (e) => {
      e.preventDefault();
      searchInput.value = "";
      performSearch();
    });
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      performSearch();
    });
  });
}

async function performSearch() {
  const input = document.getElementById("search-input");
  const wrapper = document.getElementById("search-results-wrapper");
  const activeTab = document.querySelector(".filter-tab.active")?.dataset.filter || "all";

  if (!input || !wrapper) return;

  const query = input.value.trim().toLowerCase();
  if (!query) {
    wrapper.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🛰️</span>
        <h3>Scan the Sectors</h3>
        <p>Enter queries to find space crews, relevant orbital transmissions, or planetary circles.</p>
        <div class="popular-tags">
          <span class="tag">#Nebula</span>
          <span class="tag">#BlackHole</span>
          <span class="tag">#JamesWebb</span>
          <span class="tag">#Astronomy</span>
          <span class="tag">#MarsColonization</span>
        </div>
      </div>
    `;
    wrapper.querySelectorAll(".tag").forEach(tag => {
      tag.addEventListener("click", () => {
        input.value = tag.textContent;
        performSearch();
      });
    });
    return;
  }

  // Expand semantically
  let searchTerms = [query];
  Object.keys(SEARCH_EXPANSION).forEach((key) => {
    if (query.includes(key)) {
      searchTerms = [...searchTerms, ...SEARCH_EXPANSION[key]];
    }
  });

  wrapper.innerHTML = `
    <div class="stream-loader">
      <div class="orbiting-loader">
        <div class="loader-planet"></div>
        <div class="loader-satellite"></div>
      </div>
      <p>Scanning sectors semantically...</p>
    </div>
  `;

  try {
    const [postsSnap, usersSnap, commSnap] = await Promise.all([
      db.collection("posts").get(),
      db.collection("users").get(),
      db.collection("communities").get()
    ]);

    const results = [];

    if (activeTab === "all" || activeTab === "users") {
      usersSnap.forEach((doc) => {
        const u = doc.data();
        if (doc.id === currentUser?.uid) return;
        const name = (u.fullname || "").toLowerCase();
        const handle = (u.username || "").toLowerCase();

        const match = searchTerms.some(t => name.includes(t) || handle.includes(t));
        if (match) {
          results.push({ type: "user", id: doc.id, data: u, relevance: 1.0 });
        }
      });
    }

    if (activeTab === "all" || activeTab === "posts") {
      postsSnap.forEach((doc) => {
        const p = doc.data();
        const text = (p.text || "").toLowerCase();
        const user = (p.username || "").toLowerCase();

        const match = searchTerms.some(t => text.includes(t) || user.includes(t));
        if (match) {
          results.push({ type: "post", id: doc.id, data: p, relevance: 0.9 });
        }
      });
    }

    if (activeTab === "all" || activeTab === "communities") {
      commSnap.forEach((doc) => {
        const c = doc.data();
        const name = (c.name || "").toLowerCase();
        const topic = (c.topic || "").toLowerCase();
        const desc = (c.description || "").toLowerCase();

        const match = searchTerms.some(t => name.includes(t) || topic.includes(t) || desc.includes(t));
        if (match) {
          results.push({ type: "community", id: doc.id, data: c, relevance: 0.8 });
        }
      });
    }

    results.sort((a, b) => b.relevance - a.relevance);

    wrapper.innerHTML = "";
    if (results.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🛰️</span>
          <h3>No Signals Detected</h3>
          <p>No transmissions matched: "${query}"</p>
        </div>
      `;
      return;
    }

    results.forEach((res) => {
      if (res.type === "user") {
        const card = document.createElement("div");
        card.className = "search-result-card glass";
        const isFollowing = currentUserProfile?.following?.includes(res.id);
        card.innerHTML = `
          <div class="result-card-left">
            <img src="${res.data.avatar || ""}" alt="avatar" class="avatar-md" style="width:40px; height:40px;">
            <div class="result-card-details">
              <h4>${res.data.fullname || "Traveler"}</h4>
              <div class="desc">@${res.data.username || "user"}</div>
            </div>
          </div>
          <div class="result-card-right">
            <span class="result-type-badge">Starseed</span>
            <button class="btn glass-btn follow-toggle-btn" data-uid="${res.id}">
              ${isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        `;
        card.querySelector(".follow-toggle-btn").addEventListener("click", async (e) => {
          e.stopPropagation();
          const btn = e.target;
          btn.disabled = true;
          await toggleFollow(res.id);
          btn.disabled = false;
          performSearch();
        });
        wrapper.appendChild(card);
      } else if (res.type === "post") {
        const card = renderPostCard({ id: res.id, data: () => res.data });
        const header = card.querySelector(".post-card-header");
        if (header) {
          const score = document.createElement("div");
          score.className = "semantic-match-score";
          score.textContent = "98% Cognitive Match";
          header.appendChild(score);
        }
        wrapper.appendChild(card);
      } else if (res.type === "community") {
        const card = document.createElement("div");
        card.className = "search-result-card glass";
        card.innerHTML = `
          <div class="result-card-left">
            <span style="font-size:1.8rem; padding: 10px;">🚀</span>
            <div class="result-card-details">
              <h4>${res.data.name || "Community"}</h4>
              <div class="desc">Topic: ${res.data.topic || "General"} • ${res.data.description || ""}</div>
            </div>
          </div>
          <div class="result-card-right">
            <span class="result-type-badge">Orbital Board</span>
            <button class="btn primary-btn view-comm-btn">Enter Board</button>
          </div>
        `;
        card.addEventListener("click", () => {
          const commNav = document.getElementById("nav-communicate");
          if (commNav) {
            commNav.click();
            setTimeout(() => {
              openCommunityView(res.id, res.data);
            }, 150);
          }
        });
        wrapper.appendChild(card);
      }
    });
  } catch (err) {
    console.error("Search failure:", err);
    wrapper.innerHTML = `<div class="empty-state"><p>Search failed: ${err.message}</p></div>`;
  }
}

// ============================================================
// STELLAR CALENDAR EVENTS
// ============================================================

let calendarCursor = new Date();
calendarCursor.setDate(1);

function renderCalendar() {
  const calPrev = document.getElementById("calendar-prev-month");
  const calNext = document.getElementById("calendar-next-month");
  const calLabel = document.getElementById("calendar-month-year-label");
  const calDays = document.getElementById("calendar-days-wrapper");
  const eventCard = document.getElementById("calendar-event-card");
  const closeEventDetailsBtn = document.getElementById("close-event-details-btn");

  if (!calDays || !calLabel) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const monthEvents = STELLAR_EVENTS.filter(e => {
    const d = new Date(e.dateStr + "T12:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });
  // #region agent log
  fetch('http://127.0.0.1:7660/ingest/7f509506-75fc-4924-98b0-2b5712ae800c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aab436'},body:JSON.stringify({sessionId:'aab436',location:'script.js:renderCalendar',message:'renderCalendar called',data:{year,month,monthEventsCount:monthEvents.length,totalEvents:STELLAR_EVENTS.length},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); 
  const daysInMonth = lastDay.getDate();

  const monthName = firstDay.toLocaleString(undefined, { month: "long" });
  calLabel.textContent = `${monthName} ${year}`;

  calDays.innerHTML = "";
  const today = new Date();

  // Add leading cells
  for (let i = 0; i < startWeekday; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell day-empty";
    calDays.appendChild(cell);
  }

  // Populate actual cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-day-cell";
    
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      cell.classList.add("day-today");
    }

    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const hasEvent = STELLAR_EVENTS.find(e => e.dateStr === dateString);

    cell.innerHTML = `<span class="day-number">${d}</span>`;
    
    if (hasEvent) {
      cell.classList.add("day-has-event");
      cell.innerHTML += `<div class="day-event-dot"></div>`;
    }

    cell.addEventListener("click", () => {
      if (hasEvent) {
        showEventDetails(hasEvent);
      } else {
        if (eventCard) setHidden(eventCard, true);
      }
    });

    calDays.appendChild(cell);
  }

  if (calPrev && !calPrev.dataset.wired) {
    calPrev.dataset.wired = "1";
    calPrev.addEventListener("click", () => {
      calendarCursor.setMonth(calendarCursor.getMonth() - 1);
      renderCalendar();
    });
  }
  if (calNext && !calNext.dataset.wired) {
    calNext.dataset.wired = "1";
    calNext.addEventListener("click", () => {
      calendarCursor.setMonth(calendarCursor.getMonth() + 1);
      renderCalendar();
    });
  }
  if (closeEventDetailsBtn && !closeEventDetailsBtn.dataset.wired) {
    closeEventDetailsBtn.dataset.wired = "1";
    closeEventDetailsBtn.addEventListener("click", () => {
      if (eventCard) setHidden(eventCard, true);
    });
  }
}

function showEventDetails(event) {
  const card = document.getElementById("calendar-event-card");
  const dateBadge = document.getElementById("event-details-date-badge");
  const title = document.getElementById("event-details-title");
  const desc = document.getElementById("event-details-description");
  const scientistsBox = document.getElementById("event-details-scientists-box");

  if (!card || !dateBadge || !title || !desc || !scientistsBox) return;

  const dateObj = new Date(event.dateStr + "T12:00:00");
  const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  
  dateBadge.textContent = formattedDate;
  title.textContent = event.title;
  desc.textContent = event.description;

  scientistsBox.innerHTML = "";
  if (event.scientists && event.scientists.length > 0) {
    const header = document.createElement("h4");
    header.textContent = "Cosmic Milestones";
    header.style.fontSize = "0.9rem";
    header.style.marginBottom = "8px";
    scientistsBox.appendChild(header);

    event.scientists.forEach((sci) => {
      const parts = sci.split(" - ");
      const name = parts[0] || "";
      const meta = parts[1] || "";

      const item = document.createElement("div");
      item.className = "scientist-highlight-item";
      item.innerHTML = `
        <div style="font-size:1.2rem;">👨‍🚀</div>
        <div>
          <div class="scientist-name">${name}</div>
          <div class="scientist-meta">${meta}</div>
        </div>
      `;
      scientistsBox.appendChild(item);
    });
  }

  card.classList.remove("hidden");
}

// ============================================================
// SPACE PARTICLES BACKGROUND CANVAS
// ============================================================

function initSpaceCanvas() {
  const canvas = document.getElementById("space-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let stars = [];
  const maxStars = 100;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.8 + 0.2,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      color: "#e0f2fe"
    });
  }

  function animate() {
    const theme = document.documentElement.getAttribute("data-theme") || "comet";
    let color = "#e0f2fe";
    let speed = 1.0;
    let gravitySpeed = 0.0;

    if (theme === "asteroids") {
      color = "#fcd34d";
      speed = 1.2;
    } else if (theme === "moon") {
      color = "#ffffff";
      speed = 0.4;
    } else if (theme === "sun") {
      color = "#ffedd5";
      speed = 1.8;
    } else if (theme === "blackhole") {
      color = "#e9d5ff";
      speed = 1.3;
      gravitySpeed = 0.015;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((star) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      if (theme === "blackhole") {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dx = cx - star.x;
        const dy = cy - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 15) {
          const force = 0.3 * speed;
          star.x += (dx / dist) * force - (dy / dist) * gravitySpeed * dist * 0.04;
          star.y += (dy / dist) * force + (dx / dist) * gravitySpeed * dist * 0.04;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.max(canvas.width, canvas.height) / 2;
          star.x = cx + Math.cos(angle) * radius;
          star.y = cy + Math.sin(angle) * radius;
          star.size = Math.random() * 1.8 + 0.2;
        }
      } else {
        star.x += star.speedX * speed;
        star.y += star.speedY * speed;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
      }
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================================
// LOCAL DATABASE (Unused mockup fallback)
// ============================================================

const LocalDB = {
  get: (k) => JSON.parse(localStorage.getItem("cs_" + k) || "null"),
  set: (k, v) => localStorage.setItem("cs_" + k, JSON.stringify(v)),
  reset() {
    localStorage.removeItem("cs_seeded");
    this.init();
  },
  init() {
    if (!this.get("seeded")) {
      this.set("users", []);
      this.set("seeded", true);
    }
  }
};
LocalDB.init();

// ============================================================
// SYSTEM TOASTS
// ============================================================

function showToast(title, body, type = "normal") {
  const c = document.getElementById("toast-container");
  if (!c) return;

  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-body">${body}</div>
  `;
  c.appendChild(t);

  setTimeout(() => {
    t.remove();
  }, 5000);
}

// ============================================================
// CLEANUP SNAPSHOTS
// ============================================================

function cleanupListeners() {
  if (_userProfileListener) { _userProfileListener(); _userProfileListener = null; }
  if (_postsListener) { _postsListener(); _postsListener = null; }
  if (_storiesListener) { _storiesListener(); _storiesListener = null; }
  if (_communitiesListener) { _communitiesListener(); _communitiesListener = null; }
  if (_messagingUsersListener) { _messagingUsersListener(); _messagingUsersListener = null; }
  if (_videosListener) { _videosListener(); _videosListener = null; }
  if (_joinRequestsListener) { _joinRequestsListener(); _joinRequestsListener = null; }
  if (activeChatListener) { activeChatListener(); activeChatListener = null; }
  
  Object.keys(commentsListeners).forEach((k) => {
    if (typeof commentsListeners[k] === "function") {
      commentsListeners[k]();
    }
  });
  commentsListeners = {};
}

// ============================================================
// AUTH CONTROLS & LISTENERS
// ============================================================

if (toRegisterBtn) {
  toRegisterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showPanel(registerPanel);
  });
}

if (toLoginBtn) {
  toLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showPanel(loginPanel);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      cleanupListeners();
      await auth.signOut();
    } catch (err) {
      console.error(err);
      showToast("Logout failed", err?.message || String(err), "error");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("reg-username")?.value?.trim();
    const email = document.getElementById("reg-email")?.value?.trim();
    const fullname = document.getElementById("reg-fullname")?.value?.trim();
    const birthDate = document.getElementById("reg-age")?.value;
    const password = document.getElementById("reg-password")?.value;
    const repassword = document.getElementById("reg-repassword")?.value;

    if (!username || !email || !fullname || !birthDate || !password) {
      showToast("Missing fields", "Please fill all required fields.", "error");
      return;
    }

    if (password !== repassword) {
      showToast("Password mismatch", "Please retype the same password.", "error");
      return;
    }

    try {
      const dob = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
      if (!Number.isFinite(age) || age < 0) age = null;

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await db.collection("users").doc(user.uid).set({
        username,
        fullname,
        email,
        age,
        avatar: "",
        bio: "",
        followers: [],
        following: [],
        password: password,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast("Account created", "Welcome to CometSync.", "success");
      showApp();
    } catch (error) {
      console.error(error);
      showToast("Registration failed", error?.message || String(error), "error");
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email")?.value?.trim();
    const password = document.getElementById("login-password")?.value;

    if (!email || !password) {
      showToast("Missing fields", "Enter your email and password.", "error");
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showToast("Welcome back", "Signed in successfully.", "success");
      showApp();
    } catch (error) {
      console.error(error);
      showToast("Login failed", error?.message || String(error), "error");
    }
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User logged in:", user.email);
    showApp();
    setupUserProfileListener(user);
  } else {
    console.log("No user logged in");
    cleanupListeners();
    showAuth();
  }
});