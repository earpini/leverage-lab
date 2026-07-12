// Derived criteria and the pooled-leverage / chokepoint arithmetic.
// C1 and C2 are computed from state; C3–C7 are stocks on state.crit.

import { clamp, round1, axesSum, countryByCode } from './state.js';

/** Player's converted stock in axis points. */
export function convertedPoints(state) {
  const player = countryByCode(state, state.player.code);
  let pts = 0;
  for (const axis of state.player.convertAxes) {
    pts += player.axes[axis] * state.player.converted[axis];
  }
  return pts;
}

/** Maximum convertible axis points for the player. */
export function convertiblePoints(state) {
  const player = countryByCode(state, state.player.code);
  return state.player.convertAxes.reduce((a, axis) => a + player.axes[axis], 0);
}

/** A coalition member's contribution to the pool, in axis points. */
export function memberContribution(state, member) {
  const p = state.params.pool;
  const country = countryByCode(state, member.code);
  const positional = p.positionalCountries.includes(member.code);
  const factor = positional
    ? p.positionalFactor
    : p.memberFactor + Math.min(p.m6FactorBonusCap, state.m6Uses * p.m6FactorBonus);
  return axesSum(country) * factor;
}

/** Pooled coalition leverage in axis points (player conversion + members + spikes).
    In the latecomer variant, your own conversion pools only once you're inside. */
export function pooledLeverage(state) {
  const outside = state.club != null && !state.club.joined;
  let pool = outside ? 0 : convertedPoints(state) + state.tempSpike;
  for (const m of state.coalition) pool += memberContribution(state, m);
  return round1(pool);
}

/** How much of the pool's access actually reaches YOUR economy. */
export function accessRatio(state) {
  const ratio = Math.min(1, pooledLeverage(state) / chokepointThreshold(state));
  if (state.club != null && !state.club.joined) return 0;
  return ratio;
}

/** The chokepoint threshold: the poles' cost of bypassing the coalition. */
export function chokepointThreshold(state) {
  const c = state.params.chokepoint;
  const raw =
    state.scenario.chokepointBase +
    state.dials.pace * c.paceWeight +
    state.dials.demand * c.demandWeight;
  return round1(Math.max(c.floor, raw));
}

export function c1(state) {
  const k = state.params.criteria;
  return clamp(
    Math.round(
      k.c1Base + convertedPoints(state) * k.c1PerConvertedPoint + state.tempSpike * k.c1SpikeFactor + state.c1Flat
    )
  );
}

export function c2(state) {
  const k = state.params.criteria;
  const n = state.coalition.length;
  const avgRisk = n === 0 ? 0 : state.coalition.reduce((a, m) => a + m.defRisk, 0) / n;
  return clamp(Math.round(state.trust * k.c2TrustWeight + n * k.c2PerMember - avgRisk * k.c2DefRiskWeight));
}

/* ---------- outcomes: what the strategy means for the people who live there ----------
   Derived from the criteria (no separate stocks except nature, which events and
   conditioning move). PESTLE areas map onto the inputs; these three are the point. */

/** How much of the superpowers' grip actually bites, beyond the free band. */
function gripBite(state) {
  const k = state.params.concentration;
  return Math.max(0, state.concentration - k.gripFreeBand) / 100;
}

/** A country's real-world starting levels — the game moves them from here. */
function baseline(state) {
  return countryByCode(state, state.player.code).baseline ?? state.params.outcomes.fallbackBaseline;
}

/** Outcomes are baseline + what your play changed, anchored so turn 1 ≈ today. */
export function peopleScore(state) {
  const w = state.params.outcomes.people;
  const k = state.params.concentration;
  const a = state.params.criteriaStart;
  const delta =
    (state.crit.c6 - a.c6) * w.c6 +
    (state.crit.c5 - a.c5) * w.c5 +
    (state.crit.c4 - a.c4) * w.c4;
  const grip = gripBite(state) * k.gripPeoplePenalty;
  const cutoff = state.cutoff ? state.cutoff.severity * k.cutoffPeopleHit : 0;
  return clamp(Math.round(baseline(state).people + delta - grip - cutoff));
}

export function economyScore(state) {
  const w = state.params.outcomes.economy;
  const k = state.params.concentration;
  const ratio = accessRatio(state);
  const delta =
    (c1(state) - state.params.criteria.c1Base) * w.c1 +
    ratio * w.ratio +
    (state.crit.c7 - state.params.criteriaStart.c7) * w.c7;
  const grip = gripBite(state) * k.gripEconomyPenalty;
  const cutoff = state.cutoff ? state.cutoff.severity * k.cutoffEconomyHit : 0;
  return clamp(Math.round(baseline(state).economy + delta - grip - cutoff));
}

export function natureScore(state) {
  return clamp(Math.round(state.nature));
}

/** Plain-words answer to "do we get access to frontier AI?" */
export function frontierAccess(state) {
  if (state.flags.acceptedPole) {
    const pole = state.flags.acceptedPole.pole === 'us' ? 'the US' : 'China';
    return { level: 'granted', label: `on ${pole}'s terms` };
  }
  if (state.club != null && !state.club.joined) {
    return state.cutoff
      ? { level: 'cutoff', label: 'cut off, and outside the alliance' }
      : { level: 'outside', label: 'outside the alliance — earn your way in' };
  }
  const ratio = pooledLeverage(state) / chokepointThreshold(state);
  if (state.cutoff) {
    return ratio >= 1
      ? { level: 'secured', label: 'your alliance kept the lights on' }
      : { level: 'cutoff', label: 'cut off — running on what you built' };
  }
  if (ratio >= 1) return { level: 'secured', label: 'secured — if you hold the line' };
  if (ratio >= state.params.outcomes.frontier.partialRatio) return { level: 'partial', label: 'partial — you have real cards' };
  return { level: 'precarious', label: 'precarious — whatever they offer' };
}

/** The balance of power, in the same axis-point units as the goal bar:
    each pole's raw strengths, amplified as their grip tightens. */
export function polePower(state, code) {
  const p = state.params.pool;
  return round1(axesSum(countryByCode(state, code)) *
    (p.polePowerBase + (state.concentration / 100) * p.polePowerConcWeight));
}

/** Full dashboard snapshot for the UI and the debrief history. */
export function snapshot(state) {
  return {
    c1: c1(state),
    c2: c2(state),
    c3: Math.round(state.crit.c3),
    c4: Math.round(state.crit.c4),
    c5: Math.round(state.crit.c5),
    c6: Math.round(state.crit.c6),
    c7: Math.round(state.crit.c7),
    pooled: pooledLeverage(state),
    threshold: chokepointThreshold(state),
    convertedPts: round1(convertedPoints(state)),
    convertiblePts: convertiblePoints(state),
    members: state.coalition.length,
    trust: Math.round(state.trust),
    people: peopleScore(state),
    economy: economyScore(state),
    nature: natureScore(state),
    frontier: frontierAccess(state),
    concentration: Math.round(state.concentration),
    cutoff: state.cutoff,
    powers: {
      us: polePower(state, 'US'),
      cn: polePower(state, 'CN'),
      alliance: pooledLeverage(state),
      me: round1(convertedPoints(state) + state.tempSpike)
    }
  };
}
