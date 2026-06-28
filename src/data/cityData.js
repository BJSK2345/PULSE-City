// ---------------------------------------------------------------------------
// PULSE City — mock / simulated city data
//
// Everything here is fictional demo data for a hackathon prototype.
// No real city, government, or emergency system is represented.
// ---------------------------------------------------------------------------

// Base city vitals shown in the bottom stat bar.
// For traffic / pollution / heatRisk a LOWER value is better.
// For safety / emergencyReady / citizenTrust a HIGHER value is better.
// budget is in billions ($B) and is unbounded.
export const BASE_STATS = {
  traffic: 78,
  pollution: 42,
  heatRisk: 65,
  safety: 91,
  emergencyReady: 87,
  budget: 2.4,
  citizenTrust: 83,
};

// "higher is better" flag drives the colour of the trend arrows.
export const STAT_META = {
  traffic: { label: 'Traffic', unit: '%', higherBetter: false, accent: '#22d3ee' },
  pollution: { label: 'Pollution', unit: 'AQI', higherBetter: false, accent: '#f5a623' },
  heatRisk: { label: 'Heat Risk', unit: '%', higherBetter: false, accent: '#f97316' },
  safety: { label: 'Safety', unit: '%', higherBetter: true, accent: '#22d39a' },
  emergencyReady: { label: 'Emergency Ready', unit: '%', higherBetter: true, accent: '#38bdf8' },
  budget: { label: 'Budget', unit: 'B', higherBetter: true, accent: '#a78bfa' },
  citizenTrust: { label: 'Citizen Trust', unit: '%', higherBetter: true, accent: '#34d399' },
};

// Four districts, each a quadrant of the city grid with its own neon identity.
export const DISTRICTS = {
  north: { id: 'north', name: 'North District', color: '#8b5cf6', center: [-17, -17] },
  west: { id: 'west', name: 'West District', color: '#22d3ee', center: [17, -17] },
  south: { id: 'south', name: 'South District', color: '#22d39a', center: [-17, 17] },
  east: { id: 'east', name: 'East District', color: '#f5a623', center: [17, 17] },
};

export const DISTRICT_ORDER = ['north', 'south', 'east', 'west'];

// --- Deterministic pseudo-random so the skyline is identical every reload ----
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a large, layered city across all four districts: downtown glass
// towers in the core, mid-rise blocks around them, and residential houses out
// at the edges — so the hologram reads as a whole living metropolis.
function generateCity() {
  const rand = mulberry32(20460);
  const buildings = [];
  const half = 30; // bigger city: extends from -half..half on each axis
  const step = 5.2; // plot spacing
  let id = 0;

  const push = (b) => buildings.push({ id: id++, ...b });

  for (let gx = -half; gx <= half; gx += step) {
    for (let gz = -half; gz <= half; gz += step) {
      // Keep a cross-shaped boulevard + river clear of buildings.
      if (Math.abs(gx) < 3) continue; // central avenue
      if (gz > -4 && gz < 1.5) continue; // river corridor (runs E-W)

      // small jitter so the grid doesn't look mechanical
      const x = gx + (rand() - 0.5) * 1.8;
      const z = gz + (rand() - 0.5) * 1.8;

      // a few empty plots become plazas / parks
      if (rand() < 0.07) continue;

      const district = x < 0 ? (z < 0 ? 'north' : 'south') : z < 0 ? 'west' : 'east';
      const dist = Math.sqrt(x * x + z * z);

      // zone bands: core towers -> mid-rise -> residential houses
      let zone;
      if (dist < 15) zone = 'core';
      else if (dist < 25) zone = rand() < 0.78 ? 'mid' : 'core';
      else zone = rand() < 0.82 ? 'res' : 'mid';

      if (zone === 'res') {
        // one (occasionally two) low houses on the residential plot
        const n = rand() < 0.35 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          push({
            type: 'house',
            district,
            position: [x + (rand() - 0.5) * 2.6, z + (rand() - 0.5) * 2.6],
            width: 1.6 + rand() * 1.1,
            depth: 1.6 + rand() * 1.1,
            height: 1.4 + rand() * 1.6,
          });
        }
        continue;
      }

      const core = zone === 'core';
      const coreFactor = Math.max(0, 1 - dist / 42);
      const base = core ? 8 + coreFactor * 16 : 4 + rand() * 5;
      const height = base + rand() * base * (core ? 0.7 : 0.5);
      const footprint = (core ? 2.6 : 2.2) + rand() * 2.2;

      push({
        type: core ? 'tower' : 'midrise',
        district,
        position: [x, z],
        width: footprint,
        depth: footprint * (0.78 + rand() * 0.44),
        height,
        tiered: core && height > 14 && rand() > 0.4,
        floors: Math.max(4, Math.round(height / 1.1)),
      });
    }
  }
  return buildings;
}

// Hand-placed civic landmarks — schools, a hospital, city hall, parks — that
// give the city recognisable, human places (shown with labels in 3D).
export const LANDMARKS = [
  { id: 'lm-school-n', type: 'school', district: 'north', position: [-24, -9], label: 'Northgate School' },
  { id: 'lm-school-e', type: 'school', district: 'east', position: [9, 25], label: 'Riverside School' },
  { id: 'lm-hospital', type: 'hospital', district: 'west', position: [25, -8], label: 'West General Hospital' },
  { id: 'lm-civic', type: 'civic', district: 'north', position: [-9, -25], label: 'City Hall' },
  { id: 'lm-park-s', type: 'park', district: 'south', position: [-9, 26], label: 'Riverside Park' },
  { id: 'lm-park-e', type: 'park', district: 'east', position: [27, 10], label: 'Harbor Green' },
];

export const CITY_BUILDINGS = generateCity();

// The river / low-lying flood corridor (used by Flash Flood + Flood Barrier).
export const RIVER = {
  // an E-W strip slightly south of centre
  position: [0, -1.25],
  width: 70,
  depth: 5,
};

// --------------------------- BUILD MODE upgrades ----------------------------
// effects use the SAME sign convention as the stats themselves.
export const UPGRADES = [
  {
    id: 'solar',
    name: 'Solar Roof Network',
    icon: '☀️',
    cost: 12,
    district: 'north',
    tags: ['ENERGY -30%', 'CARBON -15%'],
    effects: { pollution: -8, heatRisk: -2, citizenTrust: +2, budget: -0.012 },
    mitigates: ['blackout', 'heatwave'],
    blurb:
      'A district-wide solar roof network cuts grid load and carbon output. It also hardens the grid against blackout cascades.',
  },
  {
    id: 'greenroofs',
    name: 'Green Roofs',
    icon: '🌿',
    cost: 8,
    district: 'east',
    tags: ['HEAT -20%', 'BIODIVERSITY +40%'],
    effects: { heatRisk: -12, pollution: -4, citizenTrust: +2, budget: -0.008 },
    mitigates: ['heatwave'],
    blurb:
      'Vegetated roofs lower surface temperatures and absorb stormwater, easing both heat-wave and flash-flood pressure.',
  },
  {
    id: 'buslane',
    name: 'Bus Priority Lane',
    icon: '🚌',
    cost: 5,
    district: 'west',
    tags: ['TRAFFIC -12%', 'COMMUTE -18%'],
    effects: { traffic: -12, pollution: -3, citizenTrust: +1, budget: -0.005 },
    mitigates: ['gridlock'],
    blurb:
      'Dedicated bus lanes move more people in less road space — a strong buffer against traffic-gridlock events.',
  },
  {
    id: 'floodbarrier',
    name: 'Flood Barrier',
    icon: '🌊',
    cost: 22,
    district: 'south',
    tags: ['FLOOD RISK -45%', 'INSURANCE -20%'],
    effects: { emergencyReady: +12, safety: +2, citizenTrust: +3, budget: -0.022 },
    mitigates: ['flood', 'storm'],
    blurb:
      'A deployable barrier along the South river corridor is the single most effective defence against flash flooding.',
  },
  {
    id: 'streetlights',
    name: 'Smart Streetlights',
    icon: '💡',
    cost: 3,
    district: 'all',
    tags: ['SAFETY +15%', 'ENERGY -25%'],
    effects: { safety: +8, pollution: -2, citizenTrust: +1, budget: -0.003 },
    mitigates: ['blackout'],
    blurb:
      'Adaptive LED streetlights with battery backup raise night safety and keep corridors lit during outages.',
  },
  {
    id: 'verticalfarm',
    name: 'Vertical Farm Hub',
    icon: '🌱',
    cost: 15,
    district: 'east',
    tags: ['FOOD +30%', 'CO2 -10%'],
    effects: { pollution: -5, heatRisk: -3, citizenTrust: +2, budget: -0.015 },
    mitigates: ['heatwave'],
    blurb:
      'A local vertical farm shortens supply chains, cuts emissions, and adds shaded thermal mass to the district.',
  },
  {
    id: 'evcharging',
    name: 'EV Charging Cluster',
    icon: '⚡',
    cost: 7,
    district: 'west',
    tags: ['EV ADOPTION +22%', 'EMISSIONS -8%'],
    effects: { pollution: -6, traffic: -2, citizenTrust: +1, budget: -0.007 },
    mitigates: ['gridlock'],
    blurb:
      'Fast-charging clusters accelerate EV adoption, lowering tailpipe pollution across the West District.',
  },
  {
    id: 'bikecorridor',
    name: 'Bike Corridor',
    icon: '🚲',
    cost: 4,
    district: 'north',
    tags: ['TRAFFIC -8%', 'HEALTH +12%'],
    effects: { traffic: -6, pollution: -2, citizenTrust: +1, budget: -0.004 },
    mitigates: ['gridlock'],
    blurb:
      'A protected bike corridor pulls short trips off the road network and improves public health metrics.',
  },
];

// --------------------------- SCAN MODE issues -------------------------------
export const ISSUE_TYPES = [
  {
    id: 'streetlight',
    name: 'Broken Streetlight',
    icon: '💡',
    urgency: 'Medium',
    district: 'north',
    location: 'North District, Block 7',
    effects: { safety: -4, citizenTrust: -2 },
    worsens: ['blackout'],
    severityBoost: 8,
    suggestedFix: 'Dispatch a maintenance crew to replace the fixture and audit the local lighting circuit.',
    whyItMatters: 'Dark corridors lower night-time safety and compound risk during a blackout.',
  },
  {
    id: 'drain',
    name: 'Blocked Drain',
    icon: '🌊',
    urgency: 'High',
    district: 'south',
    location: 'South District, Sector 12',
    effects: { emergencyReady: -6, safety: -2, citizenTrust: -3 },
    worsens: ['flood', 'storm'],
    severityBoost: 22,
    suggestedFix: 'Clear the storm drain and inspect the South corridor for systemic drainage failure.',
    whyItMatters: 'A blocked drain dramatically raises flash-flood risk in the low-lying South District.',
  },
  {
    id: 'road',
    name: 'Road Damage',
    icon: '🛣️',
    urgency: 'Medium',
    district: 'east',
    location: 'East District, Main Ave',
    effects: { traffic: +6, emergencyReady: -4, citizenTrust: -2 },
    worsens: ['gridlock', 'storm'],
    severityBoost: 12,
    suggestedFix: 'Resurface the damaged section and reroute heavy traffic during repairs.',
    whyItMatters: 'Damaged roads slow traffic and delay emergency response vehicles.',
  },
  {
    id: 'trash',
    name: 'Overflowing Trash',
    icon: '🗑️',
    urgency: 'Low',
    district: 'west',
    location: 'West District, Park Rd',
    effects: { pollution: +5, citizenTrust: -2 },
    worsens: [],
    severityBoost: 4,
    suggestedFix: 'Schedule an extra collection run and add bin capacity at the park.',
    whyItMatters: 'Uncollected waste raises local pollution and erodes citizen trust.',
  },
  {
    id: 'crosswalk',
    name: 'Unsafe Crosswalk',
    icon: '🚸',
    urgency: 'High',
    district: 'south',
    location: 'South District, School Zone',
    effects: { safety: -7, citizenTrust: -3 },
    worsens: [],
    severityBoost: 6,
    suggestedFix: 'Install a signalised crossing and traffic-calming measures near the school.',
    whyItMatters: 'An unsafe school-zone crossing is a direct, immediate risk to residents.',
  },
  {
    id: 'outage',
    name: 'Power Outage Report',
    icon: '🔌',
    urgency: 'High',
    district: 'east',
    location: 'East District, Grid 4B',
    effects: { emergencyReady: -8, safety: -3, citizenTrust: -3 },
    worsens: ['blackout', 'heatwave'],
    severityBoost: 20,
    suggestedFix: 'Isolate the failing feeder and bring backup generation online for Grid 4B.',
    whyItMatters: 'An unstable feeder lowers emergency readiness and can trigger a wider blackout.',
  },
];

// --------------------------- CRISIS MODE events -----------------------------
export const CRISIS_TYPES = [
  {
    id: 'flood',
    name: 'Flash Flood',
    icon: '🌊',
    color: '#ef4444',
    zoneColor: '#3b82f6',
    district: 'south',
    baseSeverity: 55,
    effects: { emergencyReady: -18, safety: -14, traffic: +12, citizenTrust: -8 },
    actions: [
      'Open emergency shelters in unaffected North District',
      'Close low-lying roads along the South river corridor',
      'Deploy pump crews to priority drainage points',
      'Issue evacuation alerts to South District residents',
    ],
    summary:
      'A flash flood is forming along the South river corridor. Water is rising faster than the drainage network can clear.',
  },
  {
    id: 'heatwave',
    name: 'Heat Wave',
    icon: '🔥',
    color: '#f97316',
    zoneColor: '#f97316',
    district: 'east',
    baseSeverity: 48,
    effects: { heatRisk: +22, safety: -8, emergencyReady: -10, citizenTrust: -6 },
    actions: [
      'Activate cooling centres across all districts',
      'Prioritise grid load-balancing to prevent brownouts',
      'Send wellness crews to vulnerable residents',
      'Suspend non-essential outdoor work',
    ],
    summary:
      'A multi-day heat wave is pushing the East District grid and vulnerable residents toward their limits.',
  },
  {
    id: 'blackout',
    name: 'Blackout',
    icon: '🔌',
    color: '#eab308',
    zoneColor: '#eab308',
    district: 'east',
    baseSeverity: 50,
    effects: { safety: -16, emergencyReady: -16, traffic: +8, citizenTrust: -10 },
    actions: [
      'Switch traffic signals to backup power / manual control',
      'Dispatch crews to restore the failed Grid 4B feeder',
      'Open lit shelters for residents without power',
      'Prioritise hospitals and water-pumping stations',
    ],
    summary:
      'A cascading blackout has hit the East District grid. Signals, lighting, and pumps are running on reserve power.',
  },
  {
    id: 'gridlock',
    name: 'Traffic Gridlock',
    icon: '🚦',
    color: '#f43f5e',
    zoneColor: '#f43f5e',
    district: 'west',
    baseSeverity: 42,
    effects: { traffic: +24, emergencyReady: -12, pollution: +6, citizenTrust: -6 },
    actions: [
      'Reroute traffic around the West District chokepoints',
      'Create emergency-vehicle priority corridors',
      'Hold and stagger signal timing city-wide',
      'Push real-time transit alternatives to commuters',
    ],
    summary:
      'Traffic has seized up across the West District, choking commute times and blocking emergency access.',
  },
  {
    id: 'storm',
    name: 'Storm Damage',
    icon: '⛈️',
    color: '#a855f7',
    zoneColor: '#a855f7',
    district: 'north',
    baseSeverity: 52,
    effects: { safety: -12, emergencyReady: -14, traffic: +10, citizenTrust: -7 },
    actions: [
      'Send repair crews to clear debris and downed lines',
      'Close high-risk roads and damaged structures',
      'Pre-position generators at critical facilities',
      'Coordinate shelter capacity ahead of the next band',
    ],
    summary:
      'A severe storm has caused structural and infrastructure damage across the North District.',
  },
];

// --------------------------- MAP DATA LAYERS --------------------------------
// Selectable overlays. "data" layers recolour each district on a
// green (low) -> yellow (mid) -> red (high) gradient for that metric.
export const MAP_LAYERS = [
  { id: 'standard', name: 'Standard', icon: '🌐', type: 'standard', desc: 'Full holographic city view.' },
  { id: 'roads', name: 'Roads', icon: '🛣️', type: 'roads', desc: 'Street network and key landmarks.' },
  { id: 'traffic', name: 'Traffic', icon: '🚦', type: 'data', metric: 'traffic', low: 'Free-flow', high: 'Gridlock', desc: 'Road congestion by district.' },
  { id: 'safety', name: 'Safety', icon: '🛡️', type: 'data', metric: 'safety', low: 'Safe', high: 'High risk', desc: 'Public-safety risk by district.' },
  { id: 'air', name: 'Air Quality', icon: '🌫️', type: 'data', metric: 'air', low: 'Clean', high: 'Hazardous', desc: 'Air pollution by district.' },
  { id: 'heat', name: 'Heat', icon: '🔥', type: 'data', metric: 'heat', low: 'Cool', high: 'Extreme', desc: 'Surface heat risk by district.' },
  { id: 'flood', name: 'Flood Risk', icon: '🌊', type: 'data', metric: 'flood', low: 'Dry', high: 'High risk', desc: 'Flood exposure by district.' },
];

// Baseline per-district metric levels (0 = none, 100 = severe). Reports,
// upgrades, and active crises shift these live (see utils/layers.js).
// NOTE: for "safety", a higher value means MORE risk (less safe).
export const DISTRICT_METRICS_BASE = {
  north: { traffic: 42, safety: 30, air: 35, heat: 38, flood: 22 },
  south: { traffic: 34, safety: 38, air: 30, heat: 32, flood: 58 },
  east: { traffic: 55, safety: 34, air: 52, heat: 60, flood: 28 },
  west: { traffic: 68, safety: 40, air: 58, heat: 40, flood: 30 },
};

// Named streets drawn on the ground for the "Roads" layer.
export const ROADS = [
  { id: 'central', name: 'Central Ave', a: [0, -30], b: [0, 30] },
  { id: 'river', name: 'Riverside Rd', a: [-33, -1.25], b: [33, -1.25] },
  { id: 'north-blvd', name: 'North Blvd', a: [-30, -16], b: [-4, -16] },
  { id: 'west-loop', name: 'West Loop', a: [16, -30], b: [16, -4] },
  { id: 'market-row', name: 'Market Row', a: [-30, 16], b: [-4, 16] },
  { id: 'harbor-way', name: 'Harbor Way', a: [6, 16], b: [30, 16] },
];

export const TAGLINE =
  'A digital twin that helps cities see, fix, and survive problems before they become disasters.';
