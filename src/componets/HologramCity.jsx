import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Edges, Sparkles, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_BUILDINGS, DISTRICTS, RIVER, LANDMARKS, ROADS } from '../data/cityData.js';

// Shared "lit windows" emissive texture so towers read as real glass buildings.
function useWindowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#03060f';
    ctx.fillRect(0, 0, c.width, c.height);
    const cols = 8;
    const rows = 18;
    const pw = c.width / cols;
    const ph = c.height / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const lit = Math.random();
        let v;
        if (lit > 0.78) v = 200 + Math.floor(lit * 55);
        else if (lit > 0.5) v = 90 + Math.floor(lit * 70);
        else v = 34 + Math.floor(lit * 30);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x * pw + 1.6, y * ph + 2, pw - 3.2, ph - 4);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.7);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

function lighten(hex, amt = 0.35) {
  return new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), amt);
}

// --- towers + mid-rise blocks ------------------------------------------------
function Tower({ b, windows, color, tinted }) {
  const emissive = lighten(color, tinted ? 0.25 : 0.45);
  const topH = b.tiered ? b.height * 0.32 : 0;
  const trunkH = b.height - topH;

  return (
    <group position={[b.position[0], 0, b.position[1]]}>
      <mesh position={[0, trunkH / 2, 0]}>
        <boxGeometry args={[b.width, trunkH, b.depth]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveMap={windows}
          emissiveIntensity={tinted ? 0.95 : 0.65}
          metalness={0.55}
          roughness={0.34}
        />
        {b.type === 'tower' && <Edges color={lighten(color, 0.55)} threshold={15} />}
      </mesh>

      {b.tiered && (
        <mesh position={[0, trunkH + topH / 2, 0]}>
          <boxGeometry args={[b.width * 0.6, topH, b.depth * 0.6]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={tinted ? 1 : 0.9}
            metalness={0.4}
            roughness={0.4}
          />
          <Edges color={lighten(color, 0.6)} />
        </mesh>
      )}

      {b.height > 13 && (
        <mesh position={[0, b.height + 0.6, 0]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      )}
    </group>
  );
}

// --- residential houses (low boxes with pitched roofs) -----------------------
function House({ b, color, tinted }) {
  const body = tinted ? color : '#cdb496';
  const roof = tinted ? lighten(color, 0.15) : '#6f4d36';
  const w = b.width;
  const d = b.depth;
  return (
    <group position={[b.position[0], 0, b.position[1]]}>
      <mesh position={[0, b.height / 2, 0]}>
        <boxGeometry args={[w, b.height, d]} />
        <meshStandardMaterial
          color={body}
          emissive={tinted ? lighten(color, 0.1) : '#1a1408'}
          emissiveIntensity={tinted ? 0.6 : 0.18}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* pitched roof */}
      <mesh position={[0, b.height + w * 0.32, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[w * 0.78, w * 0.64, 4]} />
        <meshStandardMaterial color={roof} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  );
}

// --- civic landmarks: schools / hospital / city hall / parks -----------------
function Landmark({ lm, showLabel }) {
  const [x, z] = lm.position;

  if (lm.type === 'park') {
    return (
      <group position={[x, 0, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <circleGeometry args={[3.4, 32]} />
          <meshStandardMaterial color="#1f6b3a" emissive="#0f3d22" emissiveIntensity={0.4} roughness={1} />
        </mesh>
        {[
          [-1.4, -0.8],
          [1.2, 0.4],
          [0, 1.6],
          [1.6, -1.4],
        ].map(([tx, tz], i) => (
          <group key={i} position={[tx, 0, tz]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.09, 0.12, 1, 6]} />
              <meshStandardMaterial color="#5b3b25" roughness={1} />
            </mesh>
            <mesh position={[0, 1.3, 0]}>
              <coneGeometry args={[0.55, 1.2, 7]} />
              <meshStandardMaterial color="#2fae5a" emissive="#154f2a" emissiveIntensity={0.25} roughness={0.9} />
            </mesh>
          </group>
        ))}
        {showLabel && <LandmarkLabel position={[0, 3, 0]} icon="🌳" text={lm.label} />}
      </group>
    );
  }

  // building-style landmarks
  const cfg = {
    school: { color: '#e7d6a3', emissive: '#7a6326', w: 5.5, h: 3.2, d: 3.6, icon: '🏫' },
    hospital: { color: '#e6eef8', emissive: '#5a86b8', w: 4.4, h: 4.6, d: 4.4, icon: '🏥' },
    civic: { color: '#cdd8ec', emissive: '#6b78a0', w: 5, h: 3.8, d: 4.2, icon: '🏛️' },
  }[lm.type];

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, cfg.h / 2, 0]}>
        <boxGeometry args={[cfg.w, cfg.h, cfg.d]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={0.35}
          metalness={0.2}
          roughness={0.55}
        />
        <Edges color={lighten(cfg.color, 0.2)} />
      </mesh>

      {lm.type === 'hospital' && (
        <group position={[0, cfg.h + 0.2, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.4, 0.4]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 1.6]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
        </group>
      )}

      {lm.type === 'civic' && (
        <mesh position={[0, cfg.h + 0.1, 0]}>
          <sphereGeometry args={[1.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#caa84e" emissive="#7a6324" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {lm.type === 'school' && (
        <group position={[cfg.w / 2 - 0.3, cfg.h, 0]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0.45, 1.5, 0]}>
            <boxGeometry args={[0.9, 0.5, 0.04]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
        </group>
      )}

      {showLabel && <LandmarkLabel position={[0, cfg.h + 2, 0]} icon={cfg.icon} text={lm.label} />}
    </group>
  );
}

function LandmarkLabel({ position, icon, text }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
      <div className="map-label landmark">
        <span>{icon}</span> {text}
      </div>
    </Html>
  );
}

function River() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RIVER.position[0], 0.04, RIVER.position[1]]}>
      <planeGeometry args={[RIVER.width, RIVER.depth]} />
      <meshStandardMaterial
        color="#0a2a4a"
        emissive="#1d6fb8"
        emissiveIntensity={0.6}
        transparent
        opacity={0.6}
        metalness={0.8}
        roughness={0.15}
      />
    </mesh>
  );
}

// --- glowing marker for a reported issue / deployed upgrade -------------------
function Marker({ position, color, kind }) {
  const ref = useRef();
  const ringRef = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 2 + phase;
    if (ref.current) {
      ref.current.position.y = 6.4 + Math.sin(t) * 0.4;
      ref.current.scale.setScalar(1 + Math.sin(t) * 0.12);
    }
    if (ringRef.current) {
      const r = (state.clock.elapsedTime % 2) / 2;
      ringRef.current.scale.setScalar(1 + r * 2.4);
      ringRef.current.material.opacity = 0.5 * (1 - r);
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 6.4, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <mesh ref={ref} position={[0, 6.4, 0]}>
        <sphereGeometry args={[kind === 'issue' ? 0.45 : 0.38, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CrisisZone({ center, color, severity }) {
  const ref = useRef();
  const discRef = useRef();
  const radius = 13 + (severity / 100) * 5;
  useFrame((state) => {
    const t = state.clock.elapsedTime * 1.6;
    if (ref.current) {
      ref.current.material.opacity = 0.12 + (Math.sin(t) * 0.5 + 0.5) * 0.14;
      ref.current.scale.setScalar(1 + Math.sin(t) * 0.02);
    }
    if (discRef.current) discRef.current.material.opacity = 0.18 + (Math.sin(t + 1) * 0.5 + 0.5) * 0.16;
  });
  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ref} position={[0, 0.1, 0]}>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// --- data-layer ground tint + value chip per district ------------------------
function DistrictOverlay({ district, color, value, label }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.material.opacity = 0.2 + (Math.sin(state.clock.elapsedTime * 1.2) * 0.5 + 0.5) * 0.12;
  });
  const [cx, cz] = DISTRICTS[district].center;
  return (
    <group position={[cx, 0, cz]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.26} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 23, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
        <div className="map-chip" style={{ borderColor: color, color }}>
          <b>{label}</b>
          <span style={{ background: color }}>{value}</span>
        </div>
      </Html>
    </group>
  );
}

function CityScene({ markers, crisis, layer, layerColors, districtMetrics }) {
  const windows = useWindowTexture();
  const affected = crisis?.district ?? null;
  const isData = layer?.type === 'data';
  const isRoads = layer?.type === 'roads';
  const showPlaces = layer?.type === 'standard' || isRoads;

  const colorFor = (district, base) => {
    if (isData && layerColors) return layerColors[district];
    if (affected === district) return crisis.zoneColor;
    return base;
  };

  return (
    <>
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', 62, 175]} />

      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#9ad8ff', '#0a1430', 0.6]} />
      <directionalLight position={[34, 48, 24]} intensity={0.8} color="#bfe6ff" />
      <pointLight position={[-26, 22, -14]} intensity={140} distance={120} color="#8b5cf6" />
      <pointLight position={[26, 20, 22]} intensity={110} distance={110} color="#22d3ee" />

      <Grid
        args={[200, 200]}
        cellSize={2.6}
        cellThickness={0.6}
        cellColor="#0f3a5e"
        sectionSize={13}
        sectionThickness={1.1}
        sectionColor="#2aa8df"
        fadeDistance={165}
        fadeStrength={1.4}
        infiniteGrid
      />

      <River />

      {CITY_BUILDINGS.map((b) => {
        const base = DISTRICTS[b.district].color;
        const color = colorFor(b.district, base);
        const tinted = isData || affected === b.district;
        return b.type === 'house' ? (
          <House key={b.id} b={b} color={color} tinted={tinted} />
        ) : (
          <Tower key={b.id} b={b} windows={windows} color={color} tinted={tinted} />
        );
      })}

      {LANDMARKS.map((lm) => (
        <Landmark key={lm.id} lm={lm} showLabel={showPlaces} />
      ))}

      {/* roads layer */}
      {isRoads &&
        ROADS.map((r) => (
          <group key={r.id}>
            <Line
              points={[
                [r.a[0], 0.16, r.a[1]],
                [r.b[0], 0.16, r.b[1]],
              ]}
              color="#5fd0ff"
              lineWidth={2.4}
              transparent
              opacity={0.85}
            />
            <Html
              position={[(r.a[0] + r.b[0]) / 2, 0.6, (r.a[1] + r.b[1]) / 2]}
              center
              style={{ pointerEvents: 'none' }}
              zIndexRange={[20, 0]}
            >
              <div className="map-label road">{r.name}</div>
            </Html>
          </group>
        ))}

      {/* data layer overlays */}
      {isData &&
        layerColors &&
        ['north', 'south', 'east', 'west'].map((d) => (
          <DistrictOverlay
            key={d}
            district={d}
            color={layerColors[d]}
            value={districtMetrics[d][layer.metric]}
            label={DISTRICTS[d].name.split(' ')[0]}
          />
        ))}

      {markers.map((m) => (
        <Marker key={m.key} position={[m.position[0], 0, m.position[1]]} color={m.color} kind={m.kind} />
      ))}

      {crisis && (
        <CrisisZone center={DISTRICTS[crisis.district].center} color={crisis.zoneColor} severity={crisis.severity} />
      )}

      <Sparkles count={70} scale={[120, 32, 120]} size={2.4} speed={0.3} color="#7fd6ff" opacity={0.5} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.4}
        enablePan={false}
        enableZoom
        minDistance={42}
        maxDistance={155}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 7, 0]}
      />
    </>
  );
}

export default function HologramCity({ markers = [], crisis = null, layer = null, layerColors = null, districtMetrics = null }) {
  // Force R3F to (re)measure once layout has settled — guards against the
  // canvas mounting at its default 300x150 before the grid container sizes.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event('resize'));
    const r = requestAnimationFrame(fire);
    const t1 = setTimeout(fire, 150);
    const t2 = setTimeout(fire, 400);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <Canvas
      className="holo-canvas"
      dpr={[1, 1.5]}
      resize={{ debounce: 0 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [66, 54, 74], fov: 38, near: 0.1, far: 500 }}
    >
      <Suspense fallback={null}>
        <CityScene
          markers={markers}
          crisis={crisis}
          layer={layer}
          layerColors={layerColors}
          districtMetrics={districtMetrics}
        />
      </Suspense>
    </Canvas>
  );
}
