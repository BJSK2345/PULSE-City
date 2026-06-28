# PULSE City

### Predictive Urban Lifeline & Simulation Engine

> **A digital twin that helps cities see, fix, and survive problems before they become disasters.**

PULSE City is a futuristic, holographic **digital-twin command center** for a city. It lets you
**design** better infrastructure before building it, **report & analyze** civic problems, and
**respond** to emergencies like floods, heat waves, blackouts, and gridlock — all on a live 3D
hologram of the city. Think _Google Maps + SimCity + an Iron-Man hologram table + an emergency
command center_, while staying genuinely understandable.

> ⚠️ **Prototype / demo.** PULSE City runs entirely on **mock, simulated city data**. It does not
> connect to any real government, sensor, or emergency system, and makes no claims of real-world
> accuracy.

---

## ✨ Features

- **🛰️ Holographic 3D city** — a large metropolis across four neon-lit districts: downtown glass
  **towers**, **mid-rise** blocks, residential **houses**, and labelled landmarks (**schools**, a
  **hospital**, **city hall**, **parks**) — on a glowing infinite grid with a river/flood corridor,
  drifting particles, fog depth, an auto-rotating camera, and zoom/orbit controls (React Three
  Fiber + Three.js).
- **🗺️ Selectable map layers** — switch the city between **Standard**, **Roads** (named streets +
  landmarks), **Traffic**, **Safety**, **Air Quality**, **Heat**, and **Flood Risk**. Data layers
  recolour every district on a **green → yellow → red** gradient (low → high), with a live legend and
  per-district value chips. The layers are *live*: your reports, upgrades, and active crisis shift
  the gradients in real time.
- **🏗️ Build Mode** — deploy infrastructure upgrades (Solar Roof Network, Green Roofs, Flood
  Barrier, Smart Streetlights, and more). Each costs budget, changes the city's vitals, drops a
  glowing marker on the twin, and is explained by the AI.
- **📡 Scan Mode** — file citizen reports (blocked drains, road damage, power outages…). Each report
  is classified with an urgency, mapped onto the city, and shown with a suggested fix and why it
  matters.
- **⚠️ Crisis Mode** — trigger emergencies (Flash Flood, Heat Wave, Blackout, Traffic Gridlock,
  Storm Damage). Risk zones glow over the affected district and the AI issues a response plan.
- **🔗 Actions ripple across modes** — _this is the core idea._ A report filed in Scan Mode
  **amplifies** a related future crisis, and an upgrade from Build Mode **mitigates** it. Report a
  **Blocked Drain**, then launch a **Flash Flood**, and the twin warns you that flood risk is
  elevated in the South District — but a deployed **Flood Barrier** measurably reduces the impact.
- **📊 Live city vitals** — animated count-up stat cards for Traffic, Pollution, Heat Risk, Safety,
  Emergency Readiness, Budget, and Citizen Trust.
- **🤖 AI assistant panel** — mock, on-device-style narration with recommended actions, risk
  insights, confidence/impact metrics, and a live data stream (no API key required).
- **▶ Run City Scenario** — a one-click guided demo that walks judges through the whole story:
  Scan → Build → Crisis.

---

## 🧱 Tech stack

- **React 18** + **Vite 5**
- **Three.js** via **@react-three/fiber** and **@react-three/drei** for the 3D hologram
- Plain, organized **CSS** (design tokens + layout + hologram layers) — no UI framework
- **No backend** — everything runs client-side on mock data

---

## 🚀 Local setup

```bash
# from the project root
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

Requires Node 18+ (built and tested on Node 20/24).

---

## ▲ Deploy to Vercel

This is a standard Vite app, so Vercel auto-detects everything:

1. Push the project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel, **Add New → Project** and import the repo.
3. Confirm the framework preset is **Vite** with:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Click **Deploy**.

No environment variables are required for the MVP.

> If you later add real integrations, copy **`.env.example`** to **`.env`** (git-ignored) and use
> the `VITE_` prefix for any client-exposed variables. Never commit real secrets.

---

## 🗂️ Project structure

```
src/
  App.jsx                 # app shell, state, and the demo scenario
  main.jsx                # React entry point
  data/
    cityData.js           # mock districts, skyline, upgrades, issues, crises
  components/
    Header.jsx            # title bar, status chips, "Run City Scenario"
    ModeSwitcher.jsx      # Build / Scan / Crisis rail + system status
    BuildPanel.jsx        # infrastructure upgrades
    ScanPanel.jsx         # citizen issue reports
    CrisisPanel.jsx       # emergency command + recommended actions
    HologramCity.jsx      # the React Three Fiber 3D city
    LayerControl.jsx      # map-layer switcher (roads / traffic / safety / …)
    IssueMarkers.jsx      # maps city state -> 3D markers
    CityStats.jsx         # animated bottom stat cards
    AIAssistantPanel.jsx  # AI narration + live data stream
  utils/
    scoring.js            # city scoring, crisis impact, AI message logic
    layers.js             # per-district metrics + green->yellow->red gradient
  styles/
    global.css            # tokens, reset, animations
    layout.css            # command-center grid + panels
    hologram.css          # 3D stage overlays
```

---

## 📝 A note on the mock data

All numbers, districts, sensor counts, "live" feeds, and AI narration are **fabricated for
demonstration**. The scoring model is a deliberately simple, transparent simulation so the
cause-and-effect between reports, upgrades, and crises is easy to follow — not a validated
emergency-planning tool.

---

## 🔮 Future improvements

- Real data feeds (weather, traffic, open-city APIs) behind `VITE_`-prefixed config.
- Photo upload with on-device image classification for real issue auto-detection.
- Persisted city state + multiple saved scenarios.
- Per-building drill-down and historical playback / time-lapse.
- Multi-user "war room" mode with shared state.
- Accessibility pass: full keyboard navigation of the 3D scene and screen-reader summaries.

---

_Built as a hackathon prototype. Not affiliated with any real city or agency._
