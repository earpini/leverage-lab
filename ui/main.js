// Boot: load data (JSON modules, no build step), read the game code + scenario
// from the URL, run the game loop. No localStorage — the URL is the save state.

import params from '../data/params.json' with { type: 'json' };
import countries from '../data/countries.json' with { type: 'json' };
import scenarios from '../data/scenarios.json' with { type: 'json' };
import events from '../data/events.json' with { type: 'json' };
import { newGame, applyAction, endTurn } from '../engine/game.js';
import { render } from './render.js';

const root = document.getElementById('app');
const scenarioSelect = document.getElementById('scenario-select');
const seedInput = document.getElementById('seed-input');
const newRunBtn = document.getElementById('new-run');

let game = null;
// introMode 'first': the opening intro, which always leads to the country picker.
// introMode 'help': reopened mid-game via "How to play" — closing returns to the game.
const ui = { showIntro: true, introMode: 'first', showPicker: false, summary: null, tipsDismissed: false, variant: 'founder' };

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
  writeUrl(seed, scenarioId, game.player.code, variant);
  scenarioSelect.value = scenarioId;
  seedInput.value = seed;
  draw();
}

const handlers = {
  onAction(action) {
    try {
      applyAction(game, action);
      if (game.flags.acceptedPole) endTurn(game); // signing ends the game
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
