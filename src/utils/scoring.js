// ---------------------------------------------------------------------------
// PULSE City — scoring + simulation logic
//
// Pure functions only. Given a base state + the player's actions, derive the
// live city vitals, crisis impact, and the AI assistant's narration.
// ---------------------------------------------------------------------------

import { BASE_STATS, UPGRADES, ISSUE_TYPES, CRISIS_TYPES } from '../data/cityData.js';

// Stats that are percentages get clamped to 0..100. budget is free-floating.
const PERCENT_STATS = [
  'traffic',
  'pollution',
  'heatRisk',
  'safety',
  'emergencyReady',
  'citizenTrust',
];

export function clampStat(key, value) {
  if (key === 'budget') return Math.round(value * 1000) / 1000;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function addEffects(target, effects) {
  if (!effects) return target;
  for (const [key, delta] of Object.entries(effects)) {
    target[key] = (target[key] ?? 0) + delta;
  }
  return target;
}

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const UPGRADE_MAP = byId(UPGRADES);
const ISSUE_MAP = byId(ISSUE_TYPES);
const CRISIS_MAP = byId(CRISIS_TYPES);

// Compute the full city vitals from the list of deployed upgrades, reported
// issues, and the currently active crisis (if any).
export function computeStats({ upgrades = [], issues = [], activeCrisis = null }) {
  const stats = { ...BASE_STATS };

  upgrades.forEach((u) => addEffects(stats, UPGRADE_MAP[u]?.effects));
  issues.forEach((i) => addEffects(stats, ISSUE_MAP[i.typeId]?.effects));

  if (activeCrisis) {
    const crisis = CRISIS_MAP[activeCrisis];
    if (crisis) {
      const { multiplier } = crisisImpact(activeCrisis, { upgrades, issues });
      // scale the crisis effects by how prepared the city is
      const scaled = {};
      for (const [k, v] of Object.entries(crisis.effects)) scaled[k] = v * multiplier;
      addEffects(stats, scaled);
    }
  }

  const out = {};
  for (const key of Object.keys(stats)) out[key] = clampStat(key, stats[key]);
  return out;
}

// How bad will a crisis be, given the city's current state?
// Reported issues that "worsen" the crisis amplify it; deployed upgrades that
// "mitigate" it dampen it. Returns severity 0..100 + a stat multiplier.
export function crisisImpact(crisisId, { upgrades = [], issues = [] }) {
  const crisis = CRISIS_MAP[crisisId];
  if (!crisis) return { severity: 0, multiplier: 1, aggravators: [], mitigators: [] };

  let severity = crisis.baseSeverity;
  const aggravators = [];
  const mitigators = [];

  issues.forEach((i) => {
    const type = ISSUE_MAP[i.typeId];
    if (type?.worsens?.includes(crisisId)) {
      severity += type.severityBoost;
      aggravators.push(type);
    }
  });

  upgrades.forEach((u) => {
    const up = UPGRADE_MAP[u];
    if (up?.mitigates?.includes(crisisId)) {
      severity -= 28;
      mitigators.push(up);
    }
  });

  severity = Math.max(8, Math.min(100, Math.round(severity)));
  // multiplier scales the crisis stat hit: 1.0 at baseSeverity, more if worse.
  const multiplier = Math.max(0.35, severity / crisis.baseSeverity);

  return { severity, multiplier, aggravators, mitigators };
}

export function severityLabel(severity) {
  if (severity >= 80) return 'CRITICAL';
  if (severity >= 60) return 'SEVERE';
  if (severity >= 40) return 'ELEVATED';
  return 'CONTAINED';
}

// ----------------------------- AI assistant ---------------------------------
// Returns the structured content for the right-hand AURA-style panel.
function liveStream(seed = 0) {
  const now = new Date();
  const t = (offset) => {
    const d = new Date(now.getTime() - offset * 3000);
    return d.toTimeString().slice(0, 8);
  };
  const pool = [
    `sensor_grid_s12 → flow: 0.${2 + (seed % 6)}m/s LOW`,
    `report_0${4821 + seed} → classified: ok`,
    `weather_api → storm_prob: ${60 + (seed % 30)}% HIGH`,
    `model_v3.2 → risk_south: 0.${70 + (seed % 25)} CRIT`,
    `twin_sync → latency: 1${seed % 4}ms OK`,
  ];
  return pool.map((line, idx) => ({ time: t(idx), line }));
}

export function getAIMessage({ mode, upgrades = [], issues = [], activeCrisis = null, seed = 0 }) {
  const stream = liveStream(seed);

  if (mode === 'crisis' && activeCrisis) {
    const crisis = CRISIS_MAP[activeCrisis];
    const { severity, aggravators, mitigators } = crisisImpact(activeCrisis, { upgrades, issues });
    const level = severityLabel(severity);

    let recommendation = crisis.summary;
    if (aggravators.length) {
      recommendation += ` ${aggravators[0].name} report detected — impact amplified in the ${crisis.district} district. Priority repair recommended before the event peaks.`;
    }
    if (mitigators.length) {
      recommendation += ` ${mitigators[0].name} is online and is actively reducing damage.`;
    }

    return {
      title: `EMERGENCY: ${crisis.name}`,
      subtitle: 'Crisis Response Coordinator',
      recommendation,
      riskInsight: mitigators.length
        ? `Deployed infrastructure is dampening this event. Projected severity held to ${severity}/100.`
        : `No mitigating infrastructure detected for this event. Projected severity ${severity}/100. Consider pre-emptive upgrades next cycle.`,
      confidence: Math.min(98, 78 + mitigators.length * 4 + aggravators.length * 2),
      impact: level,
      impactKind: severity >= 60 ? 'critical' : 'high',
      actions: crisis.actions,
      stream,
    };
  }

  if (mode === 'crisis') {
    return {
      title: 'CRISIS COMMAND STANDBY',
      subtitle: 'Crisis Response Coordinator',
      recommendation:
        'Select a crisis type to activate the emergency response protocol. Reports filed in Scan Mode and upgrades from Build Mode will shape the projected impact.',
      riskInsight:
        issues.length > 0
          ? `${issues.length} active citizen report(s) on file. Some may amplify an incident if one occurs.`
          : 'No active citizen reports. Run Scan Mode to surface latent risks before a crisis hits.',
      confidence: 92,
      impact: 'STANDBY',
      impactKind: 'medium',
      actions: [],
      stream,
    };
  }

  if (mode === 'scan') {
    const high = issues.filter((i) => ISSUE_MAP[i.typeId]?.urgency === 'High').length;
    return {
      title: 'CITIZEN INTELLIGENCE',
      subtitle: 'Field Report Analyst',
      recommendation: issues.length
        ? `${issues.length} report(s) integrated into the twin. ${
            high ? `${high} are HIGH urgency and feed directly into crisis modelling.` : ''
          } Focus crews on the highest-urgency clusters first.`
        : 'Add a citizen report to see how it ripples through the digital twin and changes future crisis risk.',
      riskInsight:
        'Citizen reports in the South District have increased 210% this week. Pattern suggests systemic drainage failure, not isolated incidents.',
      confidence: 89,
      impact: high > 0 ? 'CRITICAL' : 'ELEVATED',
      impactKind: high > 0 ? 'critical' : 'high',
      actions: [],
      stream,
    };
  }

  // build mode (default)
  return {
    title: 'INFRASTRUCTURE ADVISOR',
    subtitle: 'City Planning Co-pilot',
    recommendation: upgrades.length
      ? `${upgrades.length} upgrade(s) simulated in the twin. Net effect is trending positive — review the stat bar for tradeoffs against budget.`
      : 'Prioritise the Flood Barrier in South District — current models show 45% flood-risk reduction with pre-storm deployment.',
    riskInsight:
      'South District drainage capacity at 62%. Without intervention, projected damage exceeds $180M next storm season.',
    confidence: 94,
    impact: 'HIGH',
    impactKind: 'high',
    actions: [],
    stream,
  };
}
