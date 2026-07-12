// Boot: load data (JSON modules, no build step), read seed + scenario from the
// URL, run the game loop. No localStorage — the URL is the whole save state.

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

function readUrl() {
  const q = new URLSearchParams(location.search);
  return {
    seed: q.get('seed') || randomSeed(),
    scenarioId: scenarios.scenarios.some((s) => s.id === q.get('scenario')) ? q.get('scenario') : 'bipolar'
  };
}

function writeUrl(seed, scenarioId) {
  const q = new URLSearchParams({ seed, scenario: scenarioId });
  try {
    history.replaceState(null, '', `${location.pathname}?${q}`);
  } catch {
    // file:// in some browsers — the run still works, the URL just won't update
  }
}

function randomSeed() {
  const words = ['davos', 'redata', 'tfff', 'itaipu', 'ceara', 'pix', 'niobium', 'belem', 'manaus', 'quito'];
  return words[Math.floor(Math.random() * words.length)] + '-' + Math.floor(Math.random() * 9999);
}

function startRun(seed, scenarioId) {
  game = newGame({ params, countries, scenarios, events, seed, scenarioId });
  writeUrl(seed, scenarioId);
  scenarioSelect.value = scenarioId;
  seedInput.value = seed;
  draw();
}

function draw() {
  render(root, game, {
    onAction(action) {
      try {
        applyAction(game, action);
        if (game.flags.acceptedPole) endTurn(game); // signing ends the run
      } catch (err) {
        console.warn(err.message);
      }
      draw();
    },
    onEndTurn() {
      endTurn(game);
      draw();
    },
    onReplay() {
      startRun(game.seed, game.scenarioId);
    },
    onNewSeed() {
      startRun(randomSeed(), game.scenarioId);
    }
  });
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
  startRun(seedInput.value.trim() || randomSeed(), scenarioSelect.value);
});
scenarioSelect.addEventListener('change', () => {
  startRun(seedInput.value.trim() || randomSeed(), scenarioSelect.value);
});

const { seed, scenarioId } = readUrl();
startRun(seed, scenarioId);
