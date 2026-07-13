// Pole phase: the US and China as scripted priority tables (no ML).
// Doctrine is bilateral capture — the accommodation trap as an opponent:
// the more effective the coalition, the harder each pole pulls at its seams.

import { log, clamp } from './state.js';
import { pooledLeverage } from './criteria.js';

/** Coercion: once their grip is real, the poles spend it on you directly. */
const STRIKES = {
  us: [
    'Washington leans on its chip leverage: preferential prices on your exports, or the licences slow down. Your independence takes the hit either way.',
    'Washington makes cloud access conditional: your agencies adopt its providers’ standards, or costs double.',
    'Washington ties this year’s tariff relief to data-flow concessions. The paper is already drafted.'
  ],
  cn: [
    'Beijing squeezes the refining bottleneck: your manufacturers get discounts — if your resources ship raw and unprocessed.',
    'Beijing floods your market with cheap, capable models, on the quiet condition that your rules stay quiet about it.',
    'Beijing links next year’s infrastructure credit to procurement of its full AI stack.'
  ]
};

const POLE_NAMES = { us: 'Washington', cn: 'Beijing' };

const MEMBER_OFFER_COPY = {
  us: (name) => `${POLE_NAMES.us} dangles a deal in front of ${name}: better chips and fewer tariffs, if they keep their distance from your alliance.`,
  cn: (name) => `${POLE_NAMES.cn} courts ${name}: cheap financing and technology, if they keep your alliance at arm's length.`
};

const PLAYER_OFFER_COPY = {
  us: 'Washington has a deal for you, personally. It is on your table now.',
  cn: 'Beijing has a deal for you, personally. It is on your table now.'
};

/**
 * Run both poles' moves for the current turn.
 * Rule 1 — target the member with the highest defection risk × affinity and press.
 * Rule 2 — on scripted courtship turns, address an offer to the player directly.
 */
export function polePhase(state) {
  const p = state.params.poles;
  for (const pole of ['us', 'cn']) {
    const targetable = state.coalition.filter(
      (m) => state.data.byCode[m.code].affinity[pole] >= 1
    );
    if (targetable.length > 0) {
      const target = targetable.reduce((best, m) => {
        const score = (mm) => mm.defRisk * (state.data.byCode[mm.code].affinity[pole] + 0.5);
        return score(m) > score(best) ? m : best;
      });
      const pressure =
        p.pressureBase +
        state.dials.rivalry * p.pressureRivalryWeight +
        pooledLeverage(state) * p.pressurePooledWeight;
      target.defRisk += pressure;
      const name = state.data.byCode[target.code].name;
      log(state, 'poles', MEMBER_OFFER_COPY[pole](name));
    }
    const courting = p.courtTurns[pole].includes(state.turn) && !state.offers.player && !state.flags.acceptedPole;
    if (courting) {
      state.offers.player = { pole, turn: state.turn, source: 'courtship' };
      log(state, 'poles', PLAYER_OFFER_COPY[pole]);
    }

    // Coercion: with enough grip, a pole that isn't courting you is squeezing you.
    // One pole per year (they alternate), and it costs you independence —
    // the stronger they get, the less your "no" is worth.
    const co = p.coercion;
    const myParity = pole === 'us' ? 0 : 1;
    if (
      !courting &&
      state.turn >= 2 &&
      state.turn % 2 === myParity &&
      state.concentration >= co.gripLine &&
      !state.flags.acceptedPole
    ) {
      const gripBite = Math.max(0, state.concentration - co.gripLine) / 100;
      state.crit.c4 = clamp(state.crit.c4 - (co.c4Base + gripBite * co.gripScale * 10));
      if (state.concentration >= co.c1FlatLine) state.c1Flat -= co.c1FlatHit;
      const flavour = STRIKES[pole][(state.turn + (pole === 'us' ? 0 : 1)) % STRIKES[pole].length];
      log(state, 'poles', flavour);
    }
  }
}
