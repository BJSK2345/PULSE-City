import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Header from './components/Header.jsx';
import ModeSwitcher from './components/ModeSwitcher.jsx';
import BuildPanel from './components/BuildPanel.jsx';
import ScanPanel from './components/ScanPanel.jsx';
import CrisisPanel from './components/CrisisPanel.jsx';
import HologramCity from './components/HologramCity.jsx';
import AIAssistantPanel from './components/AIAssistantPanel.jsx';
import CityStats from './components/CityStats.jsx';
import LayerControl from './components/LayerControl.jsx';
import { buildMarkers } from './components/IssueMarkers.jsx';

import {
  CRISIS_TYPES,
  DISTRICTS,
  UPGRADES,
  ISSUE_TYPES,
  DISTRICT_ORDER,
  MAP_LAYERS,
} from './data/cityData.js';
import { computeStats, crisisImpact, getAIMessage } from './utils/scoring.js';
import { computeDistrictMetrics, layerColorsFor, GRADIENT_CSS } from './utils/layers.js';

const MODE_LABELS = { build: 'Build', scan: 'Scan', crisis: 'Crisis' };
const STAGE_STATUS = { build: 'SIMULATING', scan: 'SCANNING', crisis: 'RESPONDING' };

export default function App() {
  const [mode, setMode] = useState('build');
  const [upgrades, setUpgrades] = useState([]);
  const [issues, setIssues] = useState([]);
  const [activeCrisis, setActiveCrisis] = useState(null);
  const [layer, setLayer] = useState('standard');
  const [toasts, setToasts] = useState([]);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [streamSeed, setStreamSeed] = useState(0);

  const idRef = useRef(0);
  const timersRef = useRef([]);
  const firstRender = useRef(true);

  // mirrors of the action arrays so handlers can dedupe without putting side
  // effects inside a setState updater (which React StrictMode double-invokes).
  const upgradesRef = useRef(upgrades);
  const issuesRef = useRef(issues);
  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);
  useEffect(() => {
    issuesRef.current = issues;
  }, [issues]);

  // ---- toasts ----
  const addToast = useCallback((text, kind = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  // ---- live data stream "heartbeat" ----
  useEffect(() => {
    const handle = setInterval(() => setStreamSeed((s) => (s + 1) % 10000), 3200);
    return () => clearInterval(handle);
  }, []);

  // ---- toast on every mode change (manual or scripted) ----
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    addToast(`${MODE_LABELS[mode]} Mode activated`, mode === 'crisis' ? 'crisis' : 'info');
  }, [mode, addToast]);

  // ---- clear any scenario timers on unmount ----
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // ---- actions ----
  const deployUpgrade = useCallback(
    (id) => {
      if (upgradesRef.current.includes(id)) return;
      const up = UPGRADES.find((u) => u.id === id);
      upgradesRef.current = [...upgradesRef.current, id];
      setUpgrades(upgradesRef.current);
      addToast(`${up?.name || 'Upgrade'} deployed`, 'good');
    },
    [addToast]
  );

  const reportIssue = useCallback(
    (typeId) => {
      if (issuesRef.current.some((i) => i.typeId === typeId)) return;
      const t = ISSUE_TYPES.find((x) => x.id === typeId);
      const item = { id: ++idRef.current, typeId };
      issuesRef.current = [...issuesRef.current, item];
      setIssues(issuesRef.current);
      addToast(`${t?.name || 'Issue'} report filed`, 'info');
    },
    [addToast]
  );

  const activateCrisis = useCallback(
    (id) => {
      const c = CRISIS_TYPES.find((x) => x.id === id);
      setActiveCrisis(id);
      addToast(`⚠ ${c?.name || 'Crisis'} protocol active`, 'crisis');
    },
    [addToast]
  );

  const clearCrisis = useCallback(() => setActiveCrisis(null), []);

  // ---- automated demo scenario ----
  const runScenario = useCallback(() => {
    if (scenarioRunning) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // clean slate for a crisp story
    upgradesRef.current = [];
    issuesRef.current = [];
    setUpgrades([]);
    setIssues([]);
    setActiveCrisis(null);
    setLayer('standard');
    setScenarioRunning(true);
    addToast('▶ Running city scenario…', 'good');

    const steps = [
      () => setMode('scan'),
      () => reportIssue('drain'),
      () => setMode('build'),
      () => deployUpgrade('floodbarrier'),
      () => setMode('crisis'),
      () => activateCrisis('flood'),
      () => {
        setLayer('flood');
        addToast('Flood-risk layer enabled — South District flagged', 'info');
      },
      () => {
        addToast('Scenario complete — twin used the report + barrier to respond', 'good');
        setScenarioRunning(false);
      },
    ];

    steps.forEach((fn, i) => {
      timersRef.current.push(setTimeout(fn, 700 + i * 1600));
    });
  }, [scenarioRunning, addToast, reportIssue, deployUpgrade, activateCrisis]);

  // ---- derived state ----
  const stats = useMemo(
    () => computeStats({ upgrades, issues, activeCrisis }),
    [upgrades, issues, activeCrisis]
  );

  const ai = useMemo(
    () => getAIMessage({ mode, upgrades, issues, activeCrisis, seed: streamSeed }),
    [mode, upgrades, issues, activeCrisis, streamSeed]
  );

  const markers = useMemo(() => buildMarkers({ upgrades, issues }), [upgrades, issues]);

  const districtMetrics = useMemo(
    () => computeDistrictMetrics({ upgrades, issues, activeCrisis }),
    [upgrades, issues, activeCrisis]
  );

  const activeLayer = useMemo(
    () => MAP_LAYERS.find((l) => l.id === layer) || MAP_LAYERS[0],
    [layer]
  );

  const layerColors = useMemo(
    () => (activeLayer.type === 'data' ? layerColorsFor(activeLayer.metric, districtMetrics) : null),
    [activeLayer, districtMetrics]
  );

  const crisisForScene = useMemo(() => {
    if (!activeCrisis) return null;
    const c = CRISIS_TYPES.find((x) => x.id === activeCrisis);
    const { severity } = crisisImpact(activeCrisis, { upgrades, issues });
    return { district: c.district, zoneColor: c.zoneColor, severity };
  }, [activeCrisis, upgrades, issues]);

  const impact = useMemo(
    () => (activeCrisis ? crisisImpact(activeCrisis, { upgrades, issues }) : null),
    [activeCrisis, upgrades, issues]
  );

  return (
    <div className="app">
      <Header onRunScenario={runScenario} scenarioRunning={scenarioRunning} />

      <ModeSwitcher mode={mode} setMode={setMode} />

      {mode === 'build' && <BuildPanel upgrades={upgrades} onDeploy={deployUpgrade} />}
      {mode === 'scan' && <ScanPanel issues={issues} onReport={reportIssue} />}
      {mode === 'crisis' && (
        <CrisisPanel
          activeCrisis={activeCrisis}
          onActivate={activateCrisis}
          onClear={clearCrisis}
          impact={impact}
        />
      )}

      <div className="stage">
        <div className={`holo ${activeCrisis ? 'crisis' : ''}`}>
          <HologramCity
            markers={markers}
            crisis={crisisForScene}
            layer={activeLayer}
            layerColors={layerColors}
            districtMetrics={districtMetrics}
          />

          <div className="holo-grain" />
          {mode === 'scan' && <div className="holo-sweep" />}

          <span className="holo-corner tl" />
          <span className="holo-corner tr" />
          <span className="holo-corner bl" />
          <span className="holo-corner br" />

          <LayerControl layer={layer} setLayer={setLayer} />

          <div className="stage-tag">
            <span className={`pill ${activeCrisis ? 'crisis' : ''}`}>{mode.toUpperCase()} ACTIVE</span>
            <span className="pill live">
              <span className="dot" /> {STAGE_STATUS[mode]}
            </span>
          </div>

          {activeCrisis && <div className="crisis-banner">⚠ CRISIS ACTIVE</div>}

          {activeLayer.type === 'data' ? (
            <div className="gradient-legend">
              <span className="gl-title">{activeLayer.icon} {activeLayer.name}</span>
              <span className="gl-low">{activeLayer.low}</span>
              <span className="gl-bar" style={{ background: GRADIENT_CSS }} />
              <span className="gl-high">{activeLayer.high}</span>
            </div>
          ) : (
            <div className="district-legend">
              {DISTRICT_ORDER.map((d) => (
                <span className="leg" key={d}>
                  <span className="sw" style={{ background: DISTRICTS[d].color, color: DISTRICTS[d].color }} />
                  {DISTRICTS[d].name.split(' ')[0]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <AIAssistantPanel ai={ai} />

      <CityStats stats={stats} />

      {/* toasts */}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast ${t.kind}`} key={t.id}>
            <span className="t-ico">
              {t.kind === 'crisis' ? '⚠' : t.kind === 'good' ? '✓' : 'ℹ'}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
