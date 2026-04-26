// Palettes & shared constants

const PALETTES = [
  { id: 'signal',  name: 'SIGNAL/01',  desc: 'noir / cyan / magenta / jaune' },
  { id: 'plasma',  name: 'PLASMA/02',  desc: 'violet nuit / cyan / magenta' },
  { id: 'haz',     name: 'HAZARD/03',  desc: 'noir / jaune danger / orange' },
  { id: 'acid',    name: 'ACID/04',    desc: 'paper / rouge / bleu / vert' },
  { id: 'mono',    name: 'MONO/05',    desc: 'noir & blanc' },
];

const SHADER_MODES = [
  { id: 'metaballs', name: 'METABALLS' },
  { id: 'voronoi',   name: 'VORONOI'   },
  { id: 'plasma',    name: 'PLASMA'    },
  { id: 'rings',     name: 'RINGS'     },
];

const CURSOR_MODES = [
  { id: 'trail',  name: 'TRAIL'  },
  { id: 'ring',   name: 'RING'   },
  { id: 'native', name: 'NATIVE' },
];

window.PALETTES = PALETTES;
window.SHADER_MODES = SHADER_MODES;
window.CURSOR_MODES = CURSOR_MODES;
