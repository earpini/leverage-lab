// Orchestrator: turn structure per CONCEPT.md — world phase → pole phase →
// player phase (actions via applyAction) → resolution (endTurn).

import { createState, clamp, log } from './state.js';
import { drawEvent } from './events.js';
import { polePhase } from './poles.js';
import { snapshot } from './criteria.js';
import { checkCrisis, evaluateEnding } from './endings.js';

export { legalActions, applyAction, recruitCandidates, recruitCost, offersOpen } from './instruments.js';
export { snapshot, pooledLeverage, chokepointThreshold, convertedPoints, c1, c2 } from './criteria.js';
export { computeTerms, evaluateEnding } from './endings.js';

export function yearOf(state) {
  return state.params.game.startYear + state.turn - 1;
}

/** Start a new game: init state, then run turn 1's world and pole phases. */
export function newGame({ params, countries, scenarios, events, seed = 'davos', scenarioId = 'bipolar', playerCode }) {
  const state = createState({
    params,
    countries,
    scenarios,
    events,
    seed,
    scenarioId,
    playerCode: playerCode ?? params.game.playerCode
  });
  log(state, 'world', `Run started — scenario: ${state.scenario.name}, seed: ${state.seed}. Eight turns, ${yearOf(state)}–${params.game.startYear + params.game.turns - 1}.`);
  drawEvent(state);
  polePhase(state);
  return state;
}

/**
 * End the player phase: resolution, then either final scoring or the next
 * turn's world and pole phases. Accepting a pole offer also ends the run here.
 */
export function endTurn(state) {
  if (state.ended) throw new Error('Game over');
  const p = state.params;

  // Accepted a pole this turn → the run ends on their terms.
  if (state.flags.acceptedPole) {
    state.history.push(snapshot(state));
    return evaluateEnding(state);
  }

  // 0. An unanswered offer lapses as a polite decline.
  if (state.offers.player) {
    state.offers.player = null;
    state.crit.c3 = clamp(state.crit.c3 + p.poles.autoDeclineC3Cost);
    log(state, 'resolution', 'The offer lapses unanswered. Poles read silence as refusal; exposure ticks up.');
  }

  // 1. Facility: relief when funded, decay when not (the trap's fuel).
  const m3 = p.instruments.m3;
  if (state.facility.fundedThisTurn) {
    state.facility.streak += 1;
    const relief = m3.reliefBase + m3.reliefPerStreak * state.facility.streak;
    for (const m of state.coalition) m.defRisk -= relief;
  } else if (state.coalition.length > 0) {
    state.facility.streak = 0;
    state.trust = clamp(state.trust - p.trust.unfundedDecay * state.scenario.trustDecayMod);
    for (const m of state.coalition) m.defRisk += m3.unfundedDefRiskDrift;
  }

  // 2. Regime friction: Tier-D members corrode integrity and coherence.
  const tierDCount = state.coalition.filter((m) => state.data.byCode[m.code].tier === 'D').length;
  if (tierDCount > 0) {
    state.crit.c6 = clamp(state.crit.c6 - p.criteria.tierDC6CostPerTurn * tierDCount);
    state.crit.c5 = clamp(state.crit.c5 - p.criteria.tierDC5CostPerTurn * tierDCount);
  }

  // 3. Incoherence bleeds trust.
  if (state.crit.c5 < p.criteria.c5IncoherenceThreshold) {
    state.trust = clamp(state.trust - p.criteria.c5IncoherenceTrustCost);
  }

  // 4. Decay: exposure fades, dependency creeps back, peers drift, spikes halve.
  state.crit.c3 = clamp(state.crit.c3 - p.criteria.c3DecayPerTurn);
  state.crit.c4 = clamp(state.crit.c4 - p.criteria.c4DecayPerTurn);
  state.crit.c7 = clamp(state.crit.c7 - p.criteria.c7DecayPerTurn);
  state.tempSpike *= p.instruments.m4.spikeDecay;
  if (state.tempSpike < 0.1) state.tempSpike = 0;

  // 5. Defection checks (seeded rolls, join order — deterministic per seed+actions).
  const d = p.defection;
  const survivors = [];
  for (const m of state.coalition) {
    m.defRisk = Math.min(d.defRiskCap, Math.max(d.defRiskFloor, m.defRisk));
    const country = state.data.byCode[m.code];
    const maxAff = Math.max(country.affinity.us, country.affinity.cn);
    const effective =
      m.defRisk +
      maxAff * d.affinityWeight +
      state.dials.rivalry * d.rivalryWeight -
      state.crit.c7 * d.c7Relief -
      (state.facility.fundedThisTurn ? d.fundedRelief : 0);
    const chance = Math.min(d.chanceCap, Math.max(0, (effective - d.rollLine) * d.chancePerPoint));
    if (state.rng() * 100 < chance) {
      const pole = country.affinity.cn > country.affinity.us ? 'cn' : 'us';
      const poleName = pole === 'us' ? 'Washington' : 'Beijing';
      state.lostMembers.push({ code: m.code, name: country.name, turn: state.turn, pole });
      state.trust = clamp(state.trust - p.trust.defectionCost);
      log(state, 'resolution', `${country.name} takes ${poleName}'s deal and leaves the coalition. The offer was addressed to them, but it was aimed at you.`);
    } else {
      survivors.push(m);
    }
  }
  state.coalition = survivors;

  // 6. Housekeeping + history.
  state.facility.fundedThisTurn = false;
  state.turnMods = { m1Boost: 0, recruitDiscount: 0 };
  state.history.push(snapshot(state));

  // 7. Crises end the run immediately.
  const crisis = checkCrisis(state);
  if (crisis) return evaluateEnding(state, crisis);

  // 8. Final turn → score; otherwise advance the world.
  if (state.turn >= p.game.turns) return evaluateEnding(state);

  state.turn += 1;
  state.ap = p.game.apPerTurn;

  // World phase: dials drift on the scenario trajectory, then an event fires.
  for (const dial of ['rivalry', 'pace', 'demand']) {
    state.dials[dial] = Math.min(1, Math.max(0, state.dials[dial] + state.scenario.drift[dial]));
  }
  drawEvent(state);
  polePhase(state);
  return null;
}
