import { UPGRADES, DISTRICTS } from '../data/cityData.js';

export default function BuildPanel({ upgrades, onDeploy }) {
  return (
    <section className="panel glass" aria-label="Build mode">
      <div className="panel-head">
        <h2>Infrastructure Deploy</h2>
        <p>Select upgrades to simulate in the digital twin</p>
      </div>

      <div className="panel-scroll">
        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Available Upgrades</span>
          <span className="count-pill">{upgrades.length} deployed</span>
        </div>

        {UPGRADES.map((u) => {
          const deployed = upgrades.includes(u.id);
          const districtName =
            u.district === 'all' ? 'All Districts' : DISTRICTS[u.district]?.name || u.district;
          return (
            <div className="opt-card" key={u.id}>
              <div className="opt-top">
                <span className="opt-ico">{u.icon}</span>
                <div>
                  <div className="opt-name">{u.name}</div>
                  <div className="opt-sub">
                    <b style={{ color: 'var(--cyan)' }}>${u.cost}M</b> · {districtName}
                  </div>
                </div>
                <div className="opt-cta">
                  <button
                    className={`deploy-btn ${deployed ? 'done' : ''}`}
                    onClick={() => onDeploy(u.id)}
                    disabled={deployed}
                    aria-label={`Deploy ${u.name}`}
                  >
                    {deployed ? '✓ Deployed' : 'Deploy'}
                  </button>
                </div>
              </div>
              <div className="tag-row">
                {u.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
