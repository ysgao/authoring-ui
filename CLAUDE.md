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

### Startup flow

1. `app.js` posts `WEBVIEW_READY` to VS Code host.
2. `configService.getConfigurations()` fetches `/authoring-services/ui-configuration` → on failure uses the VS Code fallback config.
3. Endpoints from the config are distributed to all services (`scaService`, `terminologyServerService`, etc.).
4. `accountService.getAccount()` checks auth; redirects to `/login` in browser mode, no-ops in VS Code mode.

### Key constants

`AppConstants` in `app/app.js` defines the relative API path prefixes (`/authoring-services/`, `/rvf/`, etc.) used for all backend calls in browser mode. These are the same paths the Grunt proxy intercepts.

### Build

Grunt pipeline: SCSS compilation (`sass`) → JS concat (`concat`) → Angular DI annotation (`ngAnnotate`) → file copy → CSS minification → static asset fingerprinting (`filerev`) → HTML reference rewriting (`usemin`) → HTML minification (`htmlmin`).
