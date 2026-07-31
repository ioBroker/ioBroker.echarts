# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`iobroker.echarts` is an ioBroker adapter that lets users build Apache ECharts diagrams. It ships
five independently-built frontend apps plus a Node backend that can render presets to
SVG/PNG/JPG/PDF server-side. Chart configurations are stored as ioBroker objects of type `chart`
("presets").

Requires Node >= 22, js-controller >= 6.0.11. Adapter is a singleton, daemon mode, compact-mode capable.

## Commands

```bash
npm run npm            # install root + ALL sub-apps (sub-apps need `npm i -f`; plain `npm i` is not enough)
npm run build          # full pipeline: widgets → chart → preview → edit → devices → tsc
npm run tsc            # backend only (tsc -p tsconfig.build.json → build/)
npm run lint           # root + src-editor + src-preview only (see "Linting" below)
npm run test:package   # package.json / io-package.json consistency checks
npm run test           # === test:integration — puppeteer GUI test, boots a real js-controller (slow, ~4 min)
```

Individual sub-app builds: `npm run build:chart | build:edit | build:preview | build:widgets | build:devices`.
Each runs the matching `tasks*.js` at the repo root, which does `npm install` if needed →
`buildReact()` → copy artifacts into the shipped folders.

Single test: `npx mocha ./test/testAdapter.gui.js --exit --grep "Check echarts"`.

### Dev servers

Each sub-app has its own `package.json` / `node_modules`:

```bash
cd src-chart && npm run start     # :3000, then open http://localhost:8081/adapter/echarts/tab.html?dev=true
cd src-editor && npm run start    # :3000
cd src-preview && npm run start   # :3000
cd src-widgets && npm run start   # :4173
cd src-devices && npm run start   # :3000
```

Vite proxies `/adapter`, `/files`, `/_socket` etc. to a running ioBroker on :8081 (:8082 for
widgets). `ChartFrame` deliberately renders raw JSON instead of the iframe when
`window.location.port === '3000'`, because the chart app is not reachable at the dev origin.

## Architecture

### Backend (`src/` → `build/`)

`src/main.ts` is the adapter. Its real job is the `sendTo(...)` message API for **server-side
rendering**: it lazily imports `jsdom`, `canvas` and `echarts` (all `optionalDependencies`), stubs
`global.window`/`document`, builds the ECharts option, and returns a base64 data URL. `canvas` is
native and often broken on user systems — `main.ts` tries `npm install --build-from-source` once at
startup and degrades to SVG-only if that fails. Keep that graceful-degradation path intact.

`src/lib/socketSimulator.ts` fakes the browser `Connection` (getState/getHistoryEx/getObject/…)
on top of adapter methods so the *same* `ChartModel` code runs on the server.

### Two generated files — do not edit

`src/lib/ChartModel.ts` and `src/lib/ChartOption.ts` are **copies** written by
`tasksChart.js::copyReactFilesToBackEnd()` from `src-chart/src/Components/`, with import paths
rewritten (`../../../src/types` → `../types`, `Connection` inlined). They are committed but
regenerated on every `npm run build:chart`.

**Edit `src-chart/src/Components/ChartModel.ts` / `ChartOption.ts` and rebuild.** Changes made
directly in `src/lib/` are silently discarded.

### Shared types

`src/types.d.ts` is the single source of truth for `ChartConfig`, `ChartLineConfig`,
`ChartConfigMore`, `Connection`, … Sub-apps import it by relative path (`../../../src/types`),
not via a package. There is no monorepo tooling — the relative paths *are* the linkage.

### The five frontends and where their output lands

| Source | Built by | Output copied to | Role |
|---|---|---|---|
| `src-editor` | `tasksEdit.js` | `admin/` + `admin/tab.html` | Preset editor — the admin tab |
| `src-chart` | `tasksChart.js` | `admin/chart/` + `www/` | The chart renderer itself |
| `src-preview` | `tasksPreview.js` | `admin/preview/` + `www/preview/` | Standalone preview page |
| `src-widgets` | `tasksWidgets.js` | `widgets/echarts/` | vis-2 module-federation widget |
| `src-devices` | `tasksDevices.js` | `admin/dm-widgets/` | ioBroker.devices widget |

`admin/`, `www/` and `widgets/` **are committed to git** (they are in `files` in package.json).
A full build therefore produces a large diff of hashed bundle names — don't run `npm run build`
casually if you only need to verify one sub-app; run that sub-app's `vite build` directly.
`admin/dm-widgets` is the exception: gitignored, built at publish time.

### How the pieces talk

Nothing re-implements chart rendering. The editor, the vis-2 widget and the devices widget all
embed `src-chart`'s output in an **iframe** and pass the preset in:

- **Editor → chart**: iframe posts `'chartReady'`, parent replies with `JSON.stringify(presetData)`
  via `postMessage` (origin-checked). Live preview of unsaved edits.
- **Widgets/devices → chart**: URL query only — `../echarts/index.html?preset=echarts.0.X`.
  Path differs by host: `../echarts/chart/index.html` inside admin, `../echarts/index.html` from
  web/vis. Query flags: `noBG`, `noLoader`, `noedit`, `theme=<ThemeName>` (`auto` = fall back to
  the viewer's own `App.themeName` / `prefers-color-scheme`). All flags are accepted in the query
  string *or* the URL hash.

`src-widgets` and `src-devices` are Module Federation remotes (`@module-federation/vite`) exposing
`./Echarts` / `./Components` + `./translations`; the host (vis-2 / devices) supplies the shared
React & MUI singletons.

## Constraints that will bite you

**`strict: false` is pinned on purpose.** TypeScript 6 defaults `strict` to true; this codebase
predates that and enabling it surfaces ~790 errors (mostly `possibly null`). Every tsconfig that
sets it carries a comment explaining why. Don't "clean up" those lines — enabling strict is a
separate, deliberate refactor. Only `noImplicitAny` is on.

**`src-widgets` stays on React 18 / MUI 6 / `@iobroker/adapter-react-v5`** while the backend,
`src-chart`, `src-editor`, `src-preview` and `src-devices` are on React 19 / MUI 9 /
`@iobroker/gui-components`. The vis-2 host provides React 18 as a federation singleton, so the
widget bundle must match it. Never bump React/MUI in `src-widgets` as part of a repo-wide upgrade.

**`src-chart`, `src-editor` and `src-preview` do not declare `@mui/material`,
`@mui/icons-material` or `@iobroker/gui-components`.** They resolve them from the **root**
`node_modules` by Node's directory walk. Changing a UI dependency in the root `package.json`
silently changes all three. Watch for a hoisted transitive `@types/react: "*"` shadowing the root
copy in a sub-app — pin `@types/react` explicitly in that sub-app if components start failing with
TS2786.

**echarts type imports need `with { 'resolution-mode': 'import' }`** in `ChartOption.ts`. The
backend resolves modules as `Node16` (CommonJS) and would otherwise pick echarts' `.d.cts`
declarations while `src-chart` (Bundler resolution) picks `.d.ts` — two unrelated type identities
for the same names. The attribute is valid under both, so it lives in the shared source.

`baseUrl` is deprecated in TS 6 / removed in TS 7 and has been dropped from all tsconfigs; `paths`
works without it. `moduleResolution: node` (node10) is likewise gone — the backend uses `Node16`.

## Conventions

- Vite configs are `vite.config.ts` in every sub-app. Because `vite.config.ts` sits outside the app
  tsconfig's `rootDir: ./src`, each sub-app has a `tsconfig.node.json` that includes it, referenced
  from `tsconfig.json`. Without it, typed ESLint fails with *"was not found by the project service"*.
- ESLint/Prettier come from `@iobroker/eslint-config` (4-space indent, single quotes, 120 cols).
- **Linting is partial.** The root `eslint.config.mjs` ignores every `src-*` directory, and
  `npm run lint` only descends into `src-editor` and `src-preview`. `src-chart` and `src-widgets`
  have their own `lint` scripts that CI does not run; `src-devices` has none. If you touch those,
  run their lint by hand.
- i18n: every app carries `src/i18n/{en,de,ru,pt,nl,fr,it,es,pl,uk,zh-cn}.json`. Add new keys to
  all of them.
- Changelog entries go under `### **WORK IN PROGRESS**` in `README.md`; `@alcalzone/release-script`
  turns that into a release.
