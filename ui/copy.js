// All player-facing game copy: calm urgency, concrete, no doom performance.
// Real instruments (REDATA, TFFF, PL 2780) are cited where true; events are fictional.

export const INSTRUMENTS = {
  m1: {
    name: 'Condition',
    tag: 'M1',
    blurb: 'Attach terms to inbound capital, REDATA-style. Converts minerals, compute and market into leverage you can price.'
  },
  m2: {
    name: 'Recruit',
    tag: 'M2',
    blurb: 'Bring a country into the coalition. Distance — of regime, of alignment — is expensive.'
  },
  m3: {
    name: 'Fund the facility',
    tag: 'M3',
    blurb: 'Seed the pooled facility, the way TFFF was seeded. Expensive up front; the anti-defection instrument, and it compounds.'
  },
  m4: {
    name: 'Wield rules',
    tag: 'M4',
    blurb: 'A regulatory or judicial strike on a hyperscaler — PL 2780 gives your courts the docket. Big season, long retaliation tail.'
  },
  m5: {
    name: 'Go it alone',
    tag: 'M5',
    blurb: 'Take the bilateral deal on the table. Always available. Feels good today.'
  },
  m6: {
    name: 'Pool the commons',
    tag: 'M6',
    blurb: 'Members pool compute, data and models. Peer capacity rises; staying starts to pay.'
  }
};

export const CRITERIA = [
  { key: 'c1', label: 'C1 leverage', bad: false },
  { key: 'c2', label: 'C2 coalition', bad: false },
  { key: 'c3', label: 'C3 retaliation exposure', bad: true },
  { key: 'c4', label: 'C4 autonomy', bad: false },
  { key: 'c5', label: 'C5 coherence', bad: false },
  { key: 'c6', label: 'C6 integrity & benefit', bad: false },
  { key: 'c7', label: 'C7 peer gains', bad: false }
];

export const DIALS = [
  { key: 'rivalry', label: 'X1 rivalry', warm: true },
  { key: 'pace', label: 'X2 frontier pace', warm: false },
  { key: 'demand', label: 'X3 minerals & energy demand', warm: false }
];

export const POLE_NAMES = { us: 'Washington', cn: 'Beijing' };

export const OFFER_COPY = {
  us: 'Compute access, tariff relief, investment — real terms, on the table now. What you have converted is priced in; what you have not is not.',
  cn: 'Concessional compute, BRICS finance, market access — real terms, on the table now. What you have converted is priced in; what you have not is not.'
};

export const ENDING_KICKERS = {
  seat: 'Ending 1 of 5',
  broker: 'Ending 2 of 5',
  'junior-partner': 'Ending 3 of 5',
  menu: 'Ending 4 of 5',
  'integrity-spiral': 'Crisis ending',
  'retaliation-spiral': 'Crisis ending'
};

export const PLAYER_NOTE =
  'Clean-energy datacentre host of the Americas, heavy-rare-earth potential (the niobium line is often overweighted), Pix-scale market. Convertible, not positional: it counts when you convert it.';
