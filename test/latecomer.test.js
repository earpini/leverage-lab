// Latecomer variant: an alliance already exists, and leverage is the ticket in.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, declineOffer } from './helpers.js';
import {
  newGame, endTurn, applyAction, legalActions, offersOpen, isOutside, pooledLeverage, convertedPoints
} from '../engine/game.js';

const data = loadData();

function startLate(seed, playerCode = 'BR', scenarioId = 'bipolar') {
  return newGame({ ...data, seed, scenarioId, playerCode, variant: 'latecomer' });
}

function acts(g) {
  return Object.fromEntries(legalActions(g).map((a) => [a.type, a]));
}

test('the club exists at start and the outsider is locked out of alliance moves', () => {
  const g = startLate('club-1');
  assert.equal(g.coalition.length, 3, 'three founders');
  assert.ok(isOutside(g));
  assert.equal(pooledLeverage(g) > 0, true, 'their pool counts');
  const a = acts(g);
  assert.ok(!a.m2.enabled && a.m2.reason, 'no recruiting from outside');
  assert.ok(!a.m3.enabled && a.m3.reason, 'no funding from outside');
  assert.ok(!a.m6.enabled && a.m6.reason, 'no pooling from outside');
  assert.ok(a.m1.enabled, 'converting at home is always yours');
  assert.ok(a.join && !a.join.enabled, 'join visible but gated');
  assert.throws(() => applyAction(g, { type: 'm3' }), /Not in the alliance/);
  assert.throws(() => applyAction(g, { type: 'join' }), /Not enough converted leverage/);
});

test('if the player is a founder country, a substitute takes their chair', () => {
  const g = startLate('club-2', 'IN');
  assert.ok(!g.coalition.some((m) => m.code === 'IN'));
  assert.equal(g.coalition.length, 3, 'substitutes fill the roster');
});

test('converted leverage is the ticket: qualify, join, unlock', () => {
  const g = startLate('club-3');
  let guard = 0;
  while (isOutside(g) && !g.ended && guard++ < 20) {
    const a = acts(g);
    if (a.join?.enabled) {
      applyAction(g, { type: 'join' });
      break;
    }
    while (g.ap > 0 && acts(g).m1?.enabled) applyAction(g, { type: 'm1' });
    declineOffer(g);
    endTurn(g);
  }
  assert.ok(g.club.joined, 'joined via converted leverage');
  assert.ok(convertedPoints(g) >= g.club.entryBar);
  const a = acts(g);
  assert.ok(a.m3.enabled || a.m3.ap === 1, 'funding unlocks after joining');
  assert.ok(a.m2.candidates.length > 0, 'recruiting unlocks after joining');
  assert.ok(!a.join, 'join disappears once inside');
  // Your conversion now counts in the pool.
  const before = pooledLeverage(g);
  assert.ok(before > 0 && before >= convertedPoints(g), 'own conversion pools once inside');
});

test('outside the alliance you get none of its access and little of its protection', () => {
  const g = startLate('club-4');
  const snapEarly = g.history.length ? g.history[0] : null;
  // Never join, never act: watch it from outside.
  while (!g.ended) {
    declineOffer(g);
    endTurn(g);
  }
  assert.ok(g.ended.id !== 'seat' && g.ended.id !== 'broker',
    'their pool never becomes your seat: got ' + g.ended.id);
  if (g.cutoff) {
    assert.ok(g.cutoff.severity > 0.5, `outside protection must be weak (got ${g.cutoff.severity.toFixed(2)})`);
  }
  const lines = g.ended.lines.join(' ');
  assert.ok(/alliance/.test(lines), 'debrief names the alliance story');
});

test('the club self-funds on odd years while you are outside', () => {
  const g = startLate('club-5');
  declineOffer(g);
  endTurn(g); // resolution of turn 1 (odd): club funds itself
  assert.ok(g.log.some((l) => l.text.includes('without you')), 'club funding logged');
  assert.ok(g.facility.streak >= 1, 'their facility streak builds');
});
