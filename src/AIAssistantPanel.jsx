// Renders the AURA-style assistant: narration + confidence/impact + live feed.
function StreamLine({ time, line }) {
  // highlight trailing status tokens
  const parts = line.split(/(LOW|HIGH|CRIT|OK)$/);
  return (
    <div className="stream-line">
      <span className="ts">[{time}]</span>{' '}
      {parts.map((p, i) => {
        if (p === 'HIGH' || p === 'CRIT') return <span key={i} className="hi">{p}</span>;
        if (p === 'OK') return <span key={i} className="ok">{p}</span>;
        if (p === 'LOW') return <span key={i} className="hi" style={{ color: 'var(--amber)' }}>{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </div>
  );
}

export default function AIAssistantPanel({ ai }) {
  const impactClass = `impact-${ai.impactKind}`;
  const confColor =
    ai.confidence >= 90 ? 'var(--green)' : ai.confidence >= 80 ? 'var(--cyan)' : 'var(--amber)';

  return (
    <aside className="ai glass" aria-label="PULSE AI assistant">
      <div className="ai-head">
        <div className="ai-avatar">🛰️</div>
        <div>
          <h3>PULSE Assistant</h3>
          <p>{ai.subtitle}</p>
        </div>
      </div>

      <div className="ai-body">
        <div className="ai-card rec" key={`rec-${ai.title}`}>
          <div className="label">◎ Recommended Action</div>
          <p>{ai.recommendation}</p>
        </div>

        <div className="ai-card risk">
          <div className="label">⚠ Risk Insight</div>
          <p>{ai.riskInsight}</p>
        </div>

        <div className="metric-row">
          <div className="metric">
            <div className="eyebrow">Confidence</div>
            <div className="big" style={{ color: confColor }}>
              {ai.confidence}%
            </div>
            <div className="bar">
              <i style={{ width: `${ai.confidence}%`, background: confColor }} />
            </div>
          </div>
          <div className="metric">
            <div className="eyebrow">Impact</div>
            <div className={`big ${impactClass}`}>{ai.impact}</div>
            <div className="bar">
              <i
                style={{
                  width: ai.impactKind === 'critical' ? '100%' : ai.impactKind === 'high' ? '72%' : '45%',
                  background: 'currentColor',
                }}
                className={impactClass}
              />
            </div>
          </div>
        </div>

        <div className="stream">
          <div className="label">▤ Live Data Stream</div>
          {ai.stream.map((s, i) => (
            <StreamLine key={i} time={s.time} line={s.line} />
          ))}
        </div>
      </div>
    </aside>
  );
}
