// v3: wants (incentives to collaborate), chain coverage (the board), and the
// table (when to spend leverage). The pedagogy, tested.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadData, start, declineOffer } from './helpers.js';
import {
  newGame, endTurn, applyAction, legalActions, recruitCost, tableOpen,
  chainLinks, chainCovered, chainTarget, countryWants, wantsFor
} from '../engine/game.js';
import { seatGatesMet } from '../engine/endings.js';

const data = loadData();
const by = (code) => data.countries.countries.find((c) => c.code === code);

test('wants: every middle power has a reason to collaborate, from its weakest links', () => {
  for (const c of data.countries.countries.filter((x) => x.tier !== 'X')) {
    const wants = countryWants(data.params, c);
    assert.ok(wants.length >= 1, `${c.code}: no wants derived`);
    for (const w of wants) assert.ok(c.axes[w] <= 1, `${c.code}: wants ${w} but already holds it`);
  }
  assert.deepEqual(countryWants(data.params, by('ID')), ['models', 'capital'], 'Indonesia wants technology and funding');
  assert.ok(countryWants(data.params, by('NL')).includes('compute'), 'the Netherlands wants shared compute');
});

test('met wants make joining cheaper and members steadier', () => {
  const g = start('wants-1', 'spring');
  if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'b' });
  // Indonesia wants credible funding: before the facility exists, no discount.
  const costBefore = recruitCost(g, 'ID');
  const riskBefore = (() => { const h = start('wants-1', 'spring'); if (h.pendingEvent) applyAction(h, { type: 'event', choice: 'b' }); applyAction(h, { type: 'm2', code: 'ID' }); return h.coalition[0].defRisk; })();
  // Fund the facility for a year: the capital want is now met.
  applyAction(g, { type: 'm3' });
  declineOffer(g);
  endTurn(g);
  if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'b' });
  assert.ok(wantsFor(g, by('ID')).some((w) => w.axis === 'capital' && w.met), 'funding met after a funded year');
  assert.ok(recruitCost(g, 'ID') <= costBefore, 'meeting a want never raises the price');
  applyAction(g, { type: 'm2', code: 'ID' });
  const riskAfter = g.coalition[0].defRisk;
  assert.ok(riskAfter < riskBefore, `a member whose want is met joins committed (${riskAfter} < ${riskBefore})`);
});

test('chain: unconverted player assets do not light links; members do', () => {
  const g = start('chain-1', 'bipolar');
  assert.equal(chainLinks(g).filter((l) => l.covered).length, 0, 'Brazil alone, unconverted: dark chain');
  if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'b' });
  applyAction(g, { type: 'm2', code: 'ID' }); // Indonesia: minerals 3, compute 2, market 2
  const covered = chainLinks(g).filter((l) => l.covered).map((l) => l.axis);
  assert.ok(covered.includes('minerals') && covered.includes('compute') && covered.includes('market'));
  // Convert Brazil's own strengths past 50%: its market lights too.
  g.player.converted.market = 0.6;
  assert.ok(chainLinks(g).find((l) => l.axis === 'market').by.includes('BR'), 'converted strength counts');
  g.player.converted.market = 0.4;
  assert.ok(!chainLinks(g).find((l) => l.axis === 'market').by.includes('BR'), 'half-converted does not');
});

test('the seat needs breadth: pooled weight alone is not enough', () => {
  const g = start('chain-2', 'bipolar');
  // Winning-level weight by construction, but a narrow chain:
  for (const axis of g.player.convertAxes) g.player.converted[axis] = 1;
  if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'b' });
  for (const code of ['IN', 'ID']) { g.ap = 2; applyAction(g, { type: 'm2', code }); }
  g.ap = 2; applyAction(g, { type: 'm2', code: 'ZA' });
  g.trust = 90; g.crit.c6 = 70;
  g.tempSpike = 30; // force pooled past any threshold
  assert.ok(chainCovered(g) < chainTarget(g), `test setup: chain should be short (${chainCovered(g)}/${chainTarget(g)})`);
  assert.ok(!seatGatesMet(g), 'no seat without covering the chain');
  // Add the missing links with unconventional breadth: Korea (chips, money) + Norway (money) + Germany (machines).
  for (const code of ['KR', 'DE']) { g.ap = 2; applyAction(g, { type: 'm2', code }); }
  assert.ok(chainCovered(g) >= chainTarget(g), `breadth lights the chain (${chainCovered(g)}/${chainTarget(g)})`);
  assert.ok(seatGatesMet(g), 'now the poles cannot route around you');
});

test('the table: claim the seat when your leverage peaks, and it is yours', () => {
  const g = start('table-1', 'spring');
  if (g.pendingEvent) applyAction(g, { type: 'event', choice: 'b' });
  assert.ok(!tableOpen(g), 'no table on day one');
  assert.throws(() => applyAction(g, { type: 'table' }), /not open/);
  // Construct a ready position.
  for (const axis of g.player.convertAxes) g.player.converted[axis] = 1;
  for (const code of ['IN', 'ID', 'ZA', 'CA']) { g.ap = 2; applyAction(g, { type: 'm2', code }); }
  g.trust = 90;
  assert.ok(tableOpen(g), `gates: pooled ok? chain ${chainCovered(g)}/${chainTarget(g)}`);
  assert.ok(legalActions(g).some((a) => a.type === 'table'));
  applyAction(g, { type: 'table' });
  const ending = endTurn(g);
  assert.equal(ending.id, 'seat');
  assert.ok(ending.lines.some((l) => l.includes('went to the table')), 'debrief credits the timing');
});
