import { CRISIS_TYPES, DISTRICTS } from '../data/cityData.js';
import { severityLabel } from '../utils/scoring.js';

export default function CrisisPanel({ activeCrisis, onActivate, onClear, impact }) {
  const crisis = CRISIS_TYPES.find((c) => c.id === activeCrisis);

  return (
    <section className="panel glass" aria-label="Crisis mode">
      <div className="panel-head">
        <h2>Emergency Command</h2>
        <p>Select crisis type to activate response protocol</p>
      </div>

      <div className="crisis-grid">
        {CRISIS_TYPES.map((c) => (
          <button
            key={c.id}
            className={`crisis-chip ${activeCrisis === c.id ? 'active' : ''}`}
            onClick={() => onActivate(c.id)}
            aria-pressed={activeCrisis === c.id}
            aria-label={`Activate ${c.name} scenario`}
          >
            <span className="c-ico">{c.icon}</span>
            {c.name}
          </button>
        ))}
      </div>

      <div className="panel-scroll" style={{ marginTop: 12 }}>
        {!crisis && (
          <div className="crisis-empty">
            <div>
              <div className="ce-ico">🛡️</div>
              <p>Select a crisis type to activate the emergency protocol.</p>
            </div>
          </div>
        )}

        {crisis && impact && (
          <>
            <div className="opt-card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
              <div className="opt-top">
                <span className="opt-ico" style={{ background: 'rgba(239,68,68,0.12)' }}>
                  {crisis.icon}
                </span>
                <div>
                  <div className="opt-name">{crisis.name}</div>
                  <div className="opt-sub">📍 {DISTRICTS[crisis.district].name}</div>
                </div>
                <div className="opt-cta">
                  <span className={`badge ${impact.severity >= 60 ? 'critical' : 'high'}`}>
                    {severityLabel(impact.severity)}
                  </span>
                </div>
              </div>
              <div className="stat-bar" style={{ marginTop: 12 }}>
                <i
                  style={{
                    width: `${impact.severity}%`,
                    background: crisis.color,
                    boxShadow: `0 0 10px ${crisis.color}`,
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>
                Projected severity {impact.severity}/100
                {impact.aggravators.length > 0 && (
                  <span style={{ color: '#ff8a8a' }}>
                    {' '}· {impact.aggravators.length} amplifying report(s)
                  </span>
                )}
                {impact.mitigators.length > 0 && (
                  <span style={{ color: 'var(--green)' }}>
                    {' '}· {impact.mitigators.length} mitigation(s) active
                  </span>
                )}
              </div>
            </div>

            <div className="section-label">Recommended Actions</div>
            <ul className="action-list">
              {crisis.actions.map((a, i) => (
                <li key={a} style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="num">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ul>

            <button
              className="deploy-btn"
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              onClick={onClear}
              aria-label="Stand down the active crisis"
            >
              ✕ Stand Down
            </button>
          </>
        )}
      </div>
    </section>
  );
}
