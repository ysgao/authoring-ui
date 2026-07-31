# Local Development Setup

Instructions for running the authoring-ui locally after cloning.

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Grunt CLI** installed globally:
  ```bash
  npm install -g grunt-cli
  ```

## 1. Install dependencies

```bash
npm install
```

## 2. Log in to the dev IMS

Open your browser and log in at:

```
https://dev-ims.ihtsdotools.org
```

This establishes the session that all dev backend services authenticate against.

## 3. Get your session cookie

The dev backend (`uat-snowstorm.ihtsdotools.org`) authenticates via a cookie named `dev-ims-ihtsdo`. To obtain its value:

1. In Chrome, navigate to:
   ```
   https://uat-snowstorm.ihtsdotools.org/authoring-services/projects?lightweight=true
   ```
   It should return a JSON list of projects (confirms you are authenticated).

2. Open **DevTools → Network tab**, then reload the page (**Ctrl+Shift+R**).

3. Click the `projects?lightweight=true` request in the list.

4. Right-click → **Copy → Copy as cURL (bash)**.

5. From the copied command, find the cookie value:
   ```
   -b '...dev-ims-ihtsdo=<JWT>...'
   ```
   Copy the full JWT value (the long string starting with `eyJ`).

## 4. Start the dev server

```bash
IMS_SESSION_COOKIE="dev-ims-ihtsdo=<paste-jwt-here>" grunt serve
```

The server starts at **http://localhost:9000** with LiveReload.

## How the proxy works

`grunt serve` starts a Connect server that proxies all API paths to the dev backend:

| Local path | Proxied to |
|---|---|
| `/authoring-services/` | `https://uat-snowstorm.ihtsdotools.org/authoring-services/` |
| `/snowstorm/` | `https://uat-snowstorm.ihtsdotools.org/snowstorm/` |
| `/ims/` | `https://dev-ims.ihtsdotools.org/` |
| `/rvf/`, `/release-notes/`, etc. | `https://uat-snowstorm.ihtsdotools.org/…` |

The `IMS_SESSION_COOKIE` value is injected as a `Cookie` header on every proxied request, authenticating you to the backend.

`/ims/api/account` is served locally from `.dev-ims-account.json` (a static mock of your account details) to avoid the cross-domain cookie problem with the IMS login service.

## Cookie expiry

The `dev-ims-ihtsdo` JWT expires after approximately **3 days**. When it expires, API calls will return 401/403 and the app shows a "Backend rejected the request (not authenticated)" notification (on localhost it stays on the page instead of redirecting to IMS login, which would loop). To refresh:

1. Log in again at `https://dev-ims.ihtsdotools.org` if needed.
2. Repeat step 3 above to copy a fresh JWT.
3. Restart `grunt serve` with the new value.

## Updating the local IMS account mock

If your IMS roles change (e.g. you are added to a new project), update `.dev-ims-account.json`:

1. Navigate to `https://dev-ims.ihtsdotools.org/api/account` in your browser.
2. Copy the JSON response.
3. Replace the contents of `.dev-ims-account.json` with the new JSON.
4. Restart `grunt serve` (no env var change needed).

## Other commands

```bash
npm test           # unit tests (Karma/Jasmine)
npx cypress open   # E2E tests
grunt build        # production bundle → dist/
```

## Pointing at a different backend

To use a backend other than `uat-snowstorm.ihtsdotools.org`, change `DEV_HOST` at the top of the proxy middleware in `Gruntfile.js`:

```js
var DEV_HOST = 'uat-snowstorm.ihtsdotools.org';  // change this
```
