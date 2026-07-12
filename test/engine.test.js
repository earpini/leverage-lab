// Engine unit tests: determinism, AP accounting, recruit pricing, events,
// offers, and snapshot sanity.

import test from 'node:test';
import assert from 'node:assert/strict';
import { start, run, loadData, declineOffer, policyConvert } from './helpers.js';
import {
  endTurn, applyAction, legalActions, recruitCost, offersOpen, snapshot
} from '../engine/game.js';

test('same seed + same actions → identical runs', () => {
  const a = run(start('twin', 'acceleration'), policyConvert);
  const ga = start('twin', 'acceleration');
  const b = run(ga, policyConvert);
  assert.deepEqual(a, b);
  const gb = start('twin', 'acceleration');
  run(gb, policyConvert);
  assert.deepEqual(ga.history, gb.history);
  assert.deepEqual(ga.log, gb.log);
});

test('different seeds diverge', () => {
  const a = start('one', 'bipolar');
  const b = start('two', 'bipolar');
  const eventsA = [];
  const eventsB = [];
  while (!a.ended) { declineOffer(a); eventsA.push(a.currentEvent); endTurn(a); }
  while (!b.ended) { declineOffer(b); eventsB.push(b.currentEvent); endTurn(b); }
  assert.notDeepEqual(eventsA, eventsB, 'event sequences should differ across seeds');
});

test('AP accounting: costs enforced, illegal moves throw', () => {
  const g = start('ap', 'bipolar');
  assert.equal(g.ap, 2);
  applyAction(g, { type: 'm3' }); // first funding costs 2
  assert.equal(g.ap, 0);
  assert.throws(() => applyAction(g, { type: 'm1' }), /Not enough AP/);
  declineOffer(g);
  endTurn(g);
  assert.equal(g.ap, 2);
  applyAction(g, { type: 'm3' }); // sustaining costs 1
  assert.equal(g.ap, 1);
  assert.throws(() => applyAction(g, { type: 'm3' }), /already funded/);
  assert.throws(() => applyAction(g, { type: 'm6' }), /needs a coalition/);
});

test('recruit pricing follows tier, regime distance and positional status', () => {
  const g = start('price', 'bipolar');
  g.turnMods.recruitDiscount = 0; // isolate base pricing from any summit-event discount
  assert.equal(recruitCost(g, 'ID'), 1, 'Indonesia: anchor, near regime — base price');
  assert.equal(recruitCost(g, 'CA'), 1, 'Canada: tier B, full democracy — base price');
  assert.equal(recruitCost(g, 'AE'), 2, 'UAE: tier D and distant regime — surcharged');
  assert.equal(recruitCost(g, 'NL'), 2, 'Netherlands: positional — surcharged');
  assert.throws(() => applyAction(g, { type: 'm2', code: 'US' }), /Not recruitable/);
  applyAction(g, { type: 'm2', code: 'ID' });
  assert.throws(() => applyAction(g, { type: 'm2', code: 'ID' }), /Already a member/);
});

test('events fire once per run, one per turn', () => {
  const g = start('deck', 'spring');
  const seen = [];
  while (!g.ended) {
    seen.push(g.currentEvent);
    declineOffer(g);
    endTurn(g);
  }
  assert.equal(seen.length, 8);
  assert.equal(new Set(seen).size, 8, 'no event repeats within a run');
});

test('pole offers: declining costs exposure, accepting ends the run on terms', () => {
  const { params } = loadData();
  const g = start('offers', 'bipolar');
  // Walk forward to a courtship turn (cn courts turn 2 at the latest, barring event offers).
  while (!offersOpen(g) && !g.ended) { endTurn(g); }
  assert.ok(offersOpen(g), 'a pole should court the player early');
  const c3Before = g.crit.c3;
  applyAction(g, { type: 'decline' });
  assert.equal(g.crit.c3, c3Before + params.poles.declineC3Cost);

  const h = start('offers', 'bipolar');
  while (!offersOpen(h) && !h.ended) { endTurn(h); }
  applyAction(h, { type: 'accept' });
  const ending = endTurn(h);
  assert.equal(ending.id, 'junior-partner');
  assert.equal(ending.score, params.endings.junior.base + ending.terms);
  assert.ok(ending.lines.length > 0, 'debrief names what happened');
});

test('snapshot stays in bounds for a full aggressive run', () => {
  const g = start('bounds', 'acceleration');
  const policy = (gg, spend) => {
    gg.crit.c5 = 85; // strong institutions keep the courtroom door open (m4 gate)
    spend({ type: 'm4' });
    spend({ type: 'm4' });
  };
  run(g, policy);
  for (const snap of g.history) {
    for (const k of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
      assert.ok(snap[k] >= 0 && snap[k] <= 100, `${k} in [0,100], got ${snap[k]}`);
    }
    assert.ok(snap.pooled >= 0);
    assert.ok(snap.threshold >= 12);
  }
  // Wielding rules as a posture should end in the retaliation spiral.
  assert.equal(g.ended.id, 'retaliation-spiral');
});

test('legal actions reflect state', () => {
  const g = start('legal', 'bipolar');
  const acts = Object.fromEntries(legalActions(g).map((a) => [a.type, a]));
  assert.ok(acts.m1.enabled);
  assert.equal(acts.m3.ap, 2);
  assert.ok(!acts.m6.enabled, 'M6 needs a coalition');
  assert.ok(acts.m2.candidates.length >= 15);
  assert.ok(!acts.m2.candidates.some((c) => c.code === 'US' || c.code === 'CN' || c.code === 'BR'));
});
