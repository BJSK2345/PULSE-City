// ---------------------------------------------------------------------------
// PULSE City — map-layer logic
//
// Per-district metric levels (0..100) for the selectable data layers, plus the
// green -> yellow -> red gradient. Reports, upgrades, and active crises shift
// the baselines live, so the overlays react to everything the player does.
// ---------------------------------------------------------------------------

import {
  DISTRICT_METRICS_BASE,
  UPGRADES,
  ISSUE_TYPES,
  CRISIS_TYPES,
} from '../data/cityData.js';

const DISTRICTS = ['north', 'south', 'east', 'west'];

// How each action nudges a district's metrics (higher = worse).
const ISSUE_METRIC = {
  streetlight: { safety: 18 },
  drain: { flood: 26 },
  road: { traffic: 22 },
  trash: { air: 20 },
  crosswalk: { safety: 22 },
  outage: { safety: 14, heat: 10 },
};

const UPGRADE_METRIC = {
  solar: { air: -16 },
  greenroofs: { heat: -24, air: -6 },
  buslane: { traffic: -24 },
  floodbarrier: { flood: -36 },
  streetlights: { safety: -16 },
  verticalfarm: { heat: -16, air: -8 },
  evcharging: { air: -20, traffic: -8 },
  bikecorridor: { traffic: -16 },
};

const CRISIS_METRIC = {
  flood: { flood: 34 },
  heatwave: { heat: 34 },
  blackout: { safety: 28, heat: 8 },
  gridlock: { traffic: 34 },
  storm: { safety: 22, flood: 14 },
};

function cloneBase() {
  const out = {};
  for (const d of DISTRICTS) out[d] = { ...DISTRICT_METRICS_BASE[d] };
  return out;
}

export function computeDistrictMetrics({ upgrades = [], issues = [], activeCrisis = null }) {
  const m = cloneBase();

  const applyTo = (districtIds, deltas) => {
    districtIds.forEach((d) => {
      for (const [k, v] of Object.entries(deltas)) m[d][k] = (m[d][k] ?? 0) + v;
    });
  };

  upgrades.forEach((id) => {
    const up = UPGRADES.find((u) => u.id === id);
    const deltas = UPGRADE_METRIC[id];
    if (up && deltas) applyTo(up.district === 'all' ? DISTRICTS : [up.district], deltas);
  });

  issues.forEach((i) => {
    const t = ISSUE_TYPES.find((x) => x.id === i.typeId);
    const deltas = ISSUE_METRIC[i.typeId];
    if (t && deltas) applyTo([t.district], deltas);
  });

  if (activeCrisis) {
    const c = CRISIS_TYPES.find((x) => x.id === activeCrisis);
    const deltas = CRISIS_METRIC[activeCrisis];
    if (c && deltas) applyTo([c.district], deltas);
  }

  for (const d of DISTRICTS) {
    for (const k of Object.keys(m[d])) m[d][k] = Math.max(0, Math.min(100, Math.round(m[d][k])));
  }
  return m;
}

function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function toHex(c) {
  return '#' + c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// green (low) -> yellow (mid) -> red (high)
const GREEN = [34, 197, 94];
const YELLOW = [234, 179, 8];
const RED = [239, 68, 68];

export function gradientColor(value) {
  const t = Math.max(0, Math.min(1, value / 100));
  const c = t < 0.5 ? lerp(GREEN, YELLOW, t / 0.5) : lerp(YELLOW, RED, (t - 0.5) / 0.5);
  return toHex(c);
}

// Build { north, south, east, west } -> hex color for a given data metric.
export function layerColorsFor(metricKey, metrics) {
  if (!metricKey || !metrics) return null;
  const out = {};
  for (const d of DISTRICTS) out[d] = gradientColor(metrics[d]?.[metricKey] ?? 0);
  return out;
}

export const GRADIENT_CSS =
  'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)';
