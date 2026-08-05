'use strict';
// app/index.html inlines Google Analytics' standard async-loader snippet, which defines
// window.ga as a queue stub before the real analytics.js loads. Karma only loads .js files,
// never index.html itself, so app.js's unconditional `$window.ga('create', ...)` call in its
// .run() block throws "$window.ga is not a function" in every test that injects the app module.
// This reproduces just the stub half of that snippet — no real analytics wiring needed for tests.
window.ga = window.ga || function () {};
