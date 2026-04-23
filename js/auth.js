// ─────────────────────────────────────────────
//  AUTH.JS — runs on every page
//  Manages: session checks, navbar state, helpers
// ─────────────────────────────────────────────

// Call this on every page to populate the nav
async function initNav() {
  const { data: { session } } = await db.auth.getSession();
  const user = session?.user ?? null;

  const navAuth     = document.getElementById('nav-auth');
  const navUpload   = document.getElementById('nav-upload');

  if (!navAuth) return user;

  if (user) {
    // Logged in — show profile link + logout
    navAuth.innerHTML = `
      <a href="profile.html?id=${user.id}" class="nav-link">Profile</a>
      <button onclick="logout()" class="nav-btn outline">Logout</button>
    `;
    if (navUpload) navUpload.style.display = 'inline';
  } else {
    // Logged out — show login / signup
    navAuth.innerHTML = `
      <a href="login.html"  class="nav-btn outline">Login</a>
      <a href="signup.html" class="nav-btn">Sign up</a>
    `;
    if (navUpload) navUpload.style.display = 'none';
  }

  return user;
}

// Sign out and redirect to feed
async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

// Use on pages that require login (upload, etc.)
// Returns user or redirects to login
async function requireAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

// ─── UTILITY HELPERS ───

// "2 hours ago" style timestamps
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Get username initial for avatar placeholder
function getInitial(username) {
  return username ? username.charAt(0).toUpperCase() : '?';
}

// Read a URL query param: getParam('id')
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}
