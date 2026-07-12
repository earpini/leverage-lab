// Derived criteria and the pooled-leverage / chokepoint arithmetic.
// C1 and C2 are computed from state; C3–C7 are stocks on state.crit.

import { clamp, round1, axesSum, countryByCode } from './state.js';

/** Player's converted stock in axis points. */
export function convertedPoints(state) {
  const player = countryByCode(state, state.player.code);
  let pts = 0;
  for (const axis of state.params.conversion.axes) {
    pts += player.axes[axis] * state.player.converted[axis];
  }
  return pts;
}

/** Maximum convertible axis points for the player. */
export function convertiblePoints(state) {
  const player = countryByCode(state, state.player.code);
  return state.params.conversion.axes.reduce((a, axis) => a + player.axes[axis], 0);
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

/** Pooled coalition leverage in axis points (player conversion + members + spikes). */
export function pooledLeverage(state) {
  let pool = convertedPoints(state) + state.tempSpike;
  for (const m of state.coalition) pool += memberContribution(state, m);
  return round1(pool);
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
    trust: Math.round(state.trust)
  };
}
