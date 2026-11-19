// main.js — wires the Vice City Cover Maker editor: photo slots, layout /
// size / grade picks, caption inputs, panel selection with drag-to-pan, and
// PNG export. The cover itself is drawn by cover.js; this file only holds
// state and events, and the `?shot=` scenes live in shots.js.

import { SIZES, LAYOUTS, GRADES, drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelPhotoSelect = document.getElementById('panelPhoto');
const panelZoomInput = document.getElementById('panelZoom');
const panelHint = document.getElementById('panelHint');

// Three photo slots; a panel points at a slot (or at nothing, for an empty
// panel). The defaults fill the Vice Grid with the two sample photos.
const photos = [null, null, null];
const state = {
  size: '1080x1080',
  layout: 'vice-grid',
  grade: 'sunset',
  caption: 'Neon Nights',
  subtitle: 'Ocean Drive · After Dark',
  captionColor: 'white',
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selectedPanel = 0;
let fontsReady = false;

function ensurePanels() {
  const count = LAYOUTS[state.layout].panels.length;
  while (state.panels.length < count) state.panels.push({ photo: 0, zoom: 1, ox: 0, oy: 0 });
  state.panels.length = Math.max(state.panels.length, count);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSampleInto(slot, name) {
  const img = await loadImage(`./samples/${name}.jpg`);
  photos[slot] = img;
  refreshSlot(slot, name);
  render();
}

function refreshSlot(slot, label) {
  const el = document.querySelector(`.slot[data-slot="${slot}"]`);
  if (!el) return;
  el.classList.toggle('filled', photos[slot] !== null);
  el.querySelector('.slot-state').textContent = photos[slot] ? (label || 'loaded') : 'empty';
}

function render() {
  ensurePanels();
  const { w, h } = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  drawCover(ctx, w, h, state, photos);
  highlightSelectedPanel();
}

/** Outlines the selected panel on the preview so the editor shows the pick. */
function highlightSelectedPanel() {
  // The outline is drawn on a second pass over the same canvas: re-draw the
  // cover, then stroke the selected panel in pink. Cheap and always in sync.
  const { w, h } = SIZES[state.size];
  drawCover(ctx, w, h, state, photos);
  const rects = panelRects(w, h, state.layout);
  const rect = rects[selectedPanel];
  if (!rect || document.body.classList.contains('shot-cover')) return;
  ctx.save();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.006);
  ctx.setLineDash([Math.max(10, w * 0.02), Math.max(8, w * 0.012)]);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  panelPhotoSelect.value = panel.photo === null || panel.photo === undefined ? '' : String(panel.photo);
  panelZoomInput.value = String(panel.zoom || 1);
  panelHint.textContent = `Panel ${selectedPanel + 1} of ${LAYOUTS[state.layout].panels.length} selected — drag it to move its photo.`;
}

// --- photo slots -----------------------------------------------------------
document.querySelectorAll('.slot').forEach((slotEl) => {
  const slot = Number(slotEl.dataset.slot);
  slotEl.querySelector('.file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    photos[slot] = await loadImage(URL.createObjectURL(file));
    refreshSlot(slot, file.name);
    render();
  });
  slotEl.querySelector('.sample').addEventListener('click', async (e) => {
    await loadSampleInto(slot, e.currentTarget.dataset.sample);
  });
});

// --- pick rows --------------------------------------------------------------
function bindPickRow(rowId, key) {
  document.getElementById(rowId).addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-' + key + ']');
    if (!btn) return;
    document.querySelectorAll(`#${rowId} .pick`).forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    if (key === 'layout') state.layout = btn.dataset.layout;
    if (key === 'size') state.size = btn.dataset.size;
    if (key === 'grade') state.grade = btn.dataset.grade;
    if (key === 'color') state.captionColor = btn.dataset.color;
    if (key === 'layout') selectedPanel = 0;
    syncPanelControls();
    render();
  });
}
bindPickRow('layoutRow', 'layout');
bindPickRow('sizeRow', 'size');
bindPickRow('gradeRow', 'grade');
bindPickRow('colorRow', 'color');

// --- caption -----------------------------------------------------------------
captionInput.addEventListener('input', () => { state.caption = captionInput.value; render(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; render(); });

// --- selected panel -----------------------------------------------------------
panelPhotoSelect.addEventListener('change', () => {
  const v = panelPhotoSelect.value;
  state.panels[selectedPanel].photo = v === '' ? null : Number(v);
  render();
});
panelZoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(panelZoomInput.value);
  render();
});
document.getElementById('panelCenter').addEventListener('click', () => {
  state.panels[selectedPanel].ox = 0;
  state.panels[selectedPanel].oy = 0;
  render();
});

// --- drag to pan, click to select, wheel to zoom ------------------------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
function panelAt(x, y) {
  const rects = panelRects(canvas.width, canvas.height, state.layout);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (document.body.classList.contains('shot-cover')) return;
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  selectedPanel = i;
  syncPanelControls();
  const rects = panelRects(canvas.width, canvas.height, state.layout);
  drag = { x: p.x, y: p.y, rect: rects[i], panel: state.panels[i] };
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
  highlightSelectedPanel();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  drag.panel.ox += (p.x - drag.x) / drag.rect.w;
  drag.panel.oy += (p.y - drag.y) / drag.rect.h;
  drag.panel.ox = Math.max(-0.6, Math.min(0.6, drag.panel.ox));
  drag.panel.oy = Math.max(-0.6, Math.min(0.6, drag.panel.oy));
  drag.x = p.x;
  drag.y = p.y;
  render();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
  canvas.classList.remove('dragging');
});
canvas.addEventListener('wheel', (e) => {
  if (document.body.classList.contains('shot-cover')) return;
  e.preventDefault();
  const panel = state.panels[selectedPanel];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  syncPanelControls();
  render();
}, { passive: false });

// --- export -------------------------------------------------------------------
function exportFileName(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  return `vice-cover-${w}x${h}.png`;
}

/** Renders the cover at a size on its own canvas and returns a PNG data URL. */
export function exportPNG(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off.getContext('2d'), w, h, state, photos);
  return off.toDataURL('image/png');
}

document.getElementById('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = exportFileName(state.size);
    a.click();
    status.textContent = `Saved ${exportFileName(state.size)} — ${SIZES[state.size].label}.`;
  }, 'image/png');
});

// --- test / screenshot hooks ---------------------------------------------------
window.__vice = {
  state,
  photos,
  exportPNG,
  loadSampleInto,
  render,
  setCaption(text) { state.caption = text; captionInput.value = text; render(); },
};

/** Waits for the display font, then draws the first cover. */
export async function boot() {
  try {
    await document.fonts.load('900 100px "Vice Display"');
    await document.fonts.ready;
    fontsReady = true;
  } catch {
    fontsReady = false;
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, {
      state, photos, loadSampleInto, render,
      setLayout(l) { state.layout = l; },
      setGrade(g) { state.grade = g; },
      setSize(s) { state.size = s; },
      setCaption(t) { state.caption = t; captionInput.value = t; },
      setSubtitle(t) { state.subtitle = t; subtitleInput.value = t; },
      setCaptionColor(c) { state.captionColor = c; },
    });
  } else {
    await loadSampleInto(0, 'pier');
    await loadSampleInto(1, 'boulevard');
  }
  render();
  syncPanelControls();
  window.__viceReady = true;
}

boot();
