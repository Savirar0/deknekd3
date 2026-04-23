let currentUser = null;
let modelFile = null;
let thumbFile = null;

const form = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const msgEl = document.getElementById('msg');

async function init() {
  currentUser = await requireAuth();
  if (!currentUser) return;
  await initNav();
  setupDropZones();
}

function setupDropZones() {
  setupDrop('model-drop', 'model-file-input', 'model-selected', (f) => { modelFile = f; });
  setupDrop('thumb-drop', 'thumb-file-input', 'thumb-selected', (f) => { thumbFile = f; });
}

function setupDrop(dropId, inputId, labelId, onFile) {
  const zone = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);

  zone.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const f = input.files[0];
    if (f) { onFile(f); label.textContent = f.name; }
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) { onFile(f); label.textContent = f.name; }
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsg();

  const title = document.getElementById('title').value.trim();
  const desc = document.getElementById('description').value.trim();
  const tags = document.getElementById('tags').value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  if (!title) return showMsg('Please enter a title.', 'error');
  if (!modelFile) return showMsg('Please select a 3D model file.', 'error');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';

  try {
    const modelExt = modelFile.name.split('.').pop();
    const modelPath = `${currentUser.id}/${Date.now()}.${modelExt}`;

    const { error: modelUploadError } = await db.storage
      .from('models')
      .upload(modelPath, modelFile);

    if (modelUploadError) throw modelUploadError;

    const { data: { publicUrl: modelUrl } } = db.storage
      .from('models')
      .getPublicUrl(modelPath);

    let thumbnailUrl = null;

    if (thumbFile) {
      const thumbExt = thumbFile.name.split('.').pop();
      const thumbPath = `${currentUser.id}/${Date.now()}_thumb.${thumbExt}`;

      const { error: thumbError } = await db.storage
        .from('thubnails')
        .upload(thumbPath, thumbFile);

      if (thumbError) throw thumbError;

      const { data: { publicUrl } } = db.storage
        .from('thubnails')
        .getPublicUrl(thumbPath);

      thumbnailUrl = publicUrl;
    }

    const { data: inserted, error: insertError } = await db
      .from('models')
      .insert({
        user_id: currentUser.id,
        title,
        description: desc,
        tags,
        model_url: modelUrl,
        thumbnail_url: thumbnailUrl,
        format: modelExt,
        likes_count: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    window.location.href = `model.html?id=${inserted.id}`;

  } catch (err) {
    showMsg(err.message || 'Upload failed. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Model';
  }
});

function showMsg(text, type) {
  msgEl.textContent = text;
  msgEl.className = `msg ${type}`;
}

function clearMsg() {
  msgEl.className = 'msg';
  msgEl.textContent = '';
}

init();