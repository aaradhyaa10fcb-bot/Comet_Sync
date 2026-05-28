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
  // Use the actual Cloud Storage bucket name (default is <project-id>.appspot.com).
  // The .firebasestorage.app host in requests leads to failing preflight/CORS.
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
let currentUser = null;
let currentUserProfile = null;
let selectedPostFile = null;
let selectedPostGradient = "none";
let selectedStoryFile = null;

// ============================================================
// UI HELPERS
// ============================================================

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle("hidden", !!hidden);
}

function showPanel(panelEl) {
  // Only one auth panel visible at a time
  setHidden(loginPanel, panelEl !== loginPanel);
  setHidden(registerPanel, panelEl !== registerPanel);
}

function showApp() {
  setHidden(authGateway, true);
  setHidden(appFrame, false);
  // Avoid race after sign-in: always prefer the actual current auth user
  if (!currentUser && auth.currentUser) currentUser = auth.currentUser;
  initAppInteractions();
}

function showAuth() {
  setHidden(appFrame, true);
  setHidden(authGateway, false);
  showPanel(loginPanel);
}

// ============================================================
// REAL USER PROFILE BINDING (Firestore -> UI)
// ============================================================

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

function setImg(idOrEl, url) {
  const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  el.src = url || "";
}

async function loadAndBindCurrentUser(user) {
  if (!user) return;
  currentUser = user;

  // Basic identity from Auth (always available)
  const email = user.email || "";
  setText("current-user-logged-info", `Logged in as: ${email ? email : "—"}`);

  // Load Firestore profile
  let profile = null;
  try {
    const doc = await db.collection("users").doc(user.uid).get();
    profile = doc.exists ? doc.data() : null;
  } catch (err) {
    console.error("Failed to load user profile:", err);
  }
  currentUserProfile = profile;

  const username = profile?.username || (email ? email.split("@")[0] : "—");
  const fullName = profile?.fullname || profile?.fullName || username || "—";
  const bio = profile?.bio || "—";
  const avatar = profile?.avatar || "";

  setText("profile-username-label", `@${username || "—"}`);
  setText("profile-fullname-label", fullName);
  setText("profile-bio-label", bio);

  // Age badge if present
  const age = profile?.age;
  if (age != null && age !== "") setText("profile-age-label", `Age: ${age}`);

  // Counts from profile document
  setText("profile-followers-count", numOrLen(profile?.followers));
  setText("profile-following-count", numOrLen(profile?.following));

  // Avatar binds
  setImg("profile-main-avatar", avatar);
  setImg("sidebar-profile-avatar", avatar);
  document.querySelectorAll("img.profile-pic-bind").forEach((img) => setImg(img, avatar));

  // Real post count (fallback: query and count)
  try {
    const snap = await db.collection("posts").where("userId", "==", user.uid).get();
    setText("profile-posts-count", snap.size);
  } catch (err) {
    console.error("Failed to count posts:", err);
  }
}

// ============================================================
// CORE APP INTERACTIONS (navigation / drawers)
// ============================================================

let _appInteractionsInitialized = false;

function initAppInteractions() {
  if (_appInteractionsInitialized) return;
  _appInteractionsInitialized = true;

  // Sidebar navigation: switch content panels
  const navItems = Array.from(document.querySelectorAll(".sidebar-nav .nav-item"));
  const panels = Array.from(document.querySelectorAll(".content-panel"));

  function activatePanel(panelId) {
    if (!panelId) return;
    panels.forEach((p) => p.classList.toggle("active", p.id === panelId));
    navItems.forEach((a) => a.classList.toggle("active", a.dataset.target === panelId));
  }

  navItems.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.dataset.target;
      if (target) activatePanel(target);
    });
  });

  // Settings drawer open/close
  const settingsDrawer = document.getElementById("settings-drawer");
  const settingsTriggerBtn = document.getElementById("settings-trigger-btn");
  const settingsCloseBtn = document.getElementById("settings-close-btn");

  function openSettings() {
    setHidden(settingsDrawer, false);
  }
  function closeSettings() {
    setHidden(settingsDrawer, true);
  }

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

  // Close settings when clicking outside drawer
  document.addEventListener("click", (e) => {
    if (!settingsDrawer || settingsDrawer.classList.contains("hidden")) return;
    if (settingsDrawer.contains(e.target)) return;
    if (settingsTriggerBtn && settingsTriggerBtn.contains(e.target)) return;
    closeSettings();
  });

  // Ensure home panel is active by default
  activatePanel("panel-home");

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
    // Convert to a smaller JPEG data URL to avoid Firestore doc size issues.
    // If anything fails, fall back to the original data URL.
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

      const out = canvas.toDataURL("image/jpeg", quality);
      return out || src;
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
        // Firebase Storage is not available/working for this project right now.
        // Store a small inline data URL directly in Firestore so uploads work locally and on Netlify.
        imageUrl = await imageFileToSmallDataURL(selectedPostFile);
      }

      const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
      const userAvatar = currentUserProfile?.avatar || "";

      await db.collection("posts").add({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        commentsCount: 0,
        gradient: selectedPostGradient,
        image: imageUrl,
        likes: 0,
        text,
        userAvatar,
        userId: user.uid,
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

  // Live feed rendering (minimal)
  function renderPostCard(doc) {
    const d = doc.data();
    const card = document.createElement("article");
    const gradientClass = d.gradient && d.gradient !== "none" ? ` backdrop-${d.gradient}` : "";
    card.className = `post-card${gradientClass}${d.gradient && d.gradient !== "none" ? " has-backdrop" : ""}`;
    const imgHtml = d.image ? `<img class="post-card-image" src="${d.image}" alt="Post image">` : "";
    card.innerHTML = `
      <div class="post-card-header">
        <div class="post-user-info">
          <img class="avatar-sm" src="${d.userAvatar || ""}" alt="avatar">
          <div class="post-user-texts">
            <h4>${d.username || "—"}</h4>
            <div class="handle">@${d.username || "—"}</div>
          </div>
        </div>
      </div>
      <div class="post-body">
        <p>${(d.text || "").replace(/</g, "&lt;")}</p>
      </div>
      ${imgHtml}
    `;
    return card;
  }

  if (postsWrapper) {
    db.collection("posts")
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot(
        (snap) => {
          postsWrapper.innerHTML = "";
          snap.forEach((doc) => postsWrapper.appendChild(renderPostCard(doc)));
        },
        (err) => console.error("Posts listener failed:", err)
      );
  }

  // Story upload (minimal): store and add a story document
  const storyUploadInput = document.getElementById("story-upload-input");
  const storiesWrapper = document.getElementById("stories-wrapper");

  if (storyUploadInput) {
    // Clicking the "Your Orbit" story item opens file picker
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
      selectedStoryFile = file;

      try {
        const imageUrl = await imageFileToSmallDataURL(file);
        const now = Date.now();
        const username = currentUserProfile?.username || (user.email ? user.email.split("@")[0] : "user");
        const avatar = currentUserProfile?.avatar || "";

        await db.collection("stories").add({
          avatar,
          caption: "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          expiresAt: now + 24 * 60 * 60 * 1000,
          image: imageUrl,
          userId: user.uid,
          username
        });

        storyUploadInput.value = "";
        selectedStoryFile = null;
        showToast("Story posted", "Your story is live.", "success");
      } catch (err) {
        console.error(err);
        showToast("Story failed", err?.message || String(err), "error");
      }
    });
  }

  // Calendar: render month grid + navigation
  const calPrev = document.getElementById("calendar-prev-month");
  const calNext = document.getElementById("calendar-next-month");
  const calLabel = document.getElementById("calendar-month-year-label");
  const calDays = document.getElementById("calendar-days-wrapper");
  const eventCard = document.getElementById("calendar-event-card");
  const closeEventDetailsBtn = document.getElementById("close-event-details-btn");

  let calendarCursor = new Date();
  calendarCursor.setDate(1);

  function renderCalendar() {
    if (!calDays || !calLabel) return;

    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    const monthName = firstDay.toLocaleString(undefined, { month: "long" });
    calLabel.textContent = `${monthName} ${year}`;

    calDays.innerHTML = "";
    const today = new Date();

    // Empty leading cells
    for (let i = 0; i < startWeekday; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-day-cell day-empty";
      calDays.appendChild(cell);
    }

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
      cell.textContent = String(d);
      cell.addEventListener("click", () => {
        // No events backend yet => just close details
        if (eventCard) setHidden(eventCard, true);
      });
      calDays.appendChild(cell);
    }
  }

  if (calPrev) {
    calPrev.addEventListener("click", (e) => {
      e.preventDefault();
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      renderCalendar();
    });
  }
  if (calNext) {
    calNext.addEventListener("click", (e) => {
      e.preventDefault();
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      renderCalendar();
    });
  }
  if (closeEventDetailsBtn) {
    closeEventDetailsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (eventCard) setHidden(eventCard, true);
    });
  }
  renderCalendar();

  // If user navigates to calendar later, ensure it redraws
  const _activatePanelOriginal = activatePanel;
  activatePanel = function patchedActivatePanel(panelId) {
    _activatePanelOriginal(panelId);
    if (panelId === "panel-calendar") {
      renderCalendar();
    }
  };
}

// ============================================================
// LOCAL DATABASE
// ============================================================

const LocalDB = {
  get: (k) => JSON.parse(localStorage.getItem("cs_" + k) || "null"),

  set: (k, v) =>
    localStorage.setItem("cs_" + k, JSON.stringify(v)),

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
// TOAST
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
// AUTH NAVIGATION
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
      await auth.signOut();
    } catch (err) {
      console.error(err);
      showToast("Logout failed", err?.message || String(err), "error");
    }
  });
}

// ============================================================
// REGISTER FORM
// ============================================================

if (registerForm) {

  registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const username = document.getElementById("reg-username")?.value?.trim();
    const email = document.getElementById("reg-email")?.value?.trim();
    const fullname = document.getElementById("reg-fullname")?.value?.trim();
    const birthDate = document.getElementById("reg-age")?.value; // yyyy-mm-dd
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

// ============================================================
// LOGIN FORM
// ============================================================

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

// ============================================================
// AUTH STATE
// ============================================================

auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User logged in:", user.email);
    showApp();
    loadAndBindCurrentUser(user);
  } else {
    console.log("No user logged in");
    showAuth();
  }
});