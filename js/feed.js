// ─────────────────────────────────────────────
//  FEED.JS — Community model feed
// ─────────────────────────────────────────────

const grid = document.getElementById('models-grid');

async function loadFeed() {
  await initNav();

  // Fetch models joined with the uploader's profile (username)
  const { data: models, error } = await db
    .from('models')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Something went wrong</h3>
        <p>${error.message}</p>
      </div>`;
    return;
  }

  if (!models || models.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No models yet</h3>
        <p>Be the first to share a 3D model with the community!</p>
      </div>`;
    return;
  }

  grid.innerHTML = models.map(m => renderCard(m)).join('');
}

function renderCard(m) {
  const username = m.profiles?.username ?? 'unknown';
  const thumb    = m.thumbnail_url
    ? `<img class="model-card-thumb" src="${m.thumbnail_url}" alt="${m.title}" loading="lazy">`
    : `<div class="model-card-thumb-placeholder">⬡</div>`;

  // Render up to 3 tags
  const tags = (m.tags ?? []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');

  return `
    <a class="model-card" href="model.html?id=${m.id}">
      ${thumb}
      <div class="model-card-body">
        <div class="model-card-title">${m.title}</div>
        <div class="model-card-meta">
          <span>by ${username}</span>
          <span>♡ ${m.likes_count ?? 0}</span>
        </div>
        ${tags ? `<div class="model-card-tags">${tags}</div>` : ''}
      </div>
    </a>`;
}

loadFeed();
