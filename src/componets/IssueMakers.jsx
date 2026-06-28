// Pure helper: turn the city's reported issues + deployed upgrades into the
// list of glowing 3D markers rendered inside <HologramCity />.
import { DISTRICTS, ISSUE_TYPES, UPGRADES } from '../data/cityData.js';

const URGENCY_COLOR = {
  Low: '#d8df6a',
  Medium: '#f5a623',
  High: '#ef4444',
  Critical: '#ff3b5c',
};

// spread several markers within the same district so they don't overlap
const OFFSETS = [
  [0, 0],
  [5, 3],
  [-4, 4],
  [4, -5],
  [-5, -3],
  [2, 6],
  [-6, 1],
  [6, -2],
];

export function buildMarkers({ upgrades = [], issues = [] }) {
  const markers = [];
  const counts = {};

  const place = (district) => {
    const center = district === 'all' ? [0, 6] : DISTRICTS[district]?.center || [0, 0];
    const i = counts[district] ?? 0;
    counts[district] = i + 1;
    const [ox, oz] = OFFSETS[i % OFFSETS.length];
    return [center[0] + ox, center[1] + oz];
  };

  issues.forEach((iss) => {
    const type = ISSUE_TYPES.find((x) => x.id === iss.typeId);
    if (!type) return;
    markers.push({
      key: `issue-${iss.id}`,
      position: place(type.district),
      color: URGENCY_COLOR[type.urgency] || '#ef4444',
      kind: 'issue',
    });
  });

  upgrades.forEach((u) => {
    const up = UPGRADES.find((x) => x.id === u);
    if (!up) return;
    markers.push({
      key: `upg-${u}`,
      position: place(up.district),
      color: '#22d39a',
      kind: 'upgrade',
    });
  });

  return markers;
}
