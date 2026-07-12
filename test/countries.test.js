// Any-country play: all 18 middle powers must complete a full run, and the
// positional/convertible split must behave as the paper describes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, declineOffer } from './helpers.js';
import { newGame, endTurn, applyAction, legalActions, convertedPoints } from '../engine/game.js';

const data = loadData();
const playable = data.countries.countries.filter((c) => c.tier !== 'X');

test('all 18 middle powers complete a full run', () => {
  assert.equal(playable.length, 18);
  for (const country of playable) {
    const g = newGame({ ...data, seed: 'any-' + country.code, scenarioId: 'bipolar', playerCode: country.code });
    assert.equal(g.player.convertAxes.length, 3, `${country.code}: three convertible axes`);
    let guard = 0;
    while (!g.ended && guard++ < 20) {
      // Generic policy: fund, then convert, decline everything.
      for (const act of legalActions(g)) {
        if (act.type === 'm3' && act.enabled) { applyAction(g, { type: 'm3' }); break; }
      }
      while (g.ap > 0 && legalActions(g).some((a) => a.type === 'm1' && a.enabled)) {
        applyAction(g, { type: 'm1' });
      }
      declineOffer(g);
      endTurn(g);
    }
    assert.ok(g.ended, `${country.code}: run must end`);
    assert.ok(g.ended.score >= 0 && g.ended.score <= 100, `${country.code}: sane score`);
    for (const snap of g.history) {
      assert.ok(snap.people >= 0 && snap.people <= 100, `${country.code}: people in bounds`);
      assert.ok(snap.economy >= 0 && snap.economy <= 100, `${country.code}: economy in bounds`);
      assert.ok(snap.nature >= 0 && snap.nature <= 100, `${country.code}: nature in bounds`);
    }
  }
});

test('positional players start on their bottleneck; convertible players start from zero', () => {
  const tw = newGame({ ...data, seed: 'pos', scenarioId: 'bipolar', playerCode: 'TW' });
  assert.ok(tw.player.positional);
  assert.ok(convertedPoints(tw) >= 3, 'Taiwan: the fab axis counts from day one');
  assert.equal(tw.crit.c3, data.params.criteriaStart.c3 + data.params.conversion.positionalStartHeat,
    'positional players start with extra heat');

  const br = newGame({ ...data, seed: 'pos', scenarioId: 'bipolar', playerCode: 'BR' });
  assert.ok(!br.player.positional);
  assert.equal(convertedPoints(br), 0, 'Brazil: nothing counts until terms are set');
  assert.deepEqual([...br.player.convertAxes].sort(), ['compute', 'market', 'minerals'],
    'Brazil converts its historic three axes — balance unchanged');
});

test('the player country cannot be invited into its own alliance, poles never playable', () => {
  const g = newGame({ ...data, seed: 'self', scenarioId: 'spring', playerCode: 'IN' });
  const m2 = legalActions(g).find((a) => a.type === 'm2');
  assert.ok(!m2.candidates.some((c) => ['IN', 'US', 'CN'].includes(c.code)));
  assert.ok(m2.candidates.some((c) => c.code === 'BR'), 'Brazil is recruitable when you play India');
  assert.throws(() => newGame({ ...data, seed: 'x', scenarioId: 'spring', playerCode: 'US' }), /not playable/);
});
