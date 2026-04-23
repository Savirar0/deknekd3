// ─────────────────────────────────────────────
//  PROFILE.JS — User profile page
// ─────────────────────────────────────────────

let currentUser  = null;
let profileUserId = getParam('id'); // ?id=uuid in the URL

async function init() {
  currentUser = await initNav();

  // If no ID in URL, show current user's profile
  if (!profileUserId && currentUser) {
    profileUserId = currentUser.id;
  }

  if (!profileUserId) {
    document.getElementById('profile-content').innerHTML =
      `<p style="color:var(--muted)">
        No user specified. <a href="login.html" style="color:var(--accent)">Log in</a> to see your profile.
       </p>`;
    return;
  }

  await loadProfile();
  await loadUserModels();
}

// ─── Load Profile Info ───
async function loadProfile() {
  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', profileUserId)
    .single();

  if (error || !profile) {
    document.getElementById('profile-header').innerHTML =
      `<p style="color:var(--muted)">User not found.</p>`;
    return;
  }

  // Get model count for this user
  const { count } = await db
    .from('models')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileUserId);

  const initial = getInitial(profile.username);
  const isOwnProfile = currentUser && currentUser.id === profileUserId;

  document.title = `${profile.username} — DekNek3D`;

  document.getElementById('profile-header').innerHTML = `
    <div class="profile-avatar">${initial}</div>
    <div class="profile-info">
      <div class="profile-name">${profile.username}</div>
      <div class="profile-bio">${profile.bio || 'No bio yet.'}</div>
      <div class="profile-stats">
        <div class="profile-stat">
          <span class="stat-num">${count ?? 0}</span>
          <span class="stat-label">Models</span>
        </div>
      </div>
    </div>
    ${isOwnProfile
      ? `<a href="upload.html" class="nav-btn" style="text-decoration:none;align-self:flex-start">+ Upload</a>`
      : ''}
  `;
}

// ─── Load User's Models ───
async function loadUserModels() {
  const grid = document.getElementById('user-models-grid');

  const { data: models, error } = await db
    .from('models')
    .select('*, profiles(username)')
    .eq('user_id', profileUserId)
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `<p style="color:var(--muted);font-size:13px">${error.message}</p>`;
    return;
  }

  if (!models || models.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No models yet</h3>
        <p>This user hasn't shared any models.</p>
      </div>`;
    return;
  }

  grid.innerHTML = models.map(m => {
    const username = m.profiles?.username ?? 'unknown';
    const thumb    = m.thumbnail_url
      ? `<img class="model-card-thumb" src="${m.thumbnail_url}" alt="${m.title}" loading="lazy">`
      : `<div class="model-card-thumb-placeholder">⬡</div>`;
    const tags = (m.tags ?? []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <a class="model-card" href="model.html?id=${m.id}">
        ${thumb}
        <div class="model-card-body">
          <div class="model-card-title">${m.title}</div>
          <div class="model-card-meta">
            <span>${timeAgo(m.created_at)}</span>
            <span>♡ ${m.likes_count ?? 0}</span>
          </div>
          ${tags ? `<div class="model-card-tags">${tags}</div>` : ''}
        </div>
      </a>`;
  }).join('');
}

init();
