export default function Header({ onRunScenario, scenarioRunning }) {
  return (
    <header className="header glass">
      <div className="brand">
        <div className="brand-logo">📡</div>
        <div className="brand-text">
          <h1>PULSE CITY</h1>
          <p>Predictive Urban Lifeline &amp; Simulation Engine</p>
        </div>
      </div>

      <div className="header-chips">
        <span className="chip online">
          <span className="dot" /> Digital Twin Online
        </span>
        <span className="chip muted">👥 2.4M</span>
        <span className="chip muted">🏙 4 Districts</span>
        <span className="chip muted">📶 12,847 Sensors</span>
      </div>

      <div className="header-spacer" />

      <button
        className="run-btn"
        onClick={onRunScenario}
        disabled={scenarioRunning}
        aria-label="Run an automated city demo scenario"
      >
        {scenarioRunning ? '⏳ Running Scenario…' : '▶ Run City Scenario'}
      </button>
    </header>
  );
}
