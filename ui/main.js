// Boot: load data (JSON modules, no build step), read the game code + scenario
// from the URL, run the game loop. No localStorage — the URL is the save state.

import params from '../data/params.json' with { type: 'json' };
import countries from '../data/countries.json' with { type: 'json' };
import scenarios from '../data/scenarios.json' with { type: 'json' };
import events from '../data/events.json' with { type: 'json' };
import { newGame, applyAction, endTurn, snapshot, convertedPoints } from '../engine/game.js';
import { render } from './render.js';
import { INSTRUMENTS, DELTA_LABELS, MILESTONES, UNLOCKS, instrumentCopy } from './copy.js';

const root = document.getElementById('app');
const scenarioSelect = document.getElementById('scenario-select');
const seedInput = document.getElementById('seed-input');
const newRunBtn = document.getElementById('new-run');

let game = null;
// introMode 'first': the opening intro, which always leads to the country picker.
// introMode 'help': reopened mid-game via "How to play" — closing returns to the game.
const ui = {
  showIntro: true, introMode: 'first', showPicker: false, summary: null,
  tipsDismissed: false, variant: 'founder',
  guided: true, toast: null, milestonesSeen: new Set(), unlockNote: null
};

/** What just changed, in plain words — the formative-feedback layer. */
function deltasBetween(before, after) {
  const out = [];
  for (const [key, label] of DELTA_LABELS) {
    const d = Math.round((after[key] - before[key]) * 10) / 10;
    if (Math.abs(d) >= 1) out.push(`${label} ${d > 0 ? '+' : ''}${d}`);
  }
  return out.slice(0, 4);
}

function actionTitle(action) {
  if (action.type === 'm2') return 'Invite an ally';
  if (action.type === 'event') return 'Your call';
  if (action.type === 'join') return 'You joined the alliance';
  const copy = instrumentCopy(
    game.data.byCode[game.player.code], game.player.convertAxes, game.player.positional
  )[action.type];
  return copy?.name ?? INSTRUMENTS[action.type]?.name ?? 'Move';
}

/** Milestones: name the moment when something real is achieved. */
function checkMilestones() {
  const snap = snapshot(game);
  const fire = (id) => {
    if (ui.milestonesSeen.has(id)) return;
    ui.milestonesSeen.add(id);
    ui.toast = { kind: 'milestone', title: MILESTONES[id].title, lines: [MILESTONES[id].text] };
  };
  if (convertedPoints(game) > 0) fire('firstTerms');
  if (snap.members >= 3) fire('threeAllies');
  if (snap.pooled >= snap.threshold) fire('pastLine');
  if (snap.convertedPts >= snap.convertiblePts - 0.05) fire('fullyConverted');
  if (game.govLevel >= 3 && game.fieldbuilding > 0) fire('govMax');
  if (game.club?.joined) fire('joined');
}

function readUrl() {
  const q = new URLSearchParams(location.search);
  const country = countries.countries.find((c) => c.code === q.get('country') && c.tier !== 'X');
  return {
    seed: q.get('seed') || randomSeed(),
    scenarioId: scenarios.scenarios.some((s) => s.id === q.get('scenario')) ? q.get('scenario') : 'bipolar',
    countryCode: country ? country.code : null,
    variant: q.get('start') === 'latecomer' ? 'latecomer' : 'founder'
  };
}

function writeUrl(seed, scenarioId, countryCode, variant) {
  const q = new URLSearchParams({ seed, scenario: scenarioId, country: countryCode });
  if (variant === 'latecomer') q.set('start', 'latecomer');
  try {
    history.replaceState(null, '', `${location.pathname}?${q}`);
  } catch {
    // file:// in some browsers — the run still works, the URL just won't update
  }
}

function randomSeed() {
  const words = ['davos', 'redata', 'itaipu', 'ceara', 'pix', 'niobium', 'belem', 'manaus', 'recife', 'quito'];
  return words[Math.floor(Math.random() * words.length)] + '-' + Math.floor(Math.random() * 9999);
}

function startRun(seed, scenarioId, countryCode, variant = ui.variant) {
  game = newGame({ params, countries, scenarios, events, seed, scenarioId, playerCode: countryCode, variant });
  ui.summary = null;
  ui.showPicker = false;
  ui.variant = variant;
  ui.toast = null;
  ui.unlockNote = null;
  ui.milestonesSeen = new Set();
  writeUrl(seed, scenarioId, game.player.code, variant);
  scenarioSelect.value = scenarioId;
  seedInput.value = seed;
  draw();
}

const handlers = {
  onAction(action) {
    try {
      const before = snapshot(game);
      applyAction(game, action);
      if (game.flags.acceptedPole) {
        endTurn(game); // signing ends the game — the epilogue tells the rest
      } else {
        const deltas = deltasBetween(before, snapshot(game));
        if (deltas.length > 0 && action.type !== 'decline') {
          ui.toast = { kind: 'move', title: actionTitle(action), lines: deltas };
        }
        checkMilestones();
      }
    } catch (err) {
      console.warn(err.message);
    }
    draw();
  },
  onEndTurn() {
    const before = game.log.length;
    endTurn(game);
    // Everything logged while the year turned becomes the recap sheet.
    ui.summary = game.log.slice(before).filter((l) => l.phase === 'resolution');
    ui.toast = null;
    if (!game.ended) {
      checkMilestones();
      ui.unlockNote = ui.guided ? UNLOCKS[game.turn] ?? null : null;
    }
    draw();
  },
  onContinue() {
    ui.summary = null;
    draw();
  },
  onReplay() {
    startRun(game.seed, game.scenarioId, game.player.code, ui.variant);
  },
  onNewSeed() {
    // New game: fresh code, and back to the country picker.
    seedInput.value = randomSeed();
    ui.showPicker = true;
    ui.summary = null;
    draw();
  },
  onPick(code) {
    startRun(seedInput.value.trim() || randomSeed(), scenarioSelect.value, code, ui.variant);
  },
  onVariant(variant) {
    ui.variant = variant;
    draw();
  },
  onHelp() {
    ui.showIntro = true;
    ui.introMode = 'help';
    draw();
  },
  onCloseIntro() {
    ui.showIntro = false;
    if (ui.introMode === 'first') ui.showPicker = true;
    ui.introMode = 'help';
    draw();
  },
  onDismissTips() {
    ui.tipsDismissed = true;
    draw();
  },
  onShowAll() {
    ui.guided = false;
    draw();
  }
};

function draw() {
  render(root, game, handlers, ui);
}

// Populate the scenario control.
for (const s of scenarios.scenarios) {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = s.name;
  opt.title = s.blurb;
  scenarioSelect.appendChild(opt);
}

newRunBtn.addEventListener('click', () => {
  ui.showPicker = true;
  draw();
});
scenarioSelect.addEventListener('change', () => {
  startRun(seedInput.value.trim() || randomSeed(), scenarioSelect.value, game.player.code, ui.variant);
});

const { seed, scenarioId, countryCode, variant } = readUrl();
ui.variant = variant;
startRun(seed, scenarioId, countryCode ?? undefined, variant);
