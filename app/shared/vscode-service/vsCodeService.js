'use strict';

angular.module('singleConceptAuthoringApp')
  .factory('vsCodeService', function ($window, $rootScope) {

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

    // Handle incoming messages from the extension host (e.g. GRAPH_NODE_SELECT)
    $window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.command) { return; }
      if (msg.command === 'GRAPH_NODE_SELECT' && msg.payload && msg.payload.id) {
        $rootScope.$broadcast('editConcept', { conceptId: msg.payload.id });
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
