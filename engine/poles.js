// Pole phase: the US and China as scripted priority tables (no ML).
// Doctrine is bilateral capture — the accommodation trap as an opponent:
// the more effective the coalition, the harder each pole pulls at its seams.

import { log } from './state.js';
import { pooledLeverage } from './criteria.js';

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
    if (
      p.courtTurns[pole].includes(state.turn) &&
      !state.offers.player &&
      !state.flags.acceptedPole
    ) {
      state.offers.player = { pole, turn: state.turn, source: 'courtship' };
      log(state, 'poles', PLAYER_OFFER_COPY[pole]);
    }
  }
}
