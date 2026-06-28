const MODES = [
  {
    id: 'build',
    icon: '🏗️',
    title: 'Build Mode',
    desc: 'Deploy infrastructure upgrades across districts',
  },
  {
    id: 'scan',
    icon: '📡',
    title: 'Scan Mode',
    desc: 'Analyze citizen reports and detect issues',
  },
  {
    id: 'crisis',
    icon: '⚠️',
    title: 'Crisis Mode',
    desc: 'Emergency command and response control',
  },
];

export default function ModeSwitcher({ mode, setMode }) {
  return (
    <nav className="modes glass" aria-label="Command modes">
      <div className="eyebrow">Command Modes</div>

      {MODES.map((m) => (
        <button
          key={m.id}
          className={`mode-btn ${mode === m.id ? 'active' : ''}`}
          onClick={() => setMode(m.id)}
          aria-pressed={mode === m.id}
        >
          <span className="ico" aria-hidden="true">
            {m.icon}
          </span>
          <span>
            <span className="m-title">{m.title}</span>
            <span className="m-desc">{m.desc}</span>
          </span>
        </button>
      ))}

      <div className="system-status">
        <div className="eyebrow">System Status</div>
        <div className="status-row">
          <span>Uptime</span>
          <b>99.97%</b>
        </div>
        <div className="status-row">
          <span>Latency</span>
          <b>12ms</b>
        </div>
        <div className="status-row">
          <span>Model</span>
          <b>v3.2.1</b>
        </div>
      </div>
    </nav>
  );
}
