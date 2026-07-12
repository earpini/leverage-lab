// Shared test scaffolding: data loading from fs (the engine does no I/O) and
// scripted bots used by the invariant tests.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newGame, endTurn, applyAction, offersOpen, legalActions } from '../engine/game.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

export function loadData() {
  return {
    params: readJson('data/params.json'),
    countries: readJson('data/countries.json'),
    scenarios: readJson('data/scenarios.json'),
    events: readJson('data/events.json')
  };
}

export const SCENARIOS = ['bipolar', 'acceleration', 'spring'];
export const SEEDS = ['alpha', 'bravo', 'carney'];

export function start(seed, scenarioId) {
  return newGame({ ...loadData(), seed, scenarioId });
}

export function declineOffer(g) {
  if (offersOpen(g)) applyAction(g, { type: 'decline' });
}

function tryAct(g, action) {
  const legal = legalActions(g).find((a) => a.type === action.type);
  if (!legal) return false;
  if (action.type === 'm2') {
    const cand = legal.candidates.find((c) => c.code === action.code);
    if (!cand || cand.cost > g.ap) return false;
  } else if (!legal.enabled) {
    return false;
  }
  applyAction(g, action);
  return true;
}

/**
 * Run a full game under a per-turn policy. The policy receives the game and a
 * `spend(action)` helper that ignores illegal moves; offers are declined unless
 * the policy handles them first.
 */
export function run(g, policy) {
  while (!g.ended) {
    policy(g, (action) => tryAct(g, action));
    declineOffer(g);
    endTurn(g);
  }
  return g.ended;
}

/** Facility + coalition + conversion: the paper's recommended path. */
export function policyConvert(g, spend) {
  if (g.turn === 1) { spend({ type: 'm3' }); return; }
  spend({ type: 'm3' });
  if (g.turn === 2) { spend({ type: 'm2', code: 'ID' }); return; }
  if (g.turn === 4) { spend({ type: 'm2', code: 'ZA' }); return; }
  if (g.turn >= 7) { spend({ type: 'm6' }); return; }
  spend({ type: 'm1' });
}

/** Identical to policyConvert with every M1 replaced by M5 — the dominance twin. */
export function policyGoAlone(g, spend) {
  if (g.turn === 1) { spend({ type: 'm3' }); return; }
  spend({ type: 'm3' });
  if (g.turn === 2) { spend({ type: 'm2', code: 'ID' }); return; }
  if (g.turn === 4) { spend({ type: 'm2', code: 'ZA' }); return; }
  if (g.turn >= 7) { spend({ type: 'm6' }); return; }
  spend({ type: 'm5' });
}

/** Solo baselines: no coalition at all, pure M1 vs pure M5. */
export function policyPureM1(g, spend) {
  spend({ type: 'm1' });
  spend({ type: 'm1' });
  spend({ type: 'm5' }); // only fires when conversion is exhausted
}

export function policyPureM5(g, spend) {
  spend({ type: 'm5' });
  spend({ type: 'm5' });
}

/** Recruit two members, then never fund anything. */
export function policyRecruitNeglect(g, spend) {
  if (g.turn === 1) {
    spend({ type: 'm2', code: 'ID' });
    spend({ type: 'm2', code: 'CA' });
  }
}

/** Recruit the same two members, then fund the facility every year. */
export function policyRecruitFund(g, spend) {
  if (g.turn === 1) {
    spend({ type: 'm2', code: 'ID' });
    spend({ type: 'm2', code: 'CA' });
    return;
  }
  spend({ type: 'm3' });
}
