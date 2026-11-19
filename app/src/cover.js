// cover.js — draws a GTA-style multi-panel cover onto a canvas 2D context.
//
// A cover is a collage of photo panels separated by warm off-white gutters,
// a Vice City sunset / neon colour grade over every panel, a striped retro
// sun in the first panel, and one big bold caption across the bottom. The
// same drawCover runs for the live preview and for the exported PNG, so what
// the editor shows is exactly what the PNG holds. Everything drawn here is
// original: no Rockstar logo, artwork or font — the lettering uses the
// vendored Noto Sans Display ExtraCondensed Black (SIL OFL, app/fonts/).

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape · 1920 × 1080' },
};

// Panel rectangles are fractions of the inner area (inside the outer frame).
// vice-grid: one hero panel plus two stacked panels; sunset-strip: three
// upright panels; neon-nights: one wide panel over three small ones.
export const LAYOUTS = {
  'vice-grid': {
    name: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 0.615, h: 1 },
      { x: 0.635, y: 0, w: 0.365, h: 0.485 },
      { x: 0.635, y: 0.515, w: 0.365, h: 0.485 },
    ],
  },
  'sunset-strip': {
    name: 'Sunset Strip',
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
  },
  'neon-nights': {
    name: 'Neon Nights',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.62, w: 0.32, h: 0.38 },
      { x: 0.34, y: 0.62, w: 0.32, h: 0.38 },
      { x: 0.68, y: 0.62, w: 0.32, h: 0.38 },
    ],
  },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    stops: [
      [0, 'rgba(255,126,45,0.34)'],
      [0.5, 'rgba(255,45,120,0.24)'],
      [1, 'rgba(80,20,140,0.32)'],
    ],
    wash: 'rgba(255,110,60,0.10)',
    accent: '#ff2e88',
  },
  neon: {
    name: 'Neon',
    stops: [
      [0, 'rgba(0,229,255,0.26)'],
      [0.5, 'rgba(255,0,128,0.28)'],
      [1, 'rgba(60,0,120,0.34)'],
    ],
    wash: 'rgba(255,0,128,0.08)',
    accent: '#00e5ff',
  },
  teal: {
    name: 'Teal Noir',
    stops: [
      [0, 'rgba(0,90,100,0.30)'],
      [0.5, 'rgba(0,200,180,0.16)'],
      [1, 'rgba(8,8,40,0.38)'],
    ],
    wash: 'rgba(0,200,180,0.08)',
    accent: '#ffd23f',
  },
};

export const CAPTION_COLORS = {
  white: '#ffffff',
  pink: '#ff2e88',
  yellow: '#ffd23f',
};

const GUTTER = '#f7f1e6';
const DISPLAY_FONT = '"Vice Display", "Arial Narrow", sans-serif';

/** Panel rectangles in canvas pixels for a layout at size w x h. */
export function panelRects(w, h, layout) {
  const frame = Math.round(Math.min(w, h) * 0.014);
  const iw = w - 2 * frame;
  const ih = h - 2 * frame;
  return LAYOUTS[layout].panels.map((p) => ({
    x: frame + p.x * iw,
    y: frame + p.y * ih,
    w: p.w * iw,
    h: p.h * ih,
  }));
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan. */
function drawPhotoInto(ctx, img, rect, zoom, ox, oy) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** The grade: a sunset/neon wash, a soft-light tint and a vignette. */
function applyGrade(ctx, rect, grade) {
  const g = GRADES[grade];
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  for (const [at, color] of g.stops) wash.addColorStop(at, color);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** A retro striped sun, drawn on a small offscreen canvas so the slats cut out. */
function drawRetroSun(ctx, rect) {
  const r = Math.min(rect.w, rect.h) * 0.16;
  if (r < 12) return;
  const cx = rect.x + rect.w - r * 1.25;
  const cy = rect.y + r * 1.25;
  const sun = document.createElement('canvas');
  sun.width = Math.ceil(r * 2);
  sun.height = Math.ceil(r * 2);
  const s = sun.getContext('2d');
  const grad = s.createLinearGradient(0, 0, 0, r * 2);
  grad.addColorStop(0, '#ffd23f');
  grad.addColorStop(0.55, '#ff7a3d');
  grad.addColorStop(1, '#ff2e88');
  s.fillStyle = grad;
  s.beginPath();
  s.arc(r, r, r, 0, Math.PI * 2);
  s.fill();
  s.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const y = r + r * (0.1 + i * 0.28);
    s.fillRect(0, y, r * 2, Math.max(2, r * 0.09));
  }
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.drawImage(sun, cx - r, cy - r);
  ctx.restore();
}

/** Placeholder for a panel with no photo yet: a sunset gradient and a label. */
function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#ff7a3d');
  g.addColorStop(0.55, '#ff2e88');
  g.addColorStop(1, '#5a148c');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `900 ${Math.max(14, rect.w * 0.055)}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Fits the caption to the width and returns the font size that fits.
 *  Letter spacing is part of the measurement, or long captions overflow. */
function fitCaptionSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  for (;;) {
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    if (size <= 24 || ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  }
}

/** The bold caption block across the bottom: subtitle, accent bar, big title. */
function drawCaption(ctx, w, h, state) {
  const grade = GRADES[state.grade];
  const caption = (state.caption || 'NEON NIGHTS').toUpperCase();
  const subtitle = (state.subtitle || '').toUpperCase();
  const shade = ctx.createLinearGradient(0, h * 0.62, 0, h);
  shade.addColorStop(0, 'rgba(10,0,10,0)');
  shade.addColorStop(1, 'rgba(10,0,10,0.5)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  const pad = w * 0.05;
  const maxW = w - pad * 2;
  const capSize = fitCaptionSize(ctx, caption, maxW, Math.round(w * 0.115));
  const capY = h - h * 0.045;

  ctx.save();
  ctx.translate(pad, capY);
  ctx.rotate(-0.035);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(capSize * 0.02)}px`; } catch { /* older canvas */ }
  ctx.font = `900 ${capSize}px ${DISPLAY_FONT}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14060f';
  ctx.lineWidth = Math.max(4, capSize * 0.14);
  ctx.strokeText(caption, 0, 0);
  ctx.fillStyle = CAPTION_COLORS[state.captionColor] || '#ffffff';
  ctx.fillText(caption, 0, 0);
  ctx.restore();

  if (subtitle) {
    let subSize = Math.round(w * 0.028);
    for (;;) {
      ctx.font = `900 ${subSize}px ${DISPLAY_FONT}`;
      try { ctx.letterSpacing = `${Math.round(subSize * 0.28)}px`; } catch { /* older canvas */ }
      if (subSize <= 14 || ctx.measureText(subtitle).width <= maxW) break;
      subSize -= 2;
    }
    ctx.save();
    ctx.translate(pad, capY - capSize * 1.08);
    ctx.rotate(-0.035);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, 0, 0);
    ctx.fillRect(0, subSize * 0.55, w * 0.09, Math.max(3, subSize * 0.18));
    ctx.restore();
  }
}

/**
 * Draws the whole cover. state: { layout, grade, caption, subtitle,
 * captionColor, panels: [{ photo, zoom, ox, oy }] } and photos: an array of
 * HTMLImageElement | null, one per photo slot. A panel's `photo` is the index
 * of its slot, or null for an empty panel.
 */
export function drawCover(ctx, w, h, state, photos) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = GUTTER;
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(w, h, state.layout);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: null, zoom: 1, ox: 0, oy: 0 };
    const img = panel.photo === null || panel.photo === undefined ? null : photos[panel.photo];
    if (img) {
      drawPhotoInto(ctx, img, rect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
      applyGrade(ctx, rect, state.grade);
    } else {
      drawEmptyPanel(ctx, rect);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.002);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (i === 0 && img) drawRetroSun(ctx, rect);
  });
  drawCaption(ctx, w, h, state);
}
