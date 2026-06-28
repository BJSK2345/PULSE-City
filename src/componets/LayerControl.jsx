import { MAP_LAYERS } from '../data/cityData.js';

// Floating map-layer switcher docked on the 3D stage.
export default function LayerControl({ layer, setLayer }) {
  return (
    <div className="layer-control glass" aria-label="Map layers">
      <div className="eyebrow">Map Layers</div>
      {MAP_LAYERS.map((l) => (
        <button
          key={l.id}
          className={`layer-btn ${layer === l.id ? 'active' : ''}`}
          onClick={() => setLayer(l.id)}
          title={l.desc}
          aria-pressed={layer === l.id}
        >
          <span className="lc-ico" aria-hidden="true">
            {l.icon}
          </span>
          <span className="lc-name">{l.name}</span>
        </button>
      ))}
    </div>
  );
}
