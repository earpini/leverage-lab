// The value chain as the board, and wants as the diplomacy.
//
// Chain: eight links from mine to rulebook. A link is covered when someone in
// the coalition genuinely holds it — members at axis ≥ 2, the player only for
// converted strengths (unconverted assets don't count; that is the thesis).
//
// Wants: every middle power's incentive to collaborate is a link it lacks.
// A coalition that already covers what a country needs is cheap to join and
// easy to stay in. Incentives, not fear, are what hold alliances together.

import { countryByCode } from './state.js';

export const CHAIN_ORDER = ['minerals', 'equip', 'fab', 'compute', 'capital', 'models', 'market', 'gov_conv'];

/** The links a country lacks — its reasons to collaborate. */
export function countryWants(params, country) {
  const w = params.wants;
  return w.priority
    .filter((axis) => country.axes[axis] <= w.axisMax)
    .sort((a, b) => country.axes[a] - country.axes[b])
    .slice(0, w.maxWants);
}

/** Is a given want met by the coalition as it stands? */
export function wantMet(state, want) {
  if (want === 'capital') {
    return state.facility.streak >= 1 || state.facility.fundedThisTurn;
  }
  return chainLinks(state).find((l) => l.axis === want)?.covered ?? false;
}

/** Wants of a country with their current met/unmet status. */
export function wantsFor(state, country) {
  return countryWants(state.params, country).map((axis) => ({ axis, met: wantMet(state, axis) }));
}

/** The eight links, who lights each, and whether it is covered. */
export function chainLinks(state) {
  const k = state.params.chain;
  const player = countryByCode(state, state.player.code);
  return CHAIN_ORDER.map((axis) => {
    const by = [];
    const isConvert = state.player.convertAxes.includes(axis);
    if (player.axes[axis] >= k.memberAxisMin && isConvert && (state.player.converted[axis] ?? 0) >= k.playerConvertMin) {
      by.push(state.player.code);
    }
    for (const m of state.coalition) {
      if (state.data.byCode[m.code].axes[axis] >= k.memberAxisMin) by.push(m.code);
    }
    return { axis, covered: by.length > 0, by };
  });
}

export function chainCovered(state) {
  return chainLinks(state).filter((l) => l.covered).length;
}

export function chainTarget(state) {
  return state.scenario.chainTarget;
}
