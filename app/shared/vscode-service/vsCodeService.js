'use strict';

angular.module('singleConceptAuthoringApp')
  .factory('vsCodeService', function ($window, $rootScope, $timeout, $location) {

    var vscodeApi = null;

    // Acquire the VS Code webview API once, if available (T013: browser fallback)
    if (typeof $window.acquireVsCodeApi === 'function') {
      try {
        vscodeApi = $window.acquireVsCodeApi();
      } catch (e) {
        // acquireVsCodeApi() can only be called once; guard against duplicate calls
        console.warn('[vsCodeService] acquireVsCodeApi() failed:', e);
      }
    } else {
      console.warn('[vsCodeService] Running outside VS Code — postMessage and state APIs are no-ops.');
    }

    // <base href> is pointed at the extension's local vscode-resource asset root (needed to
    // resolve relative script/css/image paths), which diverges from the webview's real
    // document address. That makes the browser treat a plain <a href="#/..."> click as
    // cross-document navigation to a nonexistent resource instead of same-page hash
    // navigation, so it silently no-ops with no console error. This affects every such link
    // app-wide (nav dropdown, sidebar, project/task/codesystem list rows, ...), so intercept
    // clicks globally here rather than patching each template's ng-href with an ng-click.
    if (vscodeApi) {
      document.addEventListener('click', function (event) {
        var el = event.target;
        while (el && el.tagName !== 'A') {
          el = el.parentElement;
        }
        if (!el) { return; }
        var href = el.getAttribute('href');
        if (!href || href.indexOf('#/') !== 0) { return; }
        event.preventDefault();
        $timeout(function () {
          $location.url(href.substring(1));
        });
      }, true);
    }

    var displayConfigInitCallbacks = [];
    var storedDisplayConfig = null;

    // Handle incoming messages from the extension host
    $window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.command) { return; }

      if (msg.command === 'GRAPH_NODE_SELECT' && msg.payload && msg.payload.id) {
        var conceptId = msg.payload.id;
        $timeout(function () {
          $rootScope.$broadcast('treeSelectConcept', { conceptId: conceptId });
          $rootScope.$broadcast('viewTaxonomy', { concept: { conceptId: conceptId, fsn: '', preferredSynonym: '' } });
        }, 0);
        return;
      }

      if (msg.command === 'DISPLAY_CONFIG_INIT' && msg.payload) {
        console.log('[vsCodeService] DISPLAY_CONFIG_INIT received, colourScheme:', msg.payload && msg.payload.userPreferences && msg.payload.userPreferences.colourScheme);
        storedDisplayConfig = msg.payload;
        $timeout(function () {
          for (var i = 0; i < displayConfigInitCallbacks.length; i++) {
            try { displayConfigInitCallbacks[i](msg.payload); } catch (e) { /* ignore */ }
          }
        }, 0);
      }
    });

    return {
      /**
       * Returns the raw VS Code webview API, or null when running in browser.
       */
      getVsCodeApi: function () {
        return vscodeApi;
      },

      /**
       * Sends a structured JSON message to the VS Code Extension Host.
       * No-op when running in standalone browser mode.
       */
      postMessage: function (command, payload) {
        if (vscodeApi) {
          vscodeApi.postMessage({ command: command, payload: payload });
        }
      },

      /**
       * Persists state in the webview frame (survives tab hide/reveal cycles).
       * No-op when running in standalone browser mode.
       */
      setState: function (state) {
        if (vscodeApi) {
          vscodeApi.setState(state);
        }
      },

      /**
       * Retrieves previously persisted webview state.
       * Returns null when running in standalone browser mode.
       */
      getState: function () {
        return vscodeApi ? vscodeApi.getState() : null;
      },

      /**
       * Sends a partial display config update to the extension host for persistence.
       * No-op when running in standalone browser mode.
       */
      sendDisplayConfigChange: function (partial) {
        if (vscodeApi) {
          vscodeApi.postMessage({ command: 'DISPLAY_CONFIG_CHANGE', payload: partial });
        }
      },

      /**
       * Registers a callback invoked when the extension host sends DISPLAY_CONFIG_INIT.
       * If config was already received, callback fires immediately.
       */
      onDisplayConfigInit: function (callback) {
        if (storedDisplayConfig) {
          $timeout(function () { callback(storedDisplayConfig); }, 0);
        } else {
          displayConfigInitCallbacks.push(callback);
        }
      },

      /**
       * Returns the most recently received display config, or null.
       */
      getStoredDisplayConfig: function () {
        return storedDisplayConfig;
      },

      /**
       * Requests the extension host to open a URL in the system browser.
       * Falls back to window.location when running in standalone browser mode.
       */
      openExternal: function (url) {
        console.log('[vsCodeService] openExternal called, vscodeApi=', !!vscodeApi, 'url=', url);
        if (vscodeApi) {
          vscodeApi.postMessage({ command: 'openExternal', payload: { url: url } });
        } else {
          $window.location.href = url;
        }
      }
    };
  });
