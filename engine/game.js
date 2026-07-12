// Orchestrator: turn structure per CONCEPT.md — world phase → pole phase →
// player phase (actions via applyAction) → resolution (endTurn).

import { createState, clamp, log } from './state.js';
import { drawEvent, resolveEvent, DEFAULT_CHOICE } from './events.js';
import { polePhase } from './poles.js';
import { snapshot, pooledLeverage, chokepointThreshold } from './criteria.js';
import { checkCrisis, evaluateEnding } from './endings.js';

export { legalActions, applyAction, recruitCandidates, recruitCost, offersOpen, isOutside } from './instruments.js';
import { initialDefRisk, isOutside } from './instruments.js';
export { snapshot, pooledLeverage, chokepointThreshold, convertedPoints, c1, c2 } from './criteria.js';
export { computeTerms, evaluateEnding } from './endings.js';

export function yearOf(state) {
  return state.params.game.startYear + state.turn - 1;
}

/** Start a new game: init state, then run turn 1's world and pole phases. */
export function newGame({ params, countries, scenarios, events, seed = 'davos', scenarioId = 'bipolar', playerCode, variant = 'founder' }) {
  const state = createState({
    params,
    countries,
    scenarios,
    events,
    seed,
    scenarioId,
    playerCode: playerCode ?? params.game.playerCode,
    variant
  });
  if (state.club) {
    // An alliance already exists — and you are not in it. Founders substitute
    // in from the reserve list if you happen to be one of them.
    const lc = params.latecomer;
    const roster = [...lc.clubMembers, ...lc.clubSubstitutes]
      .filter((code) => code !== state.player.code)
      .slice(0, lc.clubMembers.length);
    for (const code of roster) {
      const country = state.data.byCode[code];
      state.coalition.push({ code, joinedTurn: 0, defRisk: initialDefRisk(state, country) });
    }
    state.facility.everFunded = true; // their facility exists; sustaining it later costs you 1, not 2
    log(state, 'world', `An alliance already exists — ${roster.map((c) => state.data.byCode[c].name).join(', ')} — and you are not in it. They pool without you. The door opens when your converted leverage reaches ${state.club.entryBar} points.`);
  }
  log(state, 'world', `New game — scenario: ${state.scenario.name}, game code: ${state.seed}. Eight years, ${yearOf(state)}–${params.game.startYear + params.game.turns - 1}.`);
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

  // 0a. An undecided event resolves to the passive option — drift is a choice too.
  if (state.pendingEvent) {
    resolveEvent(state, DEFAULT_CHOICE, true);
  }

  // 0. An unanswered offer lapses as a polite decline.
  if (state.offers.player) {
    state.offers.player = null;
    state.crit.c3 = clamp(state.crit.c3 + p.poles.autoDeclineC3Cost);
    log(state, 'resolution', 'You let the superpower’s offer expire. They read silence as a no: heat goes up a little.');
  }

  // 0b. While you are outside, the club funds its own facility every other year
  // — solvent, but not solid. Their coalition still decays on the off years.
  if (isOutside(state) && state.coalition.length > 0 && state.turn % 2 === 1 && !state.facility.fundedThisTurn) {
    state.facility.fundedThisTurn = true;
    log(state, 'resolution', 'The alliance funds its own facility this year — without you.');
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

  // 4b. Nature: the AI build-out presses on land, water and grids every year,
  // harder when demand runs hot — and harder still when the superpowers race
  // unchecked. Degraded nature erodes public trust.
  state.nature = clamp(
    state.nature -
      (p.outcomes.natureDriftBase +
        state.dials.demand * p.outcomes.natureDriftDemand +
        (Math.max(0, state.concentration - p.concentration.gripFreeBand) / 100) *
          p.concentration.gripNaturePressure)
  );
  if (state.nature < p.outcomes.natureTrustLine) {
    state.crit.c6 = clamp(state.crit.c6 - p.outcomes.natureTrustCost);
  }

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
      log(state, 'resolution', `${country.name} takes ${poleName}'s deal and leaves your alliance.`);
    } else {
      survivors.push(m);
    }
  }
  state.coalition = survivors;

  // 5b-pre. If the club empties before you ever joined, there is no club left
  // to join — you are a founder now, whether you wanted to be or not.
  if (isOutside(state) && state.coalition.length === 0) {
    state.club = null;
    log(state, 'resolution', 'The alliance you were courting has collapsed — everyone took a bilateral deal. If there is going to be a pool now, you will have to build it yourself.');
  }

  // 5b. The superpowers' grip on AI tightens — faster when the frontier races
  // ahead and when your side bleeds members; slower when your alliance is real.
  // The accommodation trap's endgame: at the cutoff line, the door closes.
  const k = p.concentration;
  const defectionsThisTurn = state.lostMembers.filter((l) => l.turn === state.turn).length;
  const ratio = Math.min(1, pooledLeverage(state) / chokepointThreshold(state));
  state.concentration = Math.min(100, Math.max(0,
    state.concentration +
      k.growthBase +
      state.dials.pace * k.paceWeight -
      ratio * k.ratioRelief -
      state.crit.c7 * k.c7Relief +
      defectionsThisTurn * k.defectionBoost
  ));
  if (!state.cutoff && state.concentration >= k.cutoffLine) {
    // An alliance you are not in barely shields you.
    const outsideFactor = isOutside(state) ? p.latecomer.outsideProtection : 1;
    const protection = Math.min(1,
      (ratio * k.protectRatioWeight + (state.crit.c7 / 100) * k.protectC7Weight) * outsideFactor);
    const severity = (state.concentration / 100) * (1 - protection);
    state.cutoff = { turn: state.turn, year: p.game.startYear + state.turn - 1, severity };
    state.crit.c7 = clamp(state.crit.c7 - k.cutoffC7Loss);
    state.crit.c6 = clamp(state.crit.c6 - k.cutoffC6Loss);
    log(state, 'resolution',
      severity > 0.45
        ? 'THE CUTOFF. The frontier labs, under government order, stop serving their most powerful models to anyone outside the superpowers’ orbit. No warning, no appeal. Your alliance was too weak to cushion it: overnight, the best technology on earth is something other people have.'
        : 'THE CUTOFF. The frontier labs, under government order, stop serving their most powerful models outside the superpowers’ orbit. But your alliance saw it coming: pooled computing, shared models, terms already set. The shock passes around you, not through you.');
  }

  // 6. Housekeeping + history.
  state.facility.fundedThisTurn = false;
  state.turnMods = { m1Boost: 0, recruitDiscount: 0 };
  state.legalOpening = Math.max(0, state.legalOpening - 1);
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
