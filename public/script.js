const apiBase = '/movies';

// DOM
const movieList = document.getElementById('movie-list');
const form = document.getElementById('movie-form');
const idInput = document.getElementById('movie-id');
const titleInput = document.getElementById('title');
const directorInput = document.getElementById('director');
const yearInput = document.getElementById('year');
const ratingInput = document.getElementById('rating');
const thumbnailInput = document.getElementById('thumbnail');
const clearBtn = document.getElementById('clear-btn');
const formMode = document.getElementById('form-mode');
const submitBtn = document.getElementById('submit-btn');

const modalEl = document.getElementById('feedbackModal');
const modalBody = document.getElementById('modal-body');
const modal = new bootstrap.Modal(modalEl);

let currentThumbnail = null;

/* ---------- UI helpers ---------- */

function showModal(msg) {
  modalBody.textContent = msg;
  modal.show();
}

function setCreateMode() {
  formMode.textContent = 'Skapa ny film';
  formMode.className = 'mb-3 text-primary';
  submitBtn.textContent = 'Skapa film';
  idInput.value = '';
  currentThumbnail = null;
}

function setEditMode(title) {
  formMode.textContent = `Redigerar: ${title}`;
  formMode.className = 'mb-3 text-warning';
  submitBtn.textContent = 'Uppdatera film';
}

/* ---------- SAFE FETCH ---------- */

async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ---------- Fetch & render ---------- */

async function fetchMovies() {
  try {
    const movies = await safeFetch(apiBase);
    renderMovies(movies);
  } catch (err) {
    console.error(err);
    showModal('Kunde inte ladda filmer. Är backend igång?');
  }
}

function renderMovies(movies) {
  movieList.innerHTML = '';

  if (!movies.length) {
    movieList.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center">
          Inga filmer sparade ännu.
        </div>
      </div>`;
    return;
  }

  movies.forEach(movie => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4 col-lg-3';

    const card = document.createElement('div');
    card.className = 'card h-100 shadow-sm';

    if (movie.thumbnail) {
      const img = document.createElement('img');
      img.src = movie.thumbnail;
      img.className = 'card-img-top';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      card.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';

    body.innerHTML = `
      <span class="badge bg-secondary mb-2">Film</span>
      <h5 class="card-title">${movie.title}</h5>
      <p class="mb-1"><strong>Director:</strong> ${movie.director || '-'}</p>
      <p class="text-muted mb-2">
        <small>${movie.year || ''}${movie.rating ? ' • Rating: ' + movie.rating : ''}</small>
      </p>
    `;

    const actions = document.createElement('div');
    actions.className = 'mt-auto d-flex gap-2';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary flex-fill';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => onEdit(movie.id);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-outline-danger flex-fill';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => onDelete(movie.id, movie.title);

    actions.append(editBtn, delBtn);
    body.append(actions);
    card.append(body);
    col.append(card);
    movieList.append(col);
  });
}

/* ---------- Edit ---------- */

async function onEdit(id) {
  try {
    const m = await safeFetch(`${apiBase}/${id}`);
    idInput.value = m.id;
    titleInput.value = m.title;
    directorInput.value = m.director;
    yearInput.value = m.year || '';
    ratingInput.value = m.rating || '';
    currentThumbnail = m.thumbnail || null;

    setEditMode(m.title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    showModal('Kunde inte läsa in filmen.');
  }
}

/* ---------- Delete ---------- */

async function onDelete(id, title) {
  if (!confirm(`Vill du ta bort "${title}"?`)) return;

  try {
    await safeFetch(`${apiBase}/${id}`, { method: 'DELETE' });
    showModal('Film borttagen');
    fetchMovies();
  } catch {
    showModal('Fel vid borttagning.');
  }
}

/* ---------- File → Base64 ---------- */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Submit (Create & Update) ---------- */

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const file = thumbnailInput.files[0];
    const thumbnail = file ? await fileToBase64(file) : currentThumbnail;

    const movie = {
      id: idInput.value || undefined,
      title: titleInput.value,
      director: directorInput.value,
      year: yearInput.value,
      rating: ratingInput.value,
      thumbnail
    };

    const method = movie.id ? 'PUT' : 'POST';

    await safeFetch(apiBase, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movie)
    });

    showModal(movie.id ? 'Film uppdaterad' : 'Film skapad');
    form.reset();
    setCreateMode();
    fetchMovies();
  } catch (err) {
    console.error(err);
    showModal('Fel vid sparande.');
  }
});

/* ---------- Clear ---------- */

clearBtn.onclick = () => {
  form.reset();
  setCreateMode();
};

/* ---------- Init ---------- */

setCreateMode();
fetchMovies();
