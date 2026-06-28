import { useEffect, useRef, useState } from 'react';
import { STAT_META, BASE_STATS } from '../data/cityData.js';

// smooth count-up between value changes
function useAnimatedNumber(value, duration = 650) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef();

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}

function StatCard({ statKey, value }) {
  const meta = STAT_META[statKey];
  const isBudget = statKey === 'budget';
  const animated = useAnimatedNumber(value);
  const shown = isBudget ? animated.toFixed(1) : Math.round(animated);

  const base = BASE_STATS[statKey];
  const delta = Math.round((value - base) * (isBudget ? 10 : 1)) / (isBudget ? 10 : 1);
  const better = meta.higherBetter ? delta > 0 : delta < 0;
  const trendClass = delta === 0 ? 'trend-flat' : better ? 'trend-good' : 'trend-bad';
  const arrow = delta === 0 ? '—' : delta > 0 ? '↑' : '↓';
  const deltaStr =
    delta === 0
      ? '0'
      : `${delta > 0 ? '+' : ''}${isBudget ? delta.toFixed(1) : delta}${isBudget ? 'B' : meta.unit === 'AQI' ? '' : meta.unit}`;

  const fill = isBudget
    ? Math.min(100, (value / 5) * 100)
    : Math.min(100, Math.max(0, value));

  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-name">{meta.label}</span>
        <span className={`stat-trend ${trendClass}`}>
          {arrow} {deltaStr}
        </span>
      </div>
      <div className="stat-value">
        {shown}
        <span className="unit">{meta.unit}</span>
      </div>
      <div className="stat-bar">
        <i style={{ width: `${fill}%`, background: meta.accent, boxShadow: `0 0 10px ${meta.accent}` }} />
      </div>
    </div>
  );
}

export default function CityStats({ stats }) {
  const order = ['traffic', 'pollution', 'heatRisk', 'safety', 'emergencyReady', 'budget', 'citizenTrust'];
  return (
    <section className="stats" aria-label="City vitals">
      {order.map((k) => (
        <StatCard key={k} statKey={k} value={stats[k]} />
      ))}
    </section>
  );
}
