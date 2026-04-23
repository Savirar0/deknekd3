// ─────────────────────────────────────────────
//  MODEL.JS — Single model detail page
// ─────────────────────────────────────────────

let currentUser = null;
let modelData   = null;
let hasLiked    = false;

const modelId = getParam('id');

async function init() {
  currentUser = await initNav();

  if (!modelId) {
    document.getElementById('model-content').innerHTML =
      `<p style="color:var(--muted)">No model ID specified.</p>`;
    return;
  }

  await loadModel();
  await loadComments();
}

// ─── Load Model ───
async function loadModel() {
  const { data, error } = await db
    .from('models')
    .select('*, profiles(username)')
    .eq('id', modelId)
    .single();

  if (error || !data) {
    document.getElementById('model-content').innerHTML =
      `<p style="color:var(--muted)">Model not found.</p>`;
    return;
  }

  modelData = data;
  document.title = `${data.title} — DekNek3D`;

  renderModelPage(data);

  // Check if current user has liked this model
  if (currentUser) {
    const { data: like } = await db
      .from('likes')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('model_id', modelId)
      .single();

    if (like) {
      hasLiked = true;
      const likeBtn = document.getElementById('like-btn');
      if (likeBtn) {
        likeBtn.classList.add('liked');
        likeBtn.textContent = `♥ ${data.likes_count} Liked`;
      }
    }
  }
}

// ─── Render Model Page ───
function renderModelPage(m) {
  const username  = m.profiles?.username ?? 'unknown';
  const isGlb     = m.format === 'glb';
  const createdAt = timeAgo(m.created_at);

  // Viewer: use <model-viewer> for .glb, image for others, placeholder if neither
  let viewer = '';
  if (isGlb && m.model_url) {
    viewer = `
      <model-viewer
        src="${m.model_url}"
        alt="${m.title}"
        camera-controls
        auto-rotate
        shadow-intensity="1">
      </model-viewer>`;
  } else if (m.thumbnail_url) {
    viewer = `<img class="model-thumb-large" src="${m.thumbnail_url}" alt="${m.title}">`;
  } else {
    viewer = `<div class="model-thumb-placeholder">⬡</div>`;
  }

  const tags = (m.tags ?? []).map(t => `<span class="tag">${t}</span>`).join('');

  const likeBtn = currentUser
    ? `<button id="like-btn" class="action-btn like" onclick="toggleLike()">
         ♡ ${m.likes_count ?? 0} Like
       </button>`
    : `<a href="login.html" class="action-btn like" style="text-decoration:none">
         ♡ Login to Like
       </a>`;

  const downloadBtn = m.model_url
    ? `<a href="${m.model_url}" download class="action-btn download">↓ Download Model</a>`
    : '';

  document.getElementById('model-content').innerHTML = `
    <div class="model-detail-grid">
      <div>
        ${viewer}
        ${m.tags?.length ? `<div class="model-card-tags" style="margin-top:1rem">${tags}</div>` : ''}
      </div>

      <div class="model-info">
        <h1>${m.title}</h1>
        <p class="model-info-desc">${m.description || 'No description provided.'}</p>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Author</span>
            <span class="value">
              <a href="profile.html?id=${m.user_id}" style="color:var(--accent)">${username}</a>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Format</span>
            <span class="value">.${m.format ?? 'unknown'}</span>
          </div>
          <div class="info-row">
            <span class="label">Likes</span>
            <span class="value">${m.likes_count ?? 0}</span>
          </div>
          <div class="info-row">
            <span class="label">Posted</span>
            <span class="value">${createdAt}</span>
          </div>
        </div>

        ${likeBtn}
        ${downloadBtn}
      </div>
    </div>

    <div class="comments-section" id="comments-section">
      <h3>Comments</h3>
      <div id="comments-list"><div class="loading">Loading comments...</div></div>
      ${currentUser
        ? `<div class="comment-form">
             <input type="text" id="comment-input" placeholder="Write a comment...">
             <button onclick="postComment()">Post</button>
           </div>`
        : `<p style="color:var(--muted);font-size:13px;margin-top:1rem">
             <a href="login.html" style="color:var(--accent)">Log in</a> to comment
           </p>`
      }
    </div>`;
}

// ─── Like / Unlike ───
async function toggleLike() {
  if (!currentUser) return;

  const likeBtn = document.getElementById('like-btn');
  likeBtn.disabled = true;

  if (hasLiked) {
    // Unlike
    await db.from('likes').delete()
      .eq('user_id', currentUser.id)
      .eq('model_id', modelId);

    await db.from('models')
      .update({ likes_count: (modelData.likes_count ?? 1) - 1 })
      .eq('id', modelId);

    modelData.likes_count = (modelData.likes_count ?? 1) - 1;
    hasLiked = false;
    likeBtn.classList.remove('liked');
    likeBtn.textContent = `♡ ${modelData.likes_count} Like`;
  } else {
    // Like
    await db.from('likes').insert({ user_id: currentUser.id, model_id: modelId });

    await db.from('models')
      .update({ likes_count: (modelData.likes_count ?? 0) + 1 })
      .eq('id', modelId);

    modelData.likes_count = (modelData.likes_count ?? 0) + 1;
    hasLiked = true;
    likeBtn.classList.add('liked');
    likeBtn.textContent = `♥ ${modelData.likes_count} Liked`;
  }

  likeBtn.disabled = false;
}

// ─── Comments ───
async function loadComments() {
  const listEl = document.getElementById('comments-list');
  if (!listEl) return;

  const { data: comments, error } = await db
    .from('comments')
    .select('*, profiles(username)')
    .eq('model_id', modelId)
    .order('created_at', { ascending: true });

  if (error || !comments || comments.length === 0) {
    listEl.innerHTML = `<p style="color:var(--muted);font-size:13px">No comments yet. Be the first!</p>`;
    return;
  }

  listEl.innerHTML = comments.map(c => {
    const username = c.profiles?.username ?? 'unknown';
    return `
      <div class="comment-item">
        <div class="comment-avatar">${getInitial(username)}</div>
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">${username}</span>
            <span class="comment-time">${timeAgo(c.created_at)}</span>
          </div>
          <div class="comment-text">${c.content}</div>
        </div>
      </div>`;
  }).join('');
}

async function postComment() {
  const input   = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content || !currentUser) return;

  const { error } = await db.from('comments').insert({
    user_id:  currentUser.id,
    model_id: modelId,
    content,
  });

  if (!error) {
    input.value = '';
    await loadComments();
  }
}

// Allow pressing Enter to post comment
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'comment-input') {
    postComment();
  }
});

init();
