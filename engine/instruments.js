// The six generalised instruments (M1–M6) and the player-offer responses.
// Each apply function mutates state and logs; legality lives in legalActions.

import { clamp, log, countryByCode } from './state.js';
import { c1, c2, pooledLeverage } from './criteria.js';
import { computeTerms } from './endings.js';

export const INSTRUMENT_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];

function regimeDistance(state, country) {
  const map = state.params.regimeDistance;
  const player = countryByCode(state, state.player.code);
  return Math.abs(map[country.democracy] - map[player.democracy]);
}

/** AP cost to recruit a given candidate this turn. */
export function recruitCost(state, code) {
  const m2 = state.params.instruments.m2;
  const country = countryByCode(state, code);
  const positional = state.params.pool.positionalCountries.includes(code);
  let cost = m2.apBase;
  if (
    m2.surchargeTiers.includes(country.tier) ||
    regimeDistance(state, country) >= m2.surchargeRegimeDistance ||
    positional
  ) {
    cost += m2.apSurcharge;
  }
  cost = Math.min(m2.apCap, cost);
  cost = Math.max(1, cost - state.turnMods.recruitDiscount);
  return cost;
}

export function recruitCandidates(state) {
  return state.data.countries.countries
    .filter(
      (c) =>
        c.tier !== 'X' &&
        c.code !== state.player.code &&
        !state.coalition.some((m) => m.code === c.code)
    )
    .map((c) => ({ code: c.code, name: c.name, tier: c.tier, cost: recruitCost(state, c.code) }));
}

function initialDefRisk(state, country) {
  const m2 = state.params.instruments.m2;
  const maxAff = Math.max(country.affinity.us, country.affinity.cn);
  const positional = state.params.pool.positionalCountries.includes(country.code);
  let risk = m2.defRiskBase + maxAff * m2.defRiskPerAffinity;
  if (country.tier === 'A') risk -= m2.defRiskAnchorRelief;
  if (positional) risk += m2.defRiskPositionalPenalty;
  return risk;
}

/** M1 Condition: attach terms to inbound capital; converts a share of the remaining stock. */
function applyM1(state) {
  const m1 = state.params.instruments.m1;
  const share = m1.convertShare + state.turnMods.m1Boost;
  for (const axis of state.params.conversion.axes) {
    const remaining = 1 - state.player.converted[axis];
    state.player.converted[axis] = Math.min(1, state.player.converted[axis] + remaining * share);
  }
  state.crit.c4 = clamp(state.crit.c4 + m1.c4);
  state.crit.c3 = clamp(state.crit.c3 + m1.c3);
  log(state, 'player', 'Condition (M1): terms attached to inbound capital — conversion deepens, autonomy up, retaliation exposure up a notch.');
}

/** M2 Recruit: bring a country into the coalition. */
function applyM2(state, code) {
  const country = countryByCode(state, code);
  state.coalition.push({ code, joinedTurn: state.turn, defRisk: initialDefRisk(state, country) });
  state.trust = clamp(state.trust + state.params.trust.recruitGain);
  log(state, 'player', `Recruit (M2): ${country.name} joins the coalition.`);
}

/** M3 Fund the facility: the anti-defection instrument. */
function applyM3(state) {
  state.facility.fundedThisTurn = true;
  state.facility.everFunded = true;
  state.facility.totalFunded += 1;
  state.trust = clamp(state.trust + state.params.trust.fundedGain);
  state.crit.c5 = clamp(state.crit.c5 + state.params.instruments.m3.c5Gain);
  log(state, 'player', 'Fund the facility (M3): the pooled facility is funded this year — defection risk eases across the coalition.');
}

/** M4 Wield rules: regulatory/judicial strike — big one-turn leverage, big retaliation draw. */
function applyM4(state) {
  const m4 = state.params.instruments.m4;
  state.tempSpike += m4.spikePoints;
  state.crit.c3 = clamp(state.crit.c3 + m4.c3);
  log(state, 'player', 'Wield rules (M4): a regulatory strike lands on a hyperscaler — leverage spikes for a season, retaliation exposure jumps.');
}

/** M5 Go it alone: always available, visibly seductive, mathematically dominated. */
function applyM5(state) {
  const m5 = state.params.instruments.m5;
  const gain = m5.c1Flat * Math.pow(m5.diminish, state.m5Uses);
  state.c1Flat += gain;
  state.m5Uses += 1;
  state.crit.c3 = clamp(state.crit.c3 - m5.c3Relief);
  state.crit.c5 = clamp(state.crit.c5 - m5.c5Cost);
  state.trust = clamp(state.trust - m5.trustCost);
  log(state, 'player', 'Go it alone (M5): a bilateral deal, signed solo. It feels good today; nothing was converted and your partners noticed.');
}

/** M6 Pool the commons: raises C7, lowers defection risk structurally. */
function applyM6(state) {
  const m6 = state.params.instruments.m6;
  const gain = m6.c7Gain * Math.pow(m6.diminish, state.m6Uses);
  state.crit.c7 = clamp(state.crit.c7 + gain);
  state.crit.c4 = clamp(state.crit.c4 + m6.c4Gain);
  state.crit.c6 = clamp(state.crit.c6 + m6.c6Gain);
  state.m6Uses += 1;
  for (const m of state.coalition) m.defRisk -= m6.structuralRelief;
  log(state, 'player', 'Pool the commons (M6): members pool compute, data and models — peer capacity rises, and staying starts to pay.');
}

function apCost(state, action) {
  const ins = state.params.instruments;
  switch (action.type) {
    case 'm1': return ins.m1.ap;
    case 'm2': return recruitCost(state, action.code);
    case 'm3': return state.facility.everFunded ? ins.m3.ap : ins.m3.apFirst;
    case 'm4': return ins.m4.ap;
    case 'm5': return ins.m5.ap;
    case 'm6': return ins.m6.ap;
    default: return 0;
  }
}

/** Legal actions with costs and disable reasons — the UI renders this directly. */
export function legalActions(state) {
  if (state.ended) return [];
  const remaining = state.params.conversion.axes
    .map((a) => 1 - state.player.converted[a])
    .reduce((x, y) => x + y, 0);
  const list = [
    {
      type: 'm1',
      ap: apCost(state, { type: 'm1' }),
      enabled: state.ap >= apCost(state, { type: 'm1' }) && remaining > 0.02,
      reason: remaining <= 0.02 ? 'Everything convertible is converted' : null
    },
    {
      type: 'm2',
      ap: null,
      candidates: recruitCandidates(state),
      enabled: state.ap >= 1 && recruitCandidates(state).some((c) => c.cost <= state.ap)
    },
    { type: 'm3', ap: apCost(state, { type: 'm3' }), enabled: state.ap >= apCost(state, { type: 'm3' }) },
    { type: 'm4', ap: apCost(state, { type: 'm4' }), enabled: state.ap >= apCost(state, { type: 'm4' }) },
    { type: 'm5', ap: apCost(state, { type: 'm5' }), enabled: state.ap >= apCost(state, { type: 'm5' }) },
    {
      type: 'm6',
      ap: apCost(state, { type: 'm6' }),
      enabled: state.ap >= apCost(state, { type: 'm6' }) && state.coalition.length >= 1,
      reason: state.coalition.length < 1 ? 'Needs at least one coalition member' : null
    }
  ];
  if (offersOpen(state)) {
    list.push({ type: 'accept', ap: 0, enabled: true });
    list.push({ type: 'decline', ap: 0, enabled: true });
  }
  return list;
}

export function offersOpen(state) {
  return !state.ended && state.offers.player != null;
}

/** Apply a player action. Throws on illegal moves so tests catch bad bots. */
export function applyAction(state, action) {
  if (state.ended) throw new Error('Game over');
  if (action.type === 'accept' || action.type === 'decline') {
    return respondToOffer(state, action.type);
  }
  const cost = apCost(state, action);
  if (state.ap < cost) throw new Error(`Not enough AP for ${action.type} (needs ${cost}, has ${state.ap})`);
  switch (action.type) {
    case 'm1': applyM1(state); break;
    case 'm2': {
      if (!action.code) throw new Error('m2 needs a country code');
      if (state.coalition.some((m) => m.code === action.code)) throw new Error('Already a member');
      const country = countryByCode(state, action.code);
      if (!country || country.tier === 'X') throw new Error('Not recruitable');
      applyM2(state, action.code);
      break;
    }
    case 'm3':
      if (state.facility.fundedThisTurn) throw new Error('Facility already funded this turn');
      applyM3(state);
      break;
    case 'm4': applyM4(state); break;
    case 'm5': applyM5(state); break;
    case 'm6':
      if (state.coalition.length < 1) throw new Error('m6 needs a coalition');
      applyM6(state);
      break;
    default: throw new Error(`Unknown action: ${action.type}`);
  }
  state.ap -= cost;
  return state;
}

function respondToOffer(state, kind) {
  const offer = state.offers.player;
  if (!offer) throw new Error('No offer on the table');
  if (kind === 'accept') {
    const terms = computeTerms(state);
    state.flags.acceptedPole = { pole: offer.pole, turn: state.turn, terms };
    state.offers.player = null;
    const poleName = offer.pole === 'us' ? 'Washington' : 'Beijing';
    log(state, 'player', `You accept ${poleName}'s offer. The terms reflect what you converted before signing: ${terms}/${state.params.endings.junior.termsCap}.`);
  } else {
    state.offers.player = null;
    state.crit.c3 = clamp(state.crit.c3 + state.params.poles.declineC3Cost);
    log(state, 'player', 'You decline the offer. Saying no to a pole is never free — retaliation exposure ticks up.');
  }
  return state;
}
