# Orbital Lab

An interactive 2D N-body simulator built with Nuxt and Vue.

## Requirements

- Node.js `22.19+` (or `24.11+`)
- npm

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3153`.

## Deploy to a Node host

Run these commands on the host or in the host’s build pipeline:

```bash
npm ci
npm run build
NODE_ENV=production HOST=0.0.0.0 PORT=3153 npm start
```

The `start` script launches Nuxt’s production server from `.output/server/index.mjs`. Hosting platforms that provide a `PORT` variable will be picked up automatically. If the host uses PowerShell, set the variables before starting:

```powershell
$env:NODE_ENV = "production"
$env:HOST = "0.0.0.0"
$env:PORT = "3153"
npm start
```

Only the generated `.output` directory is needed at runtime after the build completes. Place a reverse proxy or load balancer in front of port `3153` when exposing the app publicly.

## Static hosting

For a host that serves static files only:

```bash
npm ci
npm run generate
```

Serve `.output/public` with the host’s static web server.

## Keyboard controls

- `Space` toggles run and pause.
- `+` and `-` increase or decrease the simulation speed.
- `Enter` toggles the expanded canvas view.

Shortcuts are disabled while an input, link, or button has focus.

## Mission replays

Select **Voyager 1 & 2** or **Galileo: Journey to Jupiter** in the preset list
to plot NASA/JPL Horizons trajectories. Use the mission date slider or milestone
buttons to explore the path. Galileo includes its Venus and Earth gravity
assists, the Gaspra and Ida asteroid encounters, and the atmospheric probe’s
independent path after release. Right-drag to pan, scroll to zoom, and use
**Recenter** to restore the default center.

See [trajectory data notes](app/data/README.md) for sources, sampling, and the
distinction between tracking data and predicted trajectories.

The preset list also includes **Cassini: Grand Finale**, **Rosetta: Comet
Rendezvous**, **Apollo 11: First Moon Landing**, **James Webb: Around L2**, **Binary
Stars**, and **Figure Eight**. Mission view buttons switch between overviews
and close-ups. Binary Stars has relative-mass sliders. Apollo 11 is explicitly
labeled as an educational reconstruction based on NASA's mission report;
it ends at Earth entry, before atmospheric descent.

Run `node scripts/test-presets.mjs` to validate these six presets.

## Project structure

- `app/app.vue` assembles the laboratory layout and connects components to the controller.
- `app/components/` contains the mission timeline, inspector, transport controls, and system configurator.
- `app/composables/useLaboratory.ts` coordinates preset selection, playback, user configuration, and the animation lifecycle. `useCamera.ts` owns zoom, panning, and pointer capture.
- `app/physics/` contains shared types, vector operations, and the standalone gravity engine. The engine accepts simulation state directly and does not depend on Vue or mission datasets.
- `app/presets/` contains the catalog and initial-condition factories. Binary masses are factory parameters rather than shared reactive state.
- `app/missions/` contains one definition per mission, the replay contract, and the common body builder. Voyager's departure availability is preserved when seeking.
- `app/rendering/` draws explicit scene snapshots and provides the shared screen projection and Saturn ring geometry.
- `app/utils/` contains ephemeris interpolation, replay construction, date conversion, units, and display formatting. Projected tracks are cached on demand and shared by views using the same projection. Mission JSON datasets are still imported eagerly.
- `app/assets/laboratory.css` supplies the shared theme and responsive layout.
- `scripts/horizons.mjs` handles Horizons requests, vector parsing, and merging coarse and fine samples. Fetch scripts retain their original time standards, precision, encounter sampling, and endpoint choices.

## Validation

```bash
npm test
npm run typecheck
npm run build
```

The tests exercise the pure physics engine, replay availability and projections,
Horizons options without network calls, mission geometry, playback, canvas drawing,
and camera interactions. Integration tests construct `useLaboratory` with lifecycle
registration disabled; they do not extract code from Vue component source.
