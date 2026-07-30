# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install node + bower dependencies
grunt serve          # dev server at http://localhost:9000 with LiveReload
grunt build          # production bundle → dist/
npm test             # unit tests (Karma/Jasmine)
npx cypress open     # E2E tests
```

The dev server proxies API paths (`/authoring-services/`, `/snowstorm/`, `/snomed-ct/`, `/rvf/`, `/release-notes/`, `/authoring-acceptance-gateway/`, `/ims/`) to `https://dev-snowstorm.ihtsdotools.org`. To target a different backend, change `DEV_HOST` in `Gruntfile.js` `connect.livereload.options.middleware`.

## Architecture

**AngularJS 1.x SPA** (`singleConceptAuthoringApp` root module in `app/app.js`). No TypeScript, no modern bundler — Grunt concatenates and minifies plain JS.

### Module structure

- `app/components/` — feature modules (edit, project, projects, home, codesystems, …). Each folder is self-contained: `.js` controller, `.html` template, `.spec.js` unit tests, optional `.scss`. Routes are defined inside each component's `.config($routeProvider)` block.
- `app/shared/` — cross-cutting services, directives, and filters (60+ modules). Key ones:
  - `configService` — fetches `ui-configuration` from `/authoring-services/` at startup; falls back to `VSCODE_FALLBACK_CONFIG` if unreachable (offline / VS Code mode). Endpoints flow from here to all other services.
  - `scaService` — main REST + WebSocket gateway to Authoring-Services (STOMP over SockJS).
  - `terminologyServerService` — queries Snowstorm.
  - `vsCodeService` — VS Code webview message bus (see below).
  - `accountService` — auth, roles, preferences.
  - `metadataService` — in-memory cache for projects, code systems, semantic tags.

### Dual-mode: browser vs VS Code

The app detects `window.acquireVsCodeApi()` at runtime. In VS Code mode:
- `vsCodeService` wraps the webview API for bi-directional messaging (`WEBVIEW_READY`, `DISPLAY_CONFIG_INIT`, `GRAPH_NODE_SELECT`, `DISPLAY_CONFIG_CHANGE`).
- The extension host can pre-supply `window.__ONTOGRAPH_CONFIG__` (including a full `uiConfiguration` object) to bypass the network config fetch entirely.
- Auth redirects and 401/403 handling are suppressed (`isVsCode` guards in the HTTP interceptor).

#### Endpoint proxying (`endpoints.*`)

`extension/src/authoring/authoringPanel.ts` injects `endpoints.*` into `window.__ONTOGRAPH_CONFIG__.uiConfiguration`. Only keys the Angular app calls via `$http` XHR are rewritten to the local CORS/auth proxy (`PROXIED_ENDPOINT_KEYS` in `authoringPanel.ts`: `authoringServicesEndpoint`, `terminologyServerEndpoint`, `aagEndpoint`, `releaseNotesEndpoint`, `rvfEndpoint`, `templateServiceEndpoint`, `traceabilityEndpoint`, `browserEndpoint`, `crsEndpoint`/`crsEndpoint.US`). Everything else the real backend returns (`scaUserGuideEndpoint`, `contactUsEndpoint`, `dailyBuildEndpoint`, `imsEndpoint`, ...) is passed through with its real, unproxied value — these are used to build links opened in the user's system browser (footer links, `openExternal` calls), and the proxy only knows how to forward to the authoring-services host. **When adding a new backend-called service, add its endpoint key to `PROXIED_ENDPOINT_KEYS`; when adding a new externally-opened link, do not.**

`endpoints.externalAppsOrigin` (the real authoring-services origin) and `endpoints.terminologyServerExternalEndpoint` (the real, unproxied terminology-server URL) are non-proxied convenience values for building links to sibling companion apps and terminology-server-hosted pages (`/browser/`, `/mrcm/`, `/reporting/`, `/release-notes-management/`, `/validation-browser/`, `/template-management/`, `/simplex/...`) — see `vsCodeService.js`'s `openExternalApp()` helper (used by `header.js`, `sidebar.js`) and the direct `terminologyServerExternalEndpoint` reads in `conceptEdit.js`/`codesystem.js`/`project.js`'s metadata/JSON viewers. In VS Code, `window.open(path)` is blocked by the webview sandbox and a bare root-relative path resolves against the wrong origin anyway, so these call sites route through `vsCodeService.openExternal()` instead; in browser mode they fall back to plain `window.open(path)` unchanged. **Any call site that builds an externally-opened link from an endpoint must use the endpoint's non-proxied companion (`externalAppsOrigin`/`terminologyServerExternalEndpoint`), never the proxied XHR endpoint (`authoringServicesEndpoint`/`terminologyServerEndpoint`) directly.**

#### Hash-link navigation in the webview

`<base href>` is pointed at the extension's local `vscode-resource` asset root (needed so relative script/css/image paths resolve), which diverges from the webview's real document address. That makes the browser treat a plain `<a href="#/...">` click as a cross-document navigation to a nonexistent resource instead of same-page hash navigation — it silently no-ops with no console error. This affects every `#/...` link app-wide (34+ occurrences: nav dropdown, sidebar, project/task/codesystem list rows, ...). `vsCodeService.js` installs a document-level capture-phase `click` listener (VS Code mode only) that intercepts any click bubbling through an `<a href="#/...">`, prevents the default navigation and stops propagation, and drives the route via `$location.url()` instead — this covers the pattern app-wide without needing per-template fixes. A few components (`header.js`, `sidebar.js`) also wire explicit `ng-click` handlers for the same links as a belt-and-suspenders fix predating the global interceptor; the interceptor's `stopPropagation()` is what keeps this redundancy harmless (without it, both would fire and double-navigate) — not required for new links.

### Startup flow

1. `app.js` posts `WEBVIEW_READY` to VS Code host.
2. `configService.getConfigurations()` fetches `/authoring-services/ui-configuration` → on failure uses the VS Code fallback config.
3. Endpoints from the config are distributed to all services (`scaService`, `terminologyServerService`, etc.).
4. `accountService.getAccount()` checks auth; redirects to `/login` in browser mode, no-ops in VS Code mode.

### Key constants

`AppConstants` in `app/app.js` defines the relative API path prefixes (`/authoring-services/`, `/rvf/`, etc.) used for all backend calls in browser mode. These are the same paths the Grunt proxy intercepts.

### Build

Grunt pipeline: SCSS compilation (`sass`) → JS concat (`concat`) → Angular DI annotation (`ngAnnotate`) → file copy → CSS minification → static asset fingerprinting (`filerev`) → HTML reference rewriting (`usemin`) → HTML minification (`htmlmin`).
