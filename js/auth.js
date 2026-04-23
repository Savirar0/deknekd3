// Global auth handler for DekNek3D

// Setup the navbar based on if we're logged in or not
async function initNav() {
  const { data: { session } } = await db.auth.getSession();
  const user = session?.user ?? null;

  const navAuth = document.getElementById('nav-auth');
  const navUpload = document.getElementById('nav-upload');

  if (!navAuth) return user;

  if (user) {
    // Show profile and logout if user exists
    navAuth.innerHTML = `
      <a href="profile.html?id=${user.id}" class="nav-link">Profile</a>
      <button onclick="logout()" class="nav-btn outline">Logout</button>
    `;
    if (navUpload) navUpload.style.display = 'inline';
  } else {
    // Otherwise show login/signup
    navAuth.innerHTML = `
      <a href="login.html"  class="nav-btn outline">Login</a>
      <a href="signup.html" class="nav-btn">Sign up</a>
    `;
    if (navUpload) navUpload.style.display = 'none';
  }

  return user;
}

// Just signs out and kicks back to home
async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

// Redirects to login if trying to access a protected page
async function requireAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

// --- Helpers ---

// Formats dates to "x mins/hours ago"
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

// For avatar placeholders
function getInitial(username) {
  return username ? username.charAt(0).toUpperCase() : '?';
}

// Quick way to grab URL params
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}