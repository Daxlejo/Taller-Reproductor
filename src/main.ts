import './styles/index.css';
import { AudioEngine } from './services/AudioEngine';
import { PlaylistManager } from './services/PlaylistManager';
import { MoodThemeManager } from './services/MoodThemeManager';
import type { Song } from './models/Song';

const audioEngine = new AudioEngine();
const moodManager = new MoodThemeManager();

interface PlaylistEntry { name: string; manager: PlaylistManager; }
const playlists: PlaylistEntry[] = [];
let activeIndex = 0;

function createPlaylist(name: string): number {
  const mgr = new PlaylistManager(audioEngine);
  mgr.onPlaylistChanged = () => { renderSongList(); updateSidebarCounts(); };
  mgr.onSongChanged = (song) => updateNowPlaying(song);
  playlists.push({ name, manager: mgr });
  return playlists.length - 1;
}

function active(): PlaylistManager { return playlists[activeIndex].manager; }

createPlaylist('Favoritos');

// DOM

const moodOptions = document.getElementById('mood-options')!;
const sidebarPlaylists = document.getElementById('sidebar-playlists')!;
const btnNewPlaylist = document.getElementById('btn-new-playlist')!;
const heroName = document.getElementById('hero-name')!;
const heroCount = document.getElementById('hero-count')!;
const songListEl = document.getElementById('song-list')!;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const btnShuffle = document.getElementById('btn-shuffle')!;
const btnAddSongs = document.getElementById('btn-add-songs')!;
const inputFiles = document.getElementById('input-files') as HTMLInputElement;
const floatingText = document.getElementById('floating-text')!;
const progressRiver = document.getElementById('progress-river')!;
const progressFill = document.getElementById('progress-fill')!;
const progressThumb = document.getElementById('progress-thumb')!;
const progressGlow = document.getElementById('progress-glow')!;
const progressCurrent = document.getElementById('progress-current')!;
const progressDuration = document.getElementById('progress-duration')!;
const btnPlay = document.getElementById('btn-play')!;
const btnPrev = document.getElementById('btn-prev')!;
const btnNext = document.getElementById('btn-next')!;
const visualizerContainer = document.getElementById('visualizer')!;
const bassTop = document.getElementById('bass-top')!;
const bassBottom = document.getElementById('bass-bottom')!;
const bassLeft = document.getElementById('bass-left')!;
const bassRight = document.getElementById('bass-right')!;

// Mood

function renderMoodButtons() {
  moodOptions.innerHTML = '';
  moodManager.allThemes.forEach((theme) => {
    const btn = document.createElement('button');
    btn.className = `mood-btn ${moodManager.currentTheme.name === theme.name ? 'active' : ''}`;
    btn.innerHTML = theme.emoji;
    btn.title = theme.label;
    btn.onclick = () => { moodManager.setMood(theme.name); renderMoodButtons(); };
    moodOptions.appendChild(btn);
  });
}
moodManager.init();
renderMoodButtons();

// Audio

const formatTime = (t: number) => {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

audioEngine.onTimeUpdate = (cur, dur) => {
  if (!dur) return;
  const pct = (cur / dur) * 100;
  progressCurrent.textContent = formatTime(cur);
  progressDuration.textContent = formatTime(dur);
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  progressGlow.style.width = `${pct}%`;
};

function updateNowPlaying(song: Song | null) {
  updatePlayBtn();
  if (song) {
    floatingText.textContent = song.title;
  } else {
    floatingText.textContent = 'WaveDistric9';
    progressCurrent.textContent = '0:00';
    progressDuration.textContent = '0:00';
    progressFill.style.width = '0%';
    progressThumb.style.left = '0%';
    progressGlow.style.width = '0%';
  }
  renderSongList();
}

function updatePlayBtn() {
  btnPlay.textContent = audioEngine.isPlaying ? '⏸' : '▶';
}

// Controls

btnPlay.onclick = () => active().togglePlay().then(updatePlayBtn);
btnPrev.onclick = () => active().previous();
btnNext.onclick = () => active().next();
btnShuffle.onclick = () => active().shuffle();

progressRiver.onclick = (e) => {
  if (!active().currentSong) return;
  const rect = progressRiver.getBoundingClientRect();
  active().seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audioEngine.duration);
};

document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === 'Space') { e.preventDefault(); active().togglePlay().then(updatePlayBtn); }
  else if (e.code === 'ArrowRight') active().next();
  else if (e.code === 'ArrowLeft') active().previous();
});

// Files

async function processFile(file: File) {
  if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) return;
  const raw = file.name.replace(/\.[^/.]+$/, '');
  let title = raw, artist = 'Artista Local';
  if (raw.includes(' - ')) {
    const p = raw.split(' - ');
    artist = p[0].trim();
    title = p.slice(1).join(' - ').trim();
  }
  await active().addSong(file, title, artist, 'tail');
}

btnAddSongs.onclick = () => inputFiles.click();

inputFiles.onchange = async () => {
  const files = inputFiles.files;
  if (!files) return;
  for (const file of Array.from(files)) {
    await processFile(file);
  }
  inputFiles.value = '';
};

// --- DRAG AND DROP (FILES & FOLDERS) ---

async function handleEntry(entry: any) {
  if (entry.isFile) {
    entry.file((file: File) => processFile(file));
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    // readEntries might need to be called repeatedly until it returns an empty array, 
    // but for simple folders one call is often enough if < 100 items. 
    // To be safe, we wrap it in a recursive reader.
    const readAll = () => {
      reader.readEntries((entries: any[]) => {
        if (entries.length) {
          entries.forEach(handleEntry);
          readAll();
        }
      });
    };
    readAll();
  }
}

document.body.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.body.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Need to check if the drop is within the song list (which has its own drag-drop for reordering)
  if ((e.target as HTMLElement).closest('.song-row')) return;

  const items = e.dataTransfer?.items;
  if (!items) {
    // Fallback if items is not supported
    const files = e.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) processFile(files[i]);
    }
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        handleEntry(entry);
      } else {
        const file = item.getAsFile();
        if (file) processFile(file);
      }
    }
  }
});

searchInput.oninput = () => renderSongList();

// Sidebar

function renderSidebar() {
  sidebarPlaylists.innerHTML = '';
  playlists.forEach((pl, idx) => {
    const item = document.createElement('div');
    item.className = `sidebar-item ${idx === activeIndex ? 'active' : ''}`;
    item.innerHTML = `
      <span class="sidebar-item__icon">🎵</span>
      <div class="sidebar-item__info">
        <div class="sidebar-item__name">${pl.name}</div>
        <div class="sidebar-item__count">${pl.manager.size} canciones</div>
      </div>
    `;

    if (playlists.length > 1) {
      const del = document.createElement('button');
      del.className = 'sidebar-item__delete';
      del.textContent = '✕';
      del.title = 'Eliminar playlist';
      del.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar "${pl.name}"?`)) {
          playlists.splice(idx, 1);
          if (activeIndex >= playlists.length) activeIndex = playlists.length - 1;
          renderSidebar();
          switchPlaylist(activeIndex);
        }
      };
      item.appendChild(del);
    }

    item.onclick = () => switchPlaylist(idx);

    item.ondblclick = (e) => {
      e.stopPropagation();
      const nameEl = item.querySelector('.sidebar-item__name')!;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'rename-input';
      input.value = pl.name;
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      const save = () => { pl.name = input.value.trim() || pl.name; renderSidebar(); updateHero(); };
      input.onblur = save;
      input.onkeydown = (ke) => { if (ke.key === 'Enter') save(); if (ke.key === 'Escape') renderSidebar(); };
    };

    sidebarPlaylists.appendChild(item);
  });
}

function updateSidebarCounts() {
  const countEls = sidebarPlaylists.querySelectorAll('.sidebar-item__count');
  playlists.forEach((pl, i) => {
    if (countEls[i]) countEls[i].textContent = `${pl.manager.size} canciones`;
  });
  updateHero();
}

btnNewPlaylist.onclick = () => { switchPlaylist(createPlaylist(`Playlist ${playlists.length + 1}`)); };

function switchPlaylist(idx: number) {
  activeIndex = idx;
  renderSidebar();
  updateHero();
  renderSongList();
  updatePlayBtn();
}

function updateHero() {
  heroName.textContent = playlists[activeIndex].name;
  heroCount.textContent = `${active().size} canciones`;
}

// Song List

function renderSongList() {
  const mgr = active();
  const songs = mgr.songs;
  const term = searchInput.value.toLowerCase();
  const filtered = songs.filter(s => s.title.toLowerCase().includes(term) || s.artist.toLowerCase().includes(term));

  songListEl.innerHTML = '';
  updateHero();

  if (filtered.length === 0) {
    songListEl.innerHTML = `
      <div class="playlist-empty">
        <span class="playlist-empty__icon">🎶</span>
        <p>${songs.length === 0 ? 'Tu playlist está vacía' : 'No se encontraron resultados'}</p>
        <p class="playlist-empty__sub">${songs.length === 0 ? 'Haz clic en "+ Agregar" para añadir canciones' : ''}</p>
      </div>`;
    return;
  }

  filtered.forEach((song) => {
    const realIdx = songs.findIndex(s => s.id === song.id);
    const isPlaying = mgr.currentSong?.id === song.id;

    const row = document.createElement('div');
    row.className = `song-row ${isPlaying ? 'playing' : ''}`;
    row.draggable = true;
    row.innerHTML = `
      <span class="song-row__num">${isPlaying ? '♫' : realIdx + 1}</span>
      <div class="song-row__info">
        <div class="song-row__title">${song.title}</div>
        <div class="song-row__artist">${song.artist}</div>
      </div>
      <span class="song-row__duration">${song.duration}</span>
      <button class="song-row__delete" title="Eliminar">✕</button>
    `;

    row.ondragstart = (e) => { e.dataTransfer!.setData('text/plain', realIdx.toString()); e.dataTransfer!.effectAllowed = 'move'; row.classList.add('dragging'); };
    row.ondragend = () => { row.classList.remove('dragging'); songListEl.querySelectorAll('.drag-over').forEach(n => n.classList.remove('drag-over')); };
    row.ondragover = (e) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'move'; row.classList.add('drag-over'); };
    row.ondragleave = () => row.classList.remove('drag-over');
    row.ondrop = (e) => { e.preventDefault(); row.classList.remove('drag-over'); const from = parseInt(e.dataTransfer!.getData('text/plain'), 10); if (!isNaN(from) && from !== realIdx) mgr.moveSongTo(from, realIdx); };
    row.onclick = (e) => { if ((e.target as HTMLElement).closest('.song-row__delete')) return; mgr.playSong(realIdx).then(updatePlayBtn); };
    row.querySelector('.song-row__delete')!.addEventListener('click', (e) => { e.stopPropagation(); mgr.removeSong(song.id); });

    songListEl.appendChild(row);
  });
}

// Visualizer & Bass Bumps

const BARS = 24;
for (let i = 0; i < BARS; i++) {
  const b = document.createElement('div');
  b.className = 'visualizer-bar';
  visualizerContainer.appendChild(b);
}
const bars = visualizerContainer.querySelectorAll('.visualizer-bar') as NodeListOf<HTMLElement>;

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!audioEngine.isPlaying) {
    bars.forEach(b => { const h = parseFloat(b.style.height || '2'); if (h > 2) b.style.height = `${h - 1}px`; });
    bassTop.style.opacity = bassBottom.style.opacity = bassLeft.style.opacity = bassRight.style.opacity = '0';
    return;
  }
  const data = audioEngine.getFrequencyData();
  const step = Math.floor(data.length / BARS);
  for (let i = 0; i < BARS; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
    bars[i].style.height = `${Math.max(2, (sum / step / 255) * 30)}px`;
  }
  const bass = audioEngine.getBassLevel();
  if (bass > 0.55) {
    const o = ((bass - 0.55) / 0.45).toFixed(2);
    bassTop.style.opacity = bassBottom.style.opacity = bassLeft.style.opacity = bassRight.style.opacity = o;
  } else {
    bassTop.style.opacity = bassBottom.style.opacity = bassLeft.style.opacity = bassRight.style.opacity = '0';
  }
}

renderSidebar();
updateHero();
renderSongList();
renderFrame();
