// Any-country play: all 18 middle powers must complete a full run, and the
// positional/convertible split must behave as the paper describes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, declineOffer } from './helpers.js';
import { newGame, endTurn, applyAction, legalActions, convertedPoints, snapshot } from '../engine/game.js';

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

test('starting outcomes reflect the real world, then the game moves them', () => {
  const nl = newGame({ ...data, seed: 'base', scenarioId: 'bipolar', playerCode: 'NL' });
  const inGame = newGame({ ...data, seed: 'base', scenarioId: 'bipolar', playerCode: 'IN' });
  const nlStart = snapshot(nl);
  const inStart = snapshot(inGame);
  assert.ok(nlStart.economy >= 80, `the Netherlands starts prosperous (got ${nlStart.economy})`);
  assert.ok(nlStart.people >= 80, `the Netherlands starts with high quality of life (got ${nlStart.people})`);
  assert.ok(nlStart.economy > inStart.economy + 25, 'the Netherlands starts far richer than India');
  assert.equal(Math.round(nl.nature), data.countries.countries.find((c) => c.code === 'NL').baseline.nature,
    'nature starts at the country baseline');
});

test('every country has a signature move, and it fires once', async () => {
  const { SIGNATURES, SIGNATURE_FX } = await import('../ui/copy.js');
  for (const c of playable) {
    assert.ok(SIGNATURES[c.code]?.name, `${c.code}: needs a signature name`);
    const g = newGame({ ...data, seed: 'sig-' + c.code, scenarioId: 'bipolar', playerCode: c.code });
    assert.ok(data.params.signature.archetypes[g.player.signatureAxis], `${c.code}: signature axis maps to an archetype`);
    assert.ok(SIGNATURE_FX[g.player.signatureAxis], `${c.code}: signature has chips`);
  }
  // Brazil's iconic lever is the grid (REDATA), India's is the market — the overrides hold.
  const br = newGame({ ...data, seed: 'sig', scenarioId: 'bipolar', playerCode: 'BR' });
  assert.equal(br.player.signatureAxis, 'compute');
  const inn = newGame({ ...data, seed: 'sig', scenarioId: 'bipolar', playerCode: 'IN' });
  assert.equal(inn.player.signatureAxis, 'market');

  // One shot: it works, then it's gone.
  if (br.pendingEvent) applyAction(br, { type: 'event', choice: 'b' });
  const c4Before = br.crit.c4;
  applyAction(br, { type: 'm8' });
  assert.ok(br.crit.c4 > c4Before, 'Brazil’s grid auction buys independence');
  assert.ok(br.signatureUsed);
  const m8 = legalActions(br).find((a) => a.type === 'm8');
  assert.ok(!m8.enabled && /once/.test(m8.reason), 'played means played');
  assert.throws(() => applyAction(br, { type: 'm8' }), /already played/);

  // The Netherlands' licence pause slows the whole race.
  const nl = newGame({ ...data, seed: 'sig', scenarioId: 'bipolar', playerCode: 'NL' });
  if (nl.pendingEvent) applyAction(nl, { type: 'event', choice: 'b' });
  const conc = nl.concentration;
  applyAction(nl, { type: 'm8' });
  assert.ok(nl.concentration < conc, 'pausing the licences brakes concentration');
});

test('move cards speak each country’s own language', async () => {
  const { instrumentCopy, M1_HOOKS } = await import('../ui/copy.js');
  const { playerConvertAxes } = await import('../engine/state.js');
  for (const c of playable) {
    assert.ok(M1_HOOKS[c.code], `${c.code}: needs a Set-conditions hook`);
    const copy = instrumentCopy(c, playerConvertAxes(data.params, c), data.params.pool.positionalCountries.includes(c.code));
    assert.ok(copy.m1.blurb.includes('your '), `${c.code}: m1 names their assets`);
    assert.ok(!copy.m1.blurb.includes('undefined'), `${c.code}: no broken axis names`);
    assert.ok(copy.m4.blurb.length > 20 && copy.m5.blurb.length > 20, `${c.code}: m4/m5 have real copy`);
  }
  const nl = playable.find((c) => c.code === 'NL');
  const nlCopy = instrumentCopy(nl, playerConvertAxes(data.params, nl), true);
  assert.ok(nlCopy.m1.blurb.includes('ASML'), 'the Netherlands talks about ASML, not clean energy');
  assert.ok(nlCopy.m5.blurb.includes('Washington'), 'US-leaning countries hear from Washington');
  const br = playable.find((c) => c.code === 'BR');
  const brCopy = instrumentCopy(br, playerConvertAxes(data.params, br), false);
  assert.ok(brCopy.m1.blurb.includes('REDATA'), 'Brazil keeps its REDATA hook');
  assert.ok(brCopy.m5.blurb.includes('Beijing'), 'China-leaning countries hear from Beijing');
});

test('a mature governance ecosystem converts faster (the report’s governance map)', () => {
  const converted = (code) => {
    const g = newGame({ ...data, seed: 'gov', scenarioId: 'bipolar', playerCode: code });
    if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'b' });
    g.turnMods.m1Boost = 0; // isolate the governance factor from event boosts
    applyAction(g, { type: 'm1' });
    return g.player.converted[g.player.convertAxes[0]];
  };
  const de = converted('DE'); // gov 3 (High)
  const id = converted('ID'); // gov 1 (Developing)
  assert.ok(de > id, `Germany's terms should bind faster than Indonesia's (${de.toFixed(3)} vs ${id.toFixed(3)})`);
  const br = converted('BR'); // gov 2 (Medium) — anchored at exactly the base share
  assert.ok(Math.abs(br - data.params.instruments.m1.convertShare) < 1e-9,
    'Brazil (Medium) sits at the anchor: balance unchanged');
});

test('the player country cannot be invited into its own alliance, poles never playable', () => {
  const g = newGame({ ...data, seed: 'self', scenarioId: 'spring', playerCode: 'IN' });
  const m2 = legalActions(g).find((a) => a.type === 'm2');
  assert.ok(!m2.candidates.some((c) => ['IN', 'US', 'CN'].includes(c.code)));
  assert.ok(m2.candidates.some((c) => c.code === 'BR'), 'Brazil is recruitable when you play India');
  assert.throws(() => newGame({ ...data, seed: 'x', scenarioId: 'spring', playerCode: 'US' }), /not playable/);
});
