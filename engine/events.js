// World-phase events: weighted draw without replacement — and each event is a
// decision. Drawing stores a pending question; the player answers it during
// their phase (or the year answers it for them with the passive option 'b').
// The DSL keys are documented in docs/model-notes.md.

import { clamp, log } from './state.js';
import { pickWeighted } from './rng.js';

export const DEFAULT_CHOICE = 'b';

export function drawEvent(state) {
  const remaining = state.data.events.events.filter((e) => state.eventDeck.includes(e.id));
  const event = pickWeighted(state.rng, remaining, (e) => e.weights[state.scenarioId] ?? 1);
  if (!event) return null;
  state.eventDeck = state.eventDeck.filter((id) => id !== event.id);
  state.drawnEvents.push(event.id);
  state.currentEvent = event.id;
  state.pendingEvent = event.id;
  state.lastChoice = null;
  log(state, 'world', `Event — ${event.name}: ${event.copy}`);
  return event;
}

/** Resolve the pending event with choice 'a' or 'b'. */
export function resolveEvent(state, choiceKey, auto = false) {
  if (!state.pendingEvent) throw new Error('No event to decide');
  const event = state.data.events.events.find((e) => e.id === state.pendingEvent);
  const choice = event.choices[choiceKey];
  if (!choice) throw new Error(`Unknown choice: ${choiceKey}`);

  let effects = { ...choice.effects };
  if (choice.ifFacilityFunded && state.facility.streak > 0) {
    effects = { ...effects, ...choice.ifFacilityFunded };
  }
  if (choice.ifTierD && state.coalition.some((m) => state.data.byCode[m.code].tier === 'D')) {
    effects = { ...effects, ...choice.ifTierD };
  }
  if (choice.ifConvertedMinerals && (state.player.converted.minerals ?? 0) >= 0.5) {
    effects = { ...effects, ...choice.ifConvertedMinerals };
  }
  applyEffects(state, effects);

  state.pendingEvent = null;
  state.lastChoice = { eventId: event.id, key: choiceKey, label: choice.label };
  log(state, auto ? 'resolution' : 'player',
    auto
      ? `${event.name}: you never decided, so the year decided for you — ${choice.label.toLowerCase()}.`
      : `${event.name}: ${choice.label.toLowerCase()}.`);
  return state;
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
      case 'ap':
        state.ap = Math.max(0, Math.min(state.params.game.apPerTurn, state.ap + value));
        break;
      case 'legalOpening':
        state.legalOpening = Math.max(state.legalOpening, value);
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
