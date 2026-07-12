// World-phase events: weighted draw without replacement, effects DSL applied to state.
// The DSL keys are documented in docs/model-notes.md.

import { clamp, log } from './state.js';
import { pickWeighted } from './rng.js';

export function drawEvent(state) {
  const remaining = state.data.events.events.filter((e) => state.eventDeck.includes(e.id));
  const event = pickWeighted(state.rng, remaining, (e) => e.weights[state.scenarioId] ?? 1);
  if (!event) return null;
  state.eventDeck = state.eventDeck.filter((id) => id !== event.id);
  state.drawnEvents.push(event.id);
  state.currentEvent = event.id;
  applyEvent(state, event);
  log(state, 'world', `Event — ${event.name}: ${event.copy}`);
  return event;
}

function applyEvent(state, event) {
  let effects = { ...event.effects };

  // Conditional overlays (each replaces the base keys it names).
  if (event.ifFacilityFunded && state.facility.streak > 0) {
    effects = { ...effects, ...event.ifFacilityFunded };
  }
  if (event.effects.ifTierD || event.ifTierD) {
    const block = event.ifTierD ?? event.effects.ifTierD;
    const hasTierD = state.coalition.some((m) => state.data.byCode[m.code].tier === 'D');
    if (hasTierD) effects = { ...effects, ...block };
    delete effects.ifTierD;
  }
  if (effects.ifConvertedMinerals) {
    if ((state.player.converted.minerals ?? 0) >= 0.5) {
      effects = { ...effects, ...effects.ifConvertedMinerals };
    }
    delete effects.ifConvertedMinerals;
  }

  applyEffects(state, effects);
}

export function applyEffects(state, effects) {
  for (const [key, value] of Object.entries(effects)) {
    switch (key) {
      case 'c3': case 'c4': case 'c5': case 'c6': case 'c7':
        state.crit[key] = clamp(state.crit[key] + value);
        break;
      case 'c1Flat':
        state.c1Flat += value;
        break;
      case 'trust':
        state.trust = clamp(state.trust + value);
        break;
      case 'nature':
        state.nature = clamp(state.nature + value);
        break;
      case 'rivalry': case 'pace': case 'demand':
        state.dials[key] = Math.min(1, Math.max(0, state.dials[key] + value));
        break;
      case 'defRiskAll':
        for (const m of state.coalition) m.defRisk += value;
        break;
      case 'memberPressure':
        for (const m of state.coalition) {
          if (state.data.byCode[m.code].affinity[value.pole] >= 1) m.defRisk += value.amount;
        }
        break;
      case 'tempSpike':
        state.tempSpike += value;
        break;
      case 'm1Boost':
        state.turnMods.m1Boost = value;
        break;
      case 'recruitDiscount':
        state.turnMods.recruitDiscount = value;
        break;
      case 'offerPlayer':
        if (!state.offers.player && !state.flags.acceptedPole) {
          state.offers.player = { pole: value, turn: state.turn, source: 'event' };
        }
        break;
      default:
        break; // unknown keys are ignored so data can evolve ahead of engine
    }
  }
}
