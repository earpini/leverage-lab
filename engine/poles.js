// Pole phase: the US and China as scripted priority tables (no ML).
// Doctrine is bilateral capture — the accommodation trap as an opponent:
// the more effective the coalition, the harder each pole pulls at its seams.

import { log } from './state.js';
import { pooledLeverage } from './criteria.js';

const POLE_NAMES = { us: 'Washington', cn: 'Beijing' };

const MEMBER_OFFER_COPY = {
  us: (name) => `${POLE_NAMES.us} offers ${name} preferential compute access and tariff relief — bilateral, generous, and conditional on distance from your coalition.`,
  cn: (name) => `${POLE_NAMES.cn} offers ${name} concessional finance and technology transfer — bilateral, patient, and conditional on distance from your coalition.`
};

const PLAYER_OFFER_COPY = {
  us: 'Washington addresses you directly: compute access, tariff relief, investment. The terms are real. What you signed away is priced at what you converted.',
  cn: 'Beijing addresses you directly: concessional compute, BRICS finance, market access. The terms are real. What you signed away is priced at what you converted.'
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
