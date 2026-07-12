// The four balance invariants from CLAUDE.md. Balance changes to data/params.json
// must keep every one of these green.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  start, run, loadData, SCENARIOS, SEEDS,
  policyConvert, policyGoAlone, policyPureM1, policyPureM5,
  policyRecruitNeglect, policyRecruitFund, declineOffer
} from './helpers.js';
import { endTurn, applyAction, offersOpen, legalActions, computeTerms } from '../engine/game.js';

// ---------------------------------------------------------------------------
// Invariant 1 — M5 is dominated in every scenario.
// Two twin policies differing only in M1 ↔ M5 (coalition play), plus a pure
// solo baseline. Going it alone must never score at least as well.
// ---------------------------------------------------------------------------
test('invariant 1: M5 is dominated in every scenario', () => {
  for (const scenario of SCENARIOS) {
    for (const seed of SEEDS) {
      const convert = run(start(seed, scenario), policyConvert);
      const alone = run(start(seed, scenario), policyGoAlone);
      assert.ok(
        convert.score > alone.score,
        `coalition twins, ${scenario}/${seed}: convert ${convert.score} (${convert.id}) must beat go-it-alone ${alone.score} (${alone.id})`
      );

      const pureM1 = run(start(seed, scenario), policyPureM1);
      const pureM5 = run(start(seed, scenario), policyPureM5);
      assert.ok(
        pureM1.score > pureM5.score,
        `solo twins, ${scenario}/${seed}: pure M1 ${pureM1.score} must beat pure M5 ${pureM5.score}`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Invariant 2 — unfunded coalitions decay.
// Neglect must raise defection risk and bleed trust; the funded twin must end
// more cohesive; and neglect must actually lose members.
// ---------------------------------------------------------------------------
test('invariant 2: unfunded coalitions decay', () => {
  let defectionsAcrossSeeds = 0;
  for (const seed of ['s1', 's2', 's3', 's4', 's5']) {
    const neglect = start(seed, 'bipolar');
    const trustStart = neglect.trust;
    let riskAfterRecruit = null;
    while (!neglect.ended) {
      if (neglect.turn === 1) {
        applyAction(neglect, { type: 'm2', code: 'ID' });
        applyAction(neglect, { type: 'm2', code: 'CA' });
        riskAfterRecruit = avgRisk(neglect);
      }
      declineOffer(neglect);
      endTurn(neglect);
    }
    defectionsAcrossSeeds += neglect.lostMembers.length;
    const survivors = neglect.coalition;
    if (survivors.length > 0) {
      assert.ok(
        avgRisk(neglect) > riskAfterRecruit,
        `${seed}: surviving members' defection risk must drift up when the facility is never funded`
      );
    }
    assert.ok(neglect.trust < trustStart, `${seed}: neglected coalition trust must decay`);

    const funded = run(start(seed, 'bipolar'), policyRecruitFund);
    const neglected = neglect.ended;
    const fundedC2 = lastSnapshot(seed, policyRecruitFund).c2;
    const neglectC2 = finalC2(neglect);
    assert.ok(
      fundedC2 > neglectC2,
      `${seed}: funded twin C2 ${fundedC2} must exceed neglected C2 ${neglectC2} (${funded.id} vs ${neglected.id})`
    );
  }
  assert.ok(
    defectionsAcrossSeeds >= 1,
    `neglect must cost members: expected at least one defection across five seeds, saw ${defectionsAcrossSeeds}`
  );
});

function avgRisk(g) {
  return g.coalition.reduce((a, m) => a + m.defRisk, 0) / Math.max(1, g.coalition.length);
}

function finalC2(g) {
  return g.history[g.history.length - 1].c2;
}

function lastSnapshot(seed, policy) {
  const g = start(seed, 'bipolar');
  run(g, policy);
  return g.history[g.history.length - 1];
}

// ---------------------------------------------------------------------------
// Invariant 3 — a C6 breach is never a winning line.
// Even a run holding winning-level leverage must, on breaching integrity,
// score strictly below the floor of "on the menu".
// ---------------------------------------------------------------------------
test('invariant 3: C6 breach is never a winning line', () => {
  const { params } = loadData();
  assert.ok(
    params.endings.integritySpiral.score < params.endings.menu.base,
    'params: integrity-spiral score must sit below the menu floor'
  );

  const g = start('breach', 'bipolar');
  // A strong position by construction: full conversion, healthy pool…
  for (const axis of g.player.convertAxes) g.player.converted[axis] = 1;
  applyAction(g, { type: 'm2', code: 'ID' });
  // …and a breached integrity criterion.
  g.crit.c6 = 5;
  declineOffer(g);
  const ending = endTurn(g);
  assert.equal(ending.id, 'integrity-spiral');

  const menu = run(start('breach', 'bipolar'), () => {});
  assert.equal(menu.id, 'menu');
  assert.ok(
    ending.score < menu.score,
    `breach with winning-level leverage (${ending.score}) must score below doing nothing at all (${menu.score})`
  );
});

// ---------------------------------------------------------------------------
// Invariant 4 — defecting after conversion always yields better junior-partner
// terms than defecting before it.
// ---------------------------------------------------------------------------
test('invariant 4: convert-then-sign beats sign-first junior terms', () => {
  for (const scenario of SCENARIOS) {
    for (const seed of SEEDS) {
      // A: accept the first pole offer with nothing converted.
      const a = start(seed, scenario);
      while (!a.ended) {
        if (offersOpen(a)) {
          applyAction(a, { type: 'accept' });
          endTurn(a);
          break;
        }
        endTurn(a);
      }
      assert.equal(a.ended.id, 'junior-partner', `${scenario}/${seed}: A should sign`);

      // B: convert hard, decline everything until turn 6, then sign.
      const b = start(seed, scenario);
      while (!b.ended) {
        if (b.turn >= 6 && offersOpen(b)) {
          applyAction(b, { type: 'accept' });
          endTurn(b);
          break;
        }
        while (b.ap > 0 && legalActions(b).some((x) => x.type === 'm1' && x.enabled)) {
          applyAction(b, { type: 'm1' });
        }
        declineOffer(b);
        endTurn(b);
      }
      if (b.ended.id !== 'junior-partner') continue; // no late offer surfaced this run — nothing to compare
      assert.ok(
        b.ended.terms > a.ended.terms,
        `${scenario}/${seed}: converted terms ${b.ended.terms} must beat unconverted terms ${a.ended.terms}`
      );
      assert.ok(
        b.ended.score > a.ended.score,
        `${scenario}/${seed}: converted junior score ${b.ended.score} must beat unconverted ${a.ended.score}`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Invariant 5 — letting the poles dominate hurts.
// Passivity gets you the cutoff, hard; a strong alliance delays or softens it;
// and the poles' dominance shrinks the terms they will ever offer you.
// ---------------------------------------------------------------------------
test('invariant 5: unchecked concentration ends in a hard cutoff; alliances soften it', () => {
  for (const seed of SEEDS) {
    // Passive run: the grip tightens unopposed and the cutoff lands hard.
    const passive = start(seed, 'bipolar');
    while (!passive.ended) {
      declineOffer(passive);
      endTurn(passive);
    }
    assert.ok(passive.cutoff, `${seed}: doing nothing must trigger the cutoff by 2033`);
    assert.ok(passive.cutoff.severity > 0.45, `${seed}: an unprotected cutoff must be severe (got ${passive.cutoff.severity.toFixed(2)})`);
    const pEco = passive.history;
    assert.ok(
      pEco[pEco.length - 1].economy <= pEco[0].economy - 20,
      `${seed}: the bystander economy must fall hard from its baseline (${pEco[0].economy} → ${pEco[pEco.length - 1].economy})`
    );

    // Strong-alliance run, same world: later/softer cutoff or none at all.
    const active = start(seed, 'bipolar');
    run(active, policyConvert);
    if (active.cutoff) {
      assert.ok(
        active.cutoff.severity < passive.cutoff.severity,
        `${seed}: an alliance must soften the cutoff (${active.cutoff.severity.toFixed(2)} vs ${passive.cutoff.severity.toFixed(2)})`
      );
      assert.ok(active.cutoff.turn >= passive.cutoff.turn, `${seed}: an alliance must not hasten the cutoff`);
    }
    assert.ok(
      active.history[active.history.length - 1].economy >= pEco[pEco.length - 1].economy + 10,
      `${seed}: the alliance-builder must end clearly better off than the bystander (${active.history[active.history.length - 1].economy} vs ${pEco[pEco.length - 1].economy})`
    );
  }

  // Dominance shrinks the deal you can ever sign: same state, tighter grip, worse terms.
  const g = start('grip-terms', 'bipolar');
  const looser = computeTerms(g);
  g.concentration = 95;
  const tighter = computeTerms(g);
  assert.ok(tighter < looser, `terms must shrink as the poles dominate (${looser} → ${tighter})`);

  // Solo deals feed the machine that eats you.
  const s = start('grip-solo', 'bipolar');
  const before = s.concentration;
  applyAction(s, { type: 'm5' });
  assert.ok(s.concentration > before, 'cutting a solo deal must tighten the grip');
});

// ---------------------------------------------------------------------------
// Supporting invariant — terms are monotone in conversion at any fixed moment.
// ---------------------------------------------------------------------------
test('invariant 4b: at a fixed state, more conversion means better terms', () => {
  const { params } = loadData();
  const g = start('terms', 'bipolar');
  const before = computeTerms(g);
  for (const axis of g.player.convertAxes) g.player.converted[axis] = 1;
  g.crit.c4 = 70;
  const after = computeTerms(g);
  assert.ok(after > before, `terms must rise with conversion (${before} → ${after})`);
});
