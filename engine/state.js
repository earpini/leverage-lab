// Initial game state. Pure data in, pure data out — no DOM, no globals.

import { makeRng } from './rng.js';

export function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

export function round1(v) {
  return Math.round(v * 10) / 10;
}

/** Sum of a country's eight value-chain axes. */
export function axesSum(country) {
  return Object.values(country.axes).reduce((a, b) => a + b, 0);
}

export function countryByCode(state, code) {
  return state.data.byCode[code];
}

/**
 * Create initial state. `data` bundles the four JSON files so the engine has
 * no I/O of its own (Node tests read from fs; the browser imports JSON modules).
 */
export function createState({ params, countries, scenarios, events, seed, scenarioId, playerCode, variant }) {
  const scenario = scenarios.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  const byCode = Object.fromEntries(countries.countries.map((c) => [c.code, c]));
  const player = byCode[playerCode];
  if (!player) throw new Error(`Unknown player country: ${playerCode}`);
  if (player.tier === 'X') throw new Error('Poles are not playable');

  // A country converts its signature strengths: its top N axes by value.
  const convertAxes = playerConvertAxes(params, player);
  const positional = params.pool.positionalCountries.includes(playerCode);
  const converted = {};
  convertAxes.forEach((axis, i) => {
    // Positional countries sit on a bottleneck already: the top axis counts from day one.
    converted[axis] = positional && i < params.conversion.positionalPreconverted ? 1 : 0;
  });

  return {
    seed: String(seed),
    scenarioId,
    params,
    data: { byCode, countries, events },
    scenario,
    rng: makeRng(String(seed) + ':' + scenarioId),
    turn: 1,
    ap: params.game.apPerTurn,
    dials: { ...scenario.dials },
    player: { code: playerCode, converted, convertAxes, positional },
    crit: {
      ...normaliseStart(params.criteriaStart),
      c3: params.criteriaStart.c3 + (positional ? params.conversion.positionalStartHeat : 0)
    },
    nature: (player.baseline ?? params.outcomes.fallbackBaseline).nature,
    concentration: params.concentration.start,
    cutoff: null,
    club: variant === 'latecomer' ? { joined: false, joinedTurn: null, entryBar: params.latecomer.entryBar } : null,
    c1Flat: 0,
    tempSpike: 0,
    trust: params.trust.start,
    coalition: [],
    facility: { fundedThisTurn: false, streak: 0, totalFunded: 0, everFunded: false },
    m5Uses: 0,
    m6Uses: 0,
    turnMods: { m1Boost: 0, recruitDiscount: 0 },
    offers: { player: null },
    flags: { c6Breached: false, acceptedPole: null },
    lostMembers: [],
    eventDeck: events.events.map((e) => e.id),
    drawnEvents: [],
    currentEvent: null,
    pendingEvent: null,
    lastChoice: null,
    legalOpening: 0,
    m6FactorBonus: 0,
    log: [],
    history: [],
    ended: null
  };
}

function normaliseStart(start) {
  return { c3: start.c3, c4: start.c4, c5: start.c5, c6: start.c6, c7: start.c7 };
}

/** A player's convertible axes: top N by value (ties broken by fixed axis order), zeros excluded. */
export function playerConvertAxes(params, country) {
  return Object.entries(country.axes)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, params.conversion.topAxes)
    .map(([k]) => k);
}

export function log(state, phase, text) {
  state.log.push({ turn: state.turn, phase, text });
}
