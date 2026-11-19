// shots.js — fixed scenes for screenshots, driven by `?shot=` query params.
//
//   ?shot=cover&photo=pier&caption=Neon%20Nights&layout=vice-grid&grade=sunset&size=1920x1080
//     The cover alone, centred on a plain backdrop: the exported cover as
//     the app itself draws it.
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//     The full editor with a photo loaded, as the maker sees it.
//
// Every photo here is one of the kit's sample photos (free to use), and every
// caption is typed in by the query — the scenes show the app working, nothing
// borrowed or composited.

/** Loads a sample photo into slot 0 and fills every panel with the slots. */
async function fillPanels(api, sample) {
  await api.loadSampleInto(0, sample);
  if (!api.photos[1]) await api.loadSampleInto(1, sample === 'pier' ? 'boulevard' : 'pier');
  api.state.panels.forEach((panel, i) => {
    panel.photo = i % 2 === 0 ? 0 : 1;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
  });
}

export async function runShot(shot, params, api) {
  const photo = params.get('photo') || 'pier';
  const caption = params.get('caption') || 'Neon Nights';
  const subtitle = params.get('subtitle') || 'Ocean Drive · After Dark';
  const layout = params.get('layout') || 'vice-grid';
  const grade = params.get('grade') || 'sunset';
  const size = params.get('size') || '1080x1080';
  const color = params.get('color') || 'white';

  api.setLayout(layout);
  api.setGrade(grade);
  api.setSize(size);
  api.setCaption(caption);
  api.setSubtitle(subtitle);
  api.setCaptionColor(color);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await fillPanels(api, photo);
  } else if (shot === 'editor') {
    await fillPanels(api, photo);
  }
  api.render();
}
