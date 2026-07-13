// Endings: a spectrum, not win/lose. Scored so the invariants hold by construction:
// crisis endings score strictly below any menu score; junior-partner terms scale with
// what was converted before signing.

import {
  c1, c2, pooledLeverage, chokepointThreshold, convertedPoints,
  frontierAccess, peopleScore, economyScore, natureScore
} from './criteria.js';
import { chainCovered, chainTarget } from './chain.js';

/** The seat's conditions, in one place: weight past the threshold, a chain the
    poles can't route around, cohesion, integrity — and actually being inside. */
export function seatGatesMet(state) {
  const s = state.params.endings.seat;
  const outside = state.club != null && !state.club.joined;
  return (
    !outside &&
    pooledLeverage(state) >= chokepointThreshold(state) &&
    chainCovered(state) >= chainTarget(state) &&
    state.coalition.length >= s.minMembers &&
    c2(state) >= s.minC2 &&
    state.crit.c6 >= s.minC6
  );
}

/** Junior-partner terms at signing time: convert first, sign second, get more.
    The more dominant the poles already are, the less they need you — terms shrink. */
export function computeTerms(state) {
  const j = state.params.endings.junior;
  const raw = j.termsC1 * c1(state) + j.termsC4 * state.crit.c4 + j.termsC2 * c2(state);
  const gripFactor = 1 - (state.concentration / 100) * state.params.concentration.juniorTermsPenalty;
  return Math.min(j.termsCap, Math.round(raw * gripFactor));
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
  const outside = state.club != null && !state.club.joined;
  const s = e.seat;
  if (seatGatesMet(state)) {
    return finish(state, {
      id: 'seat',
      title: 'A seat at the table',
      score: Math.round(s.base + state.crit.c7 * s.c7Weight + state.crit.c6 * s.c6Weight)
    });
  }
  const b = e.broker;
  if (!outside && pooled >= threshold * b.minRatio && state.coalition.length >= b.minMembers && c2(state) >= b.minC2) {
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

/** Explain what happened, in plain language a first-time player can follow. */
export function debriefLines(state, ending) {
  const lines = [];
  const lost = state.lostMembers;
  const neverFunded = state.facility.totalFunded === 0;

  if (lost.length >= 2 && neverFunded) {
    const names = lost.map((l) => l.name).join(', ');
    lines.push(
      `Here is what beat you: as your alliance grew, the superpowers' offers to your allies got sweeter. You never put money in the alliance fund, so nothing held them. ${names} walked. (The research behind this game calls that the accommodation trap.)`
    );
  } else if (lost.length >= 1) {
    const names = lost.map((l) => l.name).join(', ');
    lines.push(`You lost ${names} to superpower deals. Every ally that leaves makes the next one cheaper to buy.`);
  }

  switch (ending.id) {
    case 'seat':
      lines.push(`Your alliance became too expensive to ignore: ${chainCovered(state)} of 8 links of the value chain covered, and going around it now costs the superpowers more than negotiating with it. That is what a seat at the table is made of.`);
      if (state.flags.wentToTable) lines.push(`You didn't wait for 2033 to find out — you went to the table in ${state.params.game.startYear + state.flags.wentToTable - 1} and claimed it. Knowing when your leverage peaks is a skill in itself.`);
      if (state.facility.totalFunded >= 4) lines.push(`You financed the alliance fund ${state.facility.totalFunded} of ${state.params.game.turns} years. Boring, unglamorous, and the single biggest reason your allies stayed.`);
      break;
    case 'broker': {
      lines.push('You built something real, but not decisive. You end 2033 with options and with risks: one good superpower offer to the wrong ally and the whole position wobbles.');
      break;
    }
    case 'junior-partner': {
      const cap = state.params.endings.junior.termsCap;
      if (convertedPoints(state) < 2) {
        lines.push(`You signed having built almost nothing first, so you had almost nothing to bargain with. Terms: ${ending.terms}/${cap}. Next run, try building bargaining power before you sign — the deal gets much better.`);
      } else {
        lines.push(`You built first and signed second, and the terms show it: ${ending.terms}/${cap}. Taking a superpower's deal is not losing. Taking it empty-handed is.`);
      }
      break;
    }
    case 'menu':
      if (convertedPoints(state) < 1.5) lines.push('Your country had real assets, but you never set terms on any of them. Assets you never bargain with might as well belong to someone else.');
      else lines.push('You built real bargaining power at home, but never pooled enough of it with allies. Alone, no middle power crosses the line.');
      break;
    case 'integrity-spiral':
      lines.push('Public trust collapsed: broken promises to communities, courts, and voters caught up with you. In this game, power built by breaking trust never counts. It is the one rule with no exceptions.');
      break;
    case 'retaliation-spiral':
      lines.push('You made yourself a target faster than you made yourself necessary. Courtroom wins feel strong, but the heat they draw compounds harder than the power they build.');
      break;
  }

  if (state.m5Uses >= 3) {
    lines.push(`You cut ${state.m5Uses} solo deals. Each one felt good that year. None of them added up to anything.`);
  }

  // The latecomer's story: the door you did or didn't get through.
  if (state.club) {
    if (state.club.joined) {
      const year = state.params.game.startYear + state.club.joinedTurn - 1;
      lines.push(`You started outside the alliance and earned your way in, in ${year}. The entry fee was converted leverage — proof you brought something to the pool. That is the whole game in one move.`);
    } else if (pooledLeverage(state) >= chokepointThreshold(state) * 0.6) {
      lines.push('An alliance did well this decade — without you. You watched other countries pool their way toward the table while your own assets sat unconverted. Their seat is not your seat.');
    } else {
      lines.push('You never got inside the alliance, and it never got strong enough to matter. Two failures for the price of one.');
    }
  }

  // Stealth assessment, surfaced: read the player's actual pattern back to them.
  {
    const funded = state.facility.totalFunded;
    const turns = state.params.game.turns;
    const convertible = state.player.convertAxes.reduce(
      (a, axis) => a + state.data.byCode[state.player.code].axes[axis] * 1, 0);
    const pct = convertible > 0 ? Math.round((convertedPoints(state) / convertible) * 100) : 0;
    const assertive = state.choiceCount.a;
    const answered = state.choiceCount.a + state.choiceCount.b;
    lines.push(`Your pattern: financed the fund ${funded} of ${turns} years, set terms on ${pct}% of your assets, and met ${assertive} of ${answered} world events head-on.`);
    if (funded >= 6 && pct >= 70) {
      lines.push('That is the textbook play from the research: convert what you hold, and pay — every year — to keep the alliance real.');
    } else if (funded >= 5 && pct < 40) {
      lines.push('You held the alliance together but left your own assets on the table. The fund keeps allies in; only terms make you worth allying with.');
    } else if (funded <= 1 && pct >= 60) {
      lines.push('You converted hard and organised nothing. National leverage without an alliance is a nicer chair on the menu.');
    }
  }

  // The cutoff: the fable at the centre of the game.
  if (state.cutoff) {
    const sev = state.cutoff.severity;
    if (sev > 0.45) {
      lines.push(`The cutoff came in ${state.cutoff.year}, and it found you unprepared. The longer the superpowers concentrate power unchallenged, the harder that door slams — and nothing on your side of it could soften the blow.`);
    } else {
      lines.push(`The cutoff came in ${state.cutoff.year} — and mostly missed you. Pooled computing, shared models, terms set in advance: that is what "too valuable to cut off" looks like.`);
    }
  } else if (state.concentration >= 70) {
    lines.push('The cutoff never came — this time. But the superpowers ended 2033 with a tighter grip than they started, and the door was closing as the credits rolled.');
  } else if (state.concentration < 55) {
    lines.push('And the quiet win: your alliance kept AI power spread out enough that no one could ever slam the door. The cutoff never came because you made it too expensive.');
  }

  // What it all meant for the people who live there.
  const access = frontierAccess(state);
  lines.push(`Access to frontier AI in 2033: ${access.label}.`);
  const people = peopleScore(state);
  const economy = economyScore(state);
  const nature = natureScore(state);
  if (nature < 35) {
    lines.push(`And at home: people ${people}, economy ${economy}, nature ${nature} — the AI build-out chewed through water, land and grids, and nobody made it pay its way.`);
  } else {
    lines.push(`And at home: people ${people}, economy ${economy}, nature ${nature}.`);
  }
  return lines;
}
