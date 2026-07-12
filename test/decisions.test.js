// Turn variety: events are decisions with forked consequences, and the move
// menu evolves — the court gate, technology tiers, and the scaling fund bill.

import test from 'node:test';
import assert from 'node:assert/strict';
import { start, loadData, declineOffer } from './helpers.js';
import { newGame, endTurn, applyAction, legalActions } from '../engine/game.js';

const data = loadData();

function eventAction(g) {
  return legalActions(g).find((a) => a.type === 'event');
}

test('every year opens on a decision, and the two options genuinely fork', () => {
  const a = start('fork', 'bipolar');
  const b = start('fork', 'bipolar');
  assert.ok(a.pendingEvent, 'an event is pending from turn 1');
  const ev = eventAction(a);
  assert.ok(ev.choices.a.label !== ev.choices.b.label);

  applyAction(a, { type: 'event', choice: 'a' });
  applyAction(b, { type: 'event', choice: 'b' });
  assert.equal(a.pendingEvent, null, 'deciding clears the question');
  assert.notDeepEqual(
    { crit: a.crit, trust: a.trust, nature: a.nature, dials: a.dials, ap: a.ap, c1Flat: a.c1Flat },
    { crit: b.crit, trust: b.trust, nature: b.nature, dials: b.dials, ap: b.ap, c1Flat: b.c1Flat },
    'choosing differently must lead somewhere different'
  );
  assert.throws(() => applyAction(a, { type: 'event', choice: 'a' }), /No event to decide/);
});

test('an undecided event resolves to the passive option at year end', () => {
  const g = start('lapse', 'bipolar');
  const pendingId = g.pendingEvent;
  declineOffer(g);
  endTurn(g);
  assert.ok(g.log.some((l) => l.text.includes('the year decided for you')), 'lapse is named');
  assert.equal(g.lastChoice?.key ?? 'b', 'b');
  assert.notEqual(g.pendingEvent, pendingId, 'a new question arrives with the new year');
});

test('the court needs an opening: a live case or strong institutions', () => {
  const g = start('gate', 'bipolar');
  applyAction(g, { type: 'event', choice: 'b' }); // resolve whatever turn 1 asks
  if (g.crit.c5 < g.params.instruments.m4.gateC5 && g.legalOpening === 0) {
    const m4 = legalActions(g).find((a) => a.type === 'm4');
    assert.ok(!m4.enabled && /opening/i.test(m4.reason), 'm4 gated without a case');
    assert.throws(() => applyAction(g, { type: 'm4' }), /No legal opening/);
  }
  // A licensing case opens the door…
  g.legalOpening = 2;
  assert.ok(legalActions(g).find((a) => a.type === 'm4').enabled, 'live case opens m4');
  applyAction(g, { type: 'm4' });
  // …and the opening expires.
  declineOffer(g);
  endTurn(g);
  assert.equal(g.legalOpening, 1, 'openings tick down');

  const h = start('gate-2', 'bipolar');
  h.crit.c5 = 80;
  assert.ok(legalActions(h).find((a) => a.type === 'm4').enabled, 'strong institutions open m4 too');
});

test('sharing technology deepens in tiers', () => {
  const g = start('tiers', 'bipolar');
  applyAction(g, { type: 'event', choice: 'b' });
  applyAction(g, { type: 'm2', code: 'ID' });
  const tiers = g.params.instruments.m6.tiers;
  let lastBonus = 0;
  for (let i = 0; i < 3; i++) {
    g.ap = 2;
    applyAction(g, { type: 'm6' });
    assert.ok(g.m6FactorBonus > lastBonus, `tier ${i + 1} deepens the pool`);
    lastBonus = g.m6FactorBonus;
  }
  assert.equal(g.m6Uses, 3);
  assert.ok(g.m6FactorBonus <= g.params.instruments.m6.factorBonusCap + 1e-9);
  assert.ok(tiers[2].structuralRelief > tiers[0].structuralRelief, 'the deepest tier binds hardest');
});

test('a bigger coalition costs more to fund', () => {
  const g = start('bill', 'spring');
  applyAction(g, { type: 'event', choice: 'b' });
  g.facility.everFunded = true;
  const cost = (gg) => legalActions(gg).find((a) => a.type === 'm3').ap;
  assert.equal(cost(g), 1, 'small coalition, small bill');
  for (const code of ['ID', 'ZA', 'IN', 'CA', 'NO']) {
    g.ap = 2;
    applyAction(g, { type: 'm2', code });
  }
  assert.equal(g.coalition.length, 5);
  assert.equal(cost(g), 2, 'five members, bigger bill');
});

test('fieldbuilding: slow, compounding, and yours even from outside the alliance', () => {
  const g = start('field', 'bipolar');
  applyAction(g, { type: 'event', choice: 'b' });
  assert.equal(g.govLevel, 2, 'Brazil starts at Medium');
  const c5Before = g.crit.c5;
  applyAction(g, { type: 'm7' });
  assert.equal(g.crit.c5, c5Before + g.params.instruments.m7.c5Gain, 'steadier policy per investment');
  assert.equal(g.govLevel, 2, 'no level yet — ecosystems grow slowly');
  applyAction(g, { type: 'm7' });
  assert.equal(g.govLevel, 3, 'second investment lifts maturity');
  const m7 = legalActions(g).find((a) => a.type === 'm7');
  assert.ok(!m7.enabled && /full strength/.test(m7.reason), 'capped at strong');
  g.ap = 2; // fresh moves so the gate check isn't confounded by an empty purse
  const m4 = legalActions(g).find((a) => a.type === 'm4');
  assert.ok(m4.enabled, 'a strong ecosystem keeps the courtroom door open');

  // Faster conversion after the level-up: compare against a twin that never invested.
  const plain = start('field', 'bipolar');
  applyAction(plain, { type: 'event', choice: 'b' });
  plain.ap = 1; g.ap = 1;
  g.turnMods.m1Boost = 0; plain.turnMods.m1Boost = 0;
  applyAction(g, { type: 'm1' });
  applyAction(plain, { type: 'm1' });
  const axis = g.player.convertAxes[0];
  assert.ok(g.player.converted[axis] > plain.player.converted[axis], 'maturity converts faster');

  // A latecomer outsider can still build the field at home.
  const late = newGameLate('field-late');
  if (late.pendingEvent) applyAction(late, { type: 'event', choice: 'b' });
  assert.ok(legalActions(late).find((a) => a.type === 'm7').enabled, 'fieldbuilding is domestic — no alliance needed');
});

function newGameLate(seed) {
  return newGame({ ...data, seed, scenarioId: 'bipolar', playerCode: 'BR', variant: 'latecomer' });
}

test('decisions are deterministic: same seed, same choices, same game', () => {
  const play = () => {
    const g = start('det-choice', 'acceleration');
    while (!g.ended) {
      if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'a' });
      declineOffer(g);
      endTurn(g);
    }
    return g;
  };
  const one = play();
  const two = play();
  assert.deepEqual(one.history, two.history);
  assert.deepEqual(one.ended, two.ended);
});
