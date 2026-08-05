// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-06-10 using
// generator-karma 1.0.0

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      "jasmine"
    ],

    // list of files / patterns to load in the browser.
    // Mirrors app/index.html's <script> order exactly — both now load every vendor library from
    // node_modules/ (bower.json/bower_components are gone; the app used to have a few libraries
    // stuck on bower-only paths that don't exist in their npm packages — see each package's own
    // fix below). angular-mocks and the ga-stub are the two test-only additions: angular-mocks
    // is pinned in package.json to the same 1.4.14 as the app's own angular (must match exactly),
    // and the ga-stub reproduces the inline Google Analytics snippet index.html has in its
    // <head> — Karma only loads .js files, never index.html itself.
    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'test/stubs/ga-stub.js',
      'node_modules/bootstrap-sass/assets/javascripts/bootstrap.js', // npm name differs from the old bower package ("bootstrap-sass-official")
      'node_modules/angular-aria/angular-aria.js',
      'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js',
      'node_modules/angular-messages/angular-messages.js',
      'node_modules/angular-resource/angular-resource.js',
      'node_modules/angular-route/angular-route.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-touch/angular-touch.js',
      'node_modules/rangy/lib/rangy-core.js',
      'node_modules/rangy/lib/rangy-classapplier.js',
      'node_modules/rangy/lib/rangy-highlighter.js',
      'node_modules/rangy/lib/rangy-selectionsaverestore.js',
      'node_modules/rangy/lib/rangy-serializer.js',
      'node_modules/rangy/lib/rangy-textrange.js',
      'node_modules/textangular/dist/textAngular.js',
      'node_modules/textangular/dist/textAngular-sanitize.js',
      'node_modules/textangular/dist/textAngularSetup.js',
      'node_modules/velocity-animate/velocity.js', // npm name differs from the old bower package ("velocity")
      'node_modules/velocity-animate/velocity.ui.js',
      'vendor/angular-smooth-scroll.js', // bower-only package, never published to npm — vendored verbatim (see the file's own header comment)
      'node_modules/ng-table/dist/ng-table.min.js',
      'node_modules/angular-loading-bar/build/loading-bar.js',
      'node_modules/angular-auto-validate/dist/jcs-auto-validate.js',
      'node_modules/d3/d3.js',
      'node_modules/c3/c3.js',
      'node_modules/c3-angular/c3-angular.js', // npm package's actual file name differs from the old bower filename (c3js-directive.js)
      'node_modules/jquery-ui-dist/jquery-ui.js',
      'node_modules/angular-strap/dist/angular-strap.js',
      'node_modules/angular-strap/dist/angular-strap.tpl.js',
      'node_modules/angular-ui-sortable/dist/sortable.js',
      'node_modules/angular-native-dragdrop/draganddrop.js',
      'node_modules/angular-elastic/elastic.js',
      'node_modules/angular-ui-tree/dist/angular-ui-tree.js',
      'node_modules/angular-cookies/angular-cookies.js',
      'node_modules/tinymce/tinymce.js',
      'node_modules/angular-ui-tinymce/src/tinymce.js',
      'node_modules/angular-hotkeys/build/hotkeys.js',
      'node_modules/angular-local-storage/dist/angular-local-storage.js',
      'node_modules/sockjs-client/dist/sockjs.js',
      'node_modules/stompjs/lib/stomp.min.js',
      'node_modules/angularjs-dropdown-multiselect/src/angularjs-dropdown-multiselect.js',
      'node_modules/js-base64/base64.js',
      'node_modules/moment/min/moment.min.js',
      'node_modules/bootstrap-daterangepicker/daterangepicker.js',
      'node_modules/angularjs-datepicker/dist/angular-datepicker.js',
      'node_modules/angularjs-daterangepicker/src/angular-daterangepicker.js',
      'node_modules/snomed-ecl-builder/output/ecl-builder.js',
      // app.js registers the singleConceptAuthoringApp module — must load before anything
      // that calls angular.module('singleConceptAuthoringApp') without the deps array.
      "app/app.js",
      "app/directives.js",
      "app/app.spec.js",
      // sidebarEdit.js registers the singleConceptAuthoringApp.sidebarEdit module via the
      // 1-arg getter form (angular.module('name')), which resolves synchronously at load time
      // — unlike the dependency-array form, load order matters here. feedbackEdit.js (in the
      // same folder) calls that getter too, and glob order is alphabetical, so without this
      // explicit entry "feedbackEdit.js" < "sidebarEdit.js" loads it first and throws.
      "app/shared/sidebar-edit/sidebarEdit.js",
      // app/shared/ modules are all one level down (app/shared/<name>/<name>.js), same as
      // components — a bare "app/shared/*.js" (no "**") never matched anything.
      "app/shared/**/*.js",
      "app/components/**/*.js"
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeHeadless
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - IE (only Windows)
    // PhantomJS was dropped — the project it depended on has been dead since 2018 and no
    // longer runs on current Node; ChromeHeadless needs no browser plugin beyond Chrome itself.
    browsers: [
      "ChromeHeadless"
    ],

    // Which plugins to enable
    plugins: [
      "karma-chrome-launcher",
      "karma-jasmine"
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
