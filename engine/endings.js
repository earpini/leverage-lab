// Endings: a spectrum, not win/lose. Scored so the invariants hold by construction:
// crisis endings score strictly below any menu score; junior-partner terms scale with
// what was converted before signing.

import { c1, c2, pooledLeverage, chokepointThreshold, convertedPoints } from './criteria.js';

/** Junior-partner terms at signing time: convert first, sign second, get more. */
export function computeTerms(state) {
  const j = state.params.endings.junior;
  const raw = j.termsC1 * c1(state) + j.termsC4 * state.crit.c4 + j.termsC2 * c2(state);
  return Math.min(j.termsCap, Math.round(raw));
}

/** Crisis checks run during resolution; either ends the game immediately. */
export function checkCrisis(state) {
  const k = state.params.criteria;
  if (state.crit.c6 < k.c6BreachLine) {
    state.flags.c6Breached = true;
    return 'integrity-spiral';
  }
  if (state.crit.c3 >= k.c3SpiralLine) return 'retaliation-spiral';
  return null;
}

export function evaluateEnding(state, crisis = null) {
  const e = state.params.endings;
  const pooled = pooledLeverage(state);
  const threshold = chokepointThreshold(state);

  if (crisis === 'integrity-spiral' || state.flags.c6Breached) {
    return finish(state, {
      id: 'integrity-spiral',
      title: 'Integrity spiral',
      score: e.integritySpiral.score
    });
  }
  if (crisis === 'retaliation-spiral') {
    return finish(state, {
      id: 'retaliation-spiral',
      title: 'Retaliation spiral',
      score: e.retaliationSpiral.score
    });
  }
  if (state.flags.acceptedPole) {
    const { terms, pole, turn } = state.flags.acceptedPole;
    return finish(state, {
      id: 'junior-partner',
      title: 'Junior partner',
      score: e.junior.base + terms,
      terms,
      pole,
      signedTurn: turn
    });
  }
  const s = e.seat;
  if (
    pooled >= threshold &&
    state.coalition.length >= s.minMembers &&
    c2(state) >= s.minC2 &&
    state.crit.c6 >= s.minC6
  ) {
    return finish(state, {
      id: 'seat',
      title: 'A seat at the table',
      score: Math.round(s.base + state.crit.c7 * s.c7Weight + state.crit.c6 * s.c6Weight)
    });
  }
  const b = e.broker;
  if (pooled >= threshold * b.minRatio && state.coalition.length >= b.minMembers && c2(state) >= b.minC2) {
    return finish(state, {
      id: 'broker',
      title: 'Balancing broker',
      score: Math.round(b.base + Math.min(1, pooled / threshold) * b.ratioWeight)
    });
  }
  return finish(state, {
    id: 'menu',
    title: 'On the menu',
    score: Math.round(e.menu.base + c1(state) * e.menu.c1Weight)
  });
}

function finish(state, ending) {
  state.ended = { ...ending, lines: debriefLines(state, ending) };
  return state.ended;
}

/** Name what happened in the paper's vocabulary. */
export function debriefLines(state, ending) {
  const lines = [];
  const lost = state.lostMembers;
  const neverFunded = state.facility.totalFunded === 0;

  if (lost.length >= 2 && neverFunded) {
    const last = lost[lost.length - 1];
    lines.push(
      `You fell to the accommodation trap on turn ${last.turn}: the coalition grew attractive, the offers got better, and nothing was holding your partners in. The facility was never funded.`
    );
  } else if (lost.length >= 1) {
    const names = lost.map((l) => l.name).join(', ');
    lines.push(`Defections: ${names}. Each one made the next cheaper for the poles.`);
  }

  switch (ending.id) {
    case 'seat':
      lines.push('The poles’ cost of bypassing your pool exceeded the cost of negotiating with it. That is what a seat at the table is made of.');
      if (state.facility.totalFunded >= 4) lines.push(`The facility was funded ${state.facility.totalFunded} of ${state.params.game.turns} years — the quiet instrument that held the coalition together.`);
      break;
    case 'broker': {
      lines.push('Partial pool, hedged position: real gains, fragile ones. One good offer to the wrong member and the arithmetic changes.');
      break;
    }
    case 'junior-partner': {
      const cap = state.params.endings.junior.termsCap;
      if (convertedPoints(state) < 2) {
        lines.push(`Alignment with unconverted assets is just delivery. You signed with terms ${ending.terms}/${cap}.`);
      } else {
        lines.push(`You converted before you signed, and the terms show it: ${ending.terms}/${cap}. Junior partnership is a position, not a failure — the terms are the score.`);
      }
      break;
    }
    case 'menu':
      if (convertedPoints(state) < 1.5) lines.push('Nothing was converted, so nothing was priced. The poles set your terms.');
      else lines.push('You converted, but never pooled past the threshold. Leverage that stays national stays small.');
      break;
    case 'integrity-spiral':
      lines.push('Leverage bought by breaking integrity never scores above being on the menu. C6 is a hard bound, not a dial.');
      break;
    case 'retaliation-spiral':
      lines.push('Rules wielded as a posture, not an instrument. The retaliation you drew outran the leverage you built.');
      break;
  }

  if (state.m5Uses >= 3) {
    lines.push(`You went it alone ${state.m5Uses} times. Solo deals felt good every turn; none of them compounded.`);
  }
  return lines;
}
