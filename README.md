# Orbital Lab

An interactive 2D N-body simulator built with Nuxt and Vue.

## Requirements

- Node.js `24.11+` within the Node 24 release line (also used by Vercel)
- npm

## Local development

```bash
npm ci
npm run dev
```

Open the URL printed by Nuxt, normally `http://localhost:3000`.

## Deploy to Vercel

Orbital Lab is a static browser application. Nuxt generates HTML, CSS, and
JavaScript at build time; Vercel serves those files through its CDN. Physics,
canvas rendering, playback, and custom systems run in each visitor's browser.
There are no runtime functions, database services, or server processes to configure.

1. Push this repository to your Git provider and import it as a Vercel project.
2. Set the Root Directory to the directory containing `package.json` and `vercel.json`.
3. Deploy. The checked-in `vercel.json` supplies these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Nuxt.js |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `.output/public` |
| Node.js Version | 24.x, constrained by `package.json` |
| Environment Variables | None required |

For an existing Vercel project, remove any old build/output overrides and
`NITRO_PRESET`, `HOST`, or `PORT` environment variables from the previous hosting
setup. Use the repository settings above. Vercel builds and deploys new commits;
branch deployments provide preview URLs before changes reach production.

Mission modules and their bundled trajectory data download only when selected;
speculative chunk prefetching is disabled while startup preloads are retained.
Successful loads are reused within the session. Vercel gives the content-hashed
`/_nuxt/` assets a one-year immutable browser cache; the unversioned build manifest
is explicitly revalidated. HTML uses Vercel's default caching so a new visit can
pick up a deployment's current asset filenames. If a long-open tab cannot load a
mission after a deployment, refreshing gets the current version.

The app currently has one URL (`/`). No catch-all rewrite is needed; missing
assets and unknown paths retain HTTP 404 responses. Add route handling deliberately
if client-side pages are introduced later.

The browser owns all session state, which resets on refresh. The committed mission
datasets are available without runtime NASA/JPL requests or API keys. Updating them
is an explicit maintenance task using the scripts in `scripts/`, followed by a
commit and redeployment. Fetch scripts are not part of installation or deployment.

This setup follows [Vercel's static Nuxt deployment guidance](https://vercel.com/docs/frameworks/full-stack/nuxt#static-rendering)
and [Nuxt's client-side rendering guidance](https://nuxt.com/docs/4.x/getting-started/deployment#client-side-only-rendering).

## Preview a production build

```bash
npm ci
npm run build
npm run preview
```

Open the URL printed by the preview command. `npm run generate` is an alias for
the same static build. The output can also be served by any static host from
`.output/public`. The former `npm start` Node server and reverse proxy setup are
no longer used.

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
- `app/presets/` contains the catalog, lazy mission loaders, and initial-condition factories. Binary masses are factory parameters rather than shared reactive state.
- `app/missions/` contains one definition per mission, the replay contract, and the common body builder. Voyager's departure availability is preserved when seeking.
- `app/rendering/` draws explicit scene snapshots and provides the shared screen projection and Saturn ring geometry.
- `app/utils/` contains ephemeris interpolation, replay construction, date conversion, units, and display formatting. Projected tracks are cached on demand and shared by views using the same projection. Mission JSON datasets are bundled into their respective lazy mission chunks.
- `app/assets/laboratory.css` supplies the shared theme and responsive layout.
- `scripts/horizons.mjs` handles Horizons requests, vector parsing, and merging coarse and fine samples. Fetch scripts retain their original time standards, precision, encounter sampling, and endpoint choices.

## Validation

```bash
npm test
npm run typecheck
npm run build
npm run test:deployment
```

The tests exercise the pure physics engine, replay availability and projections,
Horizons options without network calls, mission geometry, playback, canvas drawing,
and camera interactions, plus lazy loading, selection races, caching, and download
failure recovery. Integration tests construct `useLaboratory` with lifecycle
registration disabled; they do not extract code from Vue component source.
The deployment check runs against the built output to verify static files, the
absence of a runtime server and speculative downloads, and a 300 kB startup
JavaScript budget (before compression).
