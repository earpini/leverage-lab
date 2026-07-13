// The six generalised instruments (M1–M6) and the player-offer responses.
// Each apply function mutates state and logs; legality lives in legalActions.

import { clamp, log, countryByCode } from './state.js';
import { c1, c2, pooledLeverage } from './criteria.js';
import { computeTerms } from './endings.js';
import { resolveEvent, applyEffects } from './events.js';

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

/** Latecomer variant: true while an existing alliance has not yet let you in. */
export function isOutside(state) {
  return state.club != null && !state.club.joined;
}

export function initialDefRisk(state, country) {
  const m2 = state.params.instruments.m2;
  const maxAff = Math.max(country.affinity.us, country.affinity.cn);
  const positional = state.params.pool.positionalCountries.includes(country.code);
  let risk = m2.defRiskBase + maxAff * m2.defRiskPerAffinity;
  if (country.tier === 'A') risk -= m2.defRiskAnchorRelief;
  if (positional) risk += m2.defRiskPositionalPenalty;
  return risk;
}

/** M1 Condition: attach terms to inbound capital; converts a share of the remaining stock.
    A mature AI-governance ecosystem (the report's High/Medium/Developing/Nascent rating)
    writes enforceable terms faster: gov 3 converts at 105%, gov 1 at 95%, gov 0 at 90%. */
function applyM1(state) {
  const m1 = state.params.instruments.m1;
  const govFactor = m1.govFactorBase + m1.govFactorPerLevel * state.govLevel;
  const share = (m1.convertShare + state.turnMods.m1Boost) * govFactor;
  for (const axis of state.player.convertAxes) {
    const remaining = 1 - state.player.converted[axis];
    state.player.converted[axis] = Math.min(1, state.player.converted[axis] + remaining * share);
  }
  state.crit.c4 = clamp(state.crit.c4 + m1.c4);
  state.crit.c3 = clamp(state.crit.c3 + m1.c3);
  // Conditions include local-benefit and environmental terms.
  state.nature = clamp(state.nature + state.params.outcomes.m1NatureGain);
  log(state, 'player', 'You set conditions on incoming tech money. Your assets are now worth more at the table (and the superpowers noticed).');
}

/** M2 Recruit: bring a country into the coalition. */
function applyM2(state, code) {
  const country = countryByCode(state, code);
  state.coalition.push({ code, joinedTurn: state.turn, defRisk: initialDefRisk(state, country) });
  state.trust = clamp(state.trust + state.params.trust.recruitGain);
  log(state, 'player', `${country.name} joins your alliance.`);
}

/** M3 Fund the facility: the anti-defection instrument. */
function applyM3(state) {
  state.facility.fundedThisTurn = true;
  state.facility.everFunded = true;
  state.facility.totalFunded += 1;
  state.trust = clamp(state.trust + state.params.trust.fundedGain);
  state.crit.c5 = clamp(state.crit.c5 + state.params.instruments.m3.c5Gain);
  log(state, 'player', 'You put money into the alliance fund this year. Allies have a real reason to stay.');
}

/** M4 Wield rules: regulatory/judicial strike — big one-turn leverage, big retaliation draw. */
function applyM4(state) {
  const m4 = state.params.instruments.m4;
  state.tempSpike += m4.spikePoints;
  state.crit.c3 = clamp(state.crit.c3 + m4.c3);
  log(state, 'player', 'Your courts and regulators hit a tech giant. A big, loud win this year. Expect payback.');
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
  // Every solo deal routes through a pole's stack — their grip tightens.
  state.concentration = Math.min(100, state.concentration + state.params.concentration.soloBoost);
  log(state, 'player', 'You cut a solo deal. A quick win for your country this year. Your allies took note — and the superpowers got a little more indispensable.');
}

/** M6 Pool the commons — in tiers: pool computing → joint lab → shared models. */
const M6_LOGS = [
  'You pooled computing power across the alliance. Allies get more capable, and leaving gets less tempting.',
  'The alliance opens a joint lab — shared data, shared training runs. Its members now build things none of them could alone.',
  'The alliance now shares its own frontier-adjacent models. Staying is not loyalty any more; it is self-interest.'
];

function applyM6(state) {
  const m6 = state.params.instruments.m6;
  const tier = m6.tiers[Math.min(state.m6Uses, m6.tiers.length - 1)];
  state.crit.c7 = clamp(state.crit.c7 + tier.c7);
  state.crit.c4 = clamp(state.crit.c4 + tier.c4);
  state.crit.c6 = clamp(state.crit.c6 + tier.c6);
  state.m6FactorBonus = Math.min(m6.factorBonusCap, state.m6FactorBonus + tier.factorBonus);
  state.m6Uses += 1;
  for (const m of state.coalition) m.defRisk -= tier.structuralRelief;
  log(state, 'player', M6_LOGS[Math.min(state.m6Uses - 1, M6_LOGS.length - 1)]);
}

/** M8 — the signature move: pull the lever only your country holds.
    One use per game; effects come from the dominant-axis archetype. */
function applyM8(state) {
  const sig = state.params.signature;
  applyEffects(state, sig.archetypes[state.player.signatureAxis]);
  state.signatureUsed = true;
  log(state, 'player', 'You pull the lever only your country holds. For one loud season, everyone remembers exactly why you matter.');
}

/** M4 needs an opening: a live case, institutions strong enough to make one,
    or a governance ecosystem mature enough to always have one ready. */
export function m4Open(state) {
  const m4 = state.params.instruments.m4;
  return state.legalOpening > 0 || state.crit.c5 >= m4.gateC5 || state.govLevel >= m4.gateGov;
}

/** M7 Build the field: fund the people and institutions who write and enforce terms.
    Slow and compounding — every Nth investment lifts governance maturity a level. */
const GOV_MILESTONES = [
  'nascent', 'developing', 'solid', 'strong'
];

function applyM7(state) {
  const m7 = state.params.instruments.m7;
  state.fieldbuilding += 1;
  state.crit.c5 = clamp(state.crit.c5 + m7.c5Gain);
  if (state.fieldbuilding % m7.investmentsPerLevel === 0 && state.govLevel < m7.maxGov) {
    state.govLevel += 1;
    state.crit.c6 = clamp(state.crit.c6 + m7.c6GainOnLevel);
    log(state, 'player', `Fieldbuilding pays off: your governance ecosystem is now ${GOV_MILESTONES[state.govLevel]}. Terms convert faster, and your institutions hold a steadier line.`);
  } else {
    log(state, 'player', 'You invest in the field: training, institutes, civil society. Nothing visible this year. That is how ecosystems grow.');
  }
}

function apCost(state, action) {
  const ins = state.params.instruments;
  switch (action.type) {
    case 'm1': return ins.m1.ap;
    case 'm2': return recruitCost(state, action.code);
    case 'm3':
      // A bigger coalition is a bigger bill: sustaining scales with membership.
      return state.facility.everFunded
        ? ins.m3.ap + Math.floor(state.coalition.length / ins.m3.memberCostDivisor)
        : ins.m3.apFirst;
    case 'm4': return ins.m4.ap;
    case 'm5': return ins.m5.ap;
    case 'm6': return ins.m6.ap;
    case 'm7': return ins.m7.ap;
    case 'm8': return state.params.signature.ap;
    default: return 0;
  }
}

/** Legal actions with costs and disable reasons — the UI renders this directly. */
export function legalActions(state) {
  if (state.ended) return [];
  const remaining = state.player.convertAxes
    .map((a) => 1 - state.player.converted[a])
    .reduce((x, y) => x + y, 0);
  const outside = isOutside(state);
  const outsideReason = 'You are not in the alliance yet — earn your way in first';
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
      candidates: outside ? [] : recruitCandidates(state),
      enabled: !outside && state.ap >= 1 && recruitCandidates(state).some((c) => c.cost <= state.ap),
      reason: outside ? outsideReason : null
    },
    {
      type: 'm3',
      ap: apCost(state, { type: 'm3' }),
      enabled: !outside && state.ap >= apCost(state, { type: 'm3' }),
      reason: outside ? outsideReason : null
    },
    {
      type: 'm4',
      ap: apCost(state, { type: 'm4' }),
      enabled: state.ap >= apCost(state, { type: 'm4' }) && m4Open(state),
      reason: !m4Open(state) ? `No opening: courts need a live case, or consistency ${state.params.instruments.m4.gateC5}+` : null,
      opening: state.legalOpening
    },
    { type: 'm5', ap: apCost(state, { type: 'm5' }), enabled: state.ap >= apCost(state, { type: 'm5' }) },
    {
      type: 'm8',
      ap: apCost(state, { type: 'm8' }),
      enabled: !state.signatureUsed && state.ap >= apCost(state, { type: 'm8' }),
      reason: state.signatureUsed ? 'Played — the world only falls for this once' : null,
      axis: state.player.signatureAxis
    },
    {
      type: 'm7',
      ap: apCost(state, { type: 'm7' }),
      enabled: state.ap >= apCost(state, { type: 'm7' }) && state.govLevel < state.params.instruments.m7.maxGov,
      reason: state.govLevel >= state.params.instruments.m7.maxGov ? 'Your governance ecosystem is already at full strength' : null,
      progress: { invested: state.fieldbuilding % state.params.instruments.m7.investmentsPerLevel, perLevel: state.params.instruments.m7.investmentsPerLevel, level: state.govLevel }
    },
    {
      type: 'm6',
      ap: apCost(state, { type: 'm6' }),
      enabled: !outside && state.ap >= apCost(state, { type: 'm6' }) && state.coalition.length >= 1,
      reason: outside ? outsideReason : state.coalition.length < 1 ? 'Needs at least one coalition member' : null
    }
  ];
  if (outside && state.coalition.length > 0) {
    const converted = state.player.convertAxes.reduce(
      (a, axis) => a + countryByCode(state, state.player.code).axes[axis] * state.player.converted[axis], 0);
    const bar = state.club.entryBar;
    list.push({
      type: 'join',
      ap: state.params.latecomer.joinAp,
      enabled: converted >= bar && state.ap >= state.params.latecomer.joinAp,
      progress: { converted: Math.round(converted * 10) / 10, bar },
      reason: converted < bar ? `They want proof: converted leverage ${bar}+ (you have ${Math.round(converted * 10) / 10})` : null
    });
  }
  if (offersOpen(state)) {
    list.push({ type: 'accept', ap: 0, enabled: true });
    list.push({ type: 'decline', ap: 0, enabled: true });
  }
  if (state.pendingEvent) {
    const event = state.data.events.events.find((e) => e.id === state.pendingEvent);
    list.push({ type: 'event', ap: 0, enabled: true, event: event.id, question: event.question, choices: event.choices });
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
  if (action.type === 'join') {
    return joinClub(state);
  }
  if (action.type === 'event') {
    return resolveEvent(state, action.choice);
  }
  const cost = apCost(state, action);
  if (state.ap < cost) throw new Error(`Not enough AP for ${action.type} (needs ${cost}, has ${state.ap})`);
  switch (action.type) {
    case 'm1': applyM1(state); break;
    case 'm2': {
      if (isOutside(state)) throw new Error('Not in the alliance yet');
      if (!action.code) throw new Error('m2 needs a country code');
      if (state.coalition.some((m) => m.code === action.code)) throw new Error('Already a member');
      const country = countryByCode(state, action.code);
      if (!country || country.tier === 'X') throw new Error('Not recruitable');
      applyM2(state, action.code);
      break;
    }
    case 'm3':
      if (isOutside(state)) throw new Error('Not in the alliance yet');
      if (state.facility.fundedThisTurn) throw new Error('Facility already funded this turn');
      applyM3(state);
      break;
    case 'm4':
      if (!m4Open(state)) throw new Error('No legal opening for m4');
      applyM4(state);
      break;
    case 'm5': applyM5(state); break;
    case 'm7':
      if (state.govLevel >= state.params.instruments.m7.maxGov) throw new Error('Governance ecosystem already at full strength');
      applyM7(state);
      break;
    case 'm8':
      if (state.signatureUsed) throw new Error('Signature move already played');
      applyM8(state);
      break;
    case 'm6':
      if (isOutside(state)) throw new Error('Not in the alliance yet');
      if (state.coalition.length < 1) throw new Error('m6 needs a coalition');
      applyM6(state);
      break;
    default: throw new Error(`Unknown action: ${action.type}`);
  }
  state.ap -= cost;
  return state;
}

function joinClub(state) {
  if (!isOutside(state)) throw new Error('No alliance to join');
  if (state.coalition.length === 0) throw new Error('The alliance collapsed before you joined');
  const lc = state.params.latecomer;
  const converted = state.player.convertAxes.reduce(
    (a, axis) => a + countryByCode(state, state.player.code).axes[axis] * state.player.converted[axis], 0);
  if (converted < state.club.entryBar) throw new Error('Not enough converted leverage to join');
  if (state.ap < lc.joinAp) throw new Error('Not enough moves to join');
  state.ap -= lc.joinAp;
  state.club.joined = true;
  state.club.joinedTurn = state.turn;
  state.trust = clamp(state.trust + lc.joinTrustGain);
  log(state, 'player', 'You are in. Your converted leverage was the ticket — now the alliance pools your assets with theirs, and its problems become yours to help hold.');
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
    log(state, 'player', `You sign with ${poleName}. Final terms: ${terms}/${state.params.endings.junior.termsCap} — set by what you built before signing.`);
  } else {
    state.offers.player = null;
    state.crit.c3 = clamp(state.crit.c3 + state.params.poles.declineC3Cost);
    log(state, 'player', 'You say no to a superpower. That is never free: heat goes up a little.');
  }
  return state;
}
