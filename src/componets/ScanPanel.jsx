import { ISSUE_TYPES } from '../data/cityData.js';

export default function ScanPanel({ issues, onReport }) {
  const filedTypes = new Set(issues.map((i) => i.typeId));

  const handleUpload = () => {
    // Simulated "AI auto-detect": pick the first unreported issue type.
    const next = ISSUE_TYPES.find((t) => !filedTypes.has(t.id));
    if (next) onReport(next.id);
  };

  return (
    <section className="panel glass" aria-label="Scan mode">
      <div className="panel-head">
        <h2>Citizen Reports</h2>
        <p>Analyze and integrate field reports into the twin</p>
      </div>

      <div className="panel-scroll">
        <button className="dropzone" onClick={handleUpload} aria-label="Upload a photo to auto-detect an issue">
          <div className="dz-ico">📷</div>
          <div className="dz-main">Drop photo or click to upload</div>
          <div className="dz-sub">AI will auto-detect issue type and location</div>
        </button>

        <div className="section-label">Detected Issues</div>

        {ISSUE_TYPES.map((t) => {
          const filed = filedTypes.has(t.id);
          return (
            <button
              className="opt-card"
              key={t.id}
              onClick={() => !filed && onReport(t.id)}
              disabled={filed}
              style={{ textAlign: 'left', width: '100%', cursor: filed ? 'default' : 'pointer' }}
              aria-label={`Report ${t.name}`}
            >
              <div className="opt-top">
                <span className="opt-ico">{t.icon}</span>
                <div>
                  <div className="opt-name">
                    {t.name}{' '}
                    {filed && <span style={{ color: 'var(--green)', fontSize: 11 }}>✓ Filed</span>}
                  </div>
                  <div className="opt-sub">📍 {t.location}</div>
                </div>
                <div className="opt-cta">
                  <span className={`badge ${t.urgency.toLowerCase()}`}>{t.urgency}</span>
                </div>
              </div>

              {filed && (
                <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.5 }}>
                  <div style={{ color: 'var(--text-1)' }}>
                    <b style={{ color: 'var(--cyan)' }}>Suggested fix:</b> {t.suggestedFix}
                  </div>
                  <div style={{ color: 'var(--text-2)', marginTop: 4 }}>
                    <b style={{ color: 'var(--amber)' }}>Why it matters:</b> {t.whyItMatters}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
