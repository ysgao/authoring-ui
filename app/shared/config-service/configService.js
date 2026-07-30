'use strict';

angular.module('singleConceptAuthoringApp')
  .factory('configService', ['$http', '$q', 'AppConstants', function ($http, $q, AppConstants) {

    var properties = null;
    var validationProperties = null;
    var versions = null;

    // Offline/VS Code fallback config — used when the authoring services
    // backend is unreachable (e.g. running inside a VS Code webview).
    var _vsConfig = (typeof window !== 'undefined' && window.__ONTOGRAPH_CONFIG__) || {};
    var VSCODE_FALLBACK_CONFIG = {
      endpoints: {
        terminologyServerEndpoint: _vsConfig.terminologyServerEndpoint || 'https://dev-snowstorm.ihtsdotools.org/snowstorm/snomed-ct/',
        terminologyServerExternalEndpoint: _vsConfig.terminologyServerExternalEndpoint || _vsConfig.terminologyServerEndpoint || 'https://dev-snowstorm.ihtsdotools.org/snowstorm/snomed-ct/',
        imsEndpoint: _vsConfig.imsEndpoint || 'https://dev-snowstorm.ihtsdotools.org/',
        authoringServicesEndpoint: _vsConfig.authoringServicesEndpoint || 'https://dev-snowstorm.ihtsdotools.org/authoring-services/',
        aagEndpoint: _vsConfig.aagEndpoint || '',
        releaseNotesEndpoint: _vsConfig.releaseNotesEndpoint || '',
        rvfEndpoint: _vsConfig.rvfEndpoint || '',
        templateServiceEndpoint: _vsConfig.templateServiceEndpoint || '',
        traceabilityEndpoint: _vsConfig.traceabilityEndpoint || '',
        externalAppsOrigin: _vsConfig.externalAppsOrigin || '',
        dailyBuildEndpoint: _vsConfig.dailyBuildEndpoint || '',
        crsEndpoint: '',
        collectorEndpoint: '',
        msCollectorEndpoint: ''
      },
      features: {
        templateExclusionList: '[]'
      }
    };

    function getConfigProperties() {
      var deferred = $q.defer();
      if (!properties) {
        // If extension host pre-fetched ui-configuration, use it directly (no CORS issue).
        if (_vsConfig.uiConfiguration) {
          console.log('[configService] Using pre-fetched ui-configuration from extension host');
          properties = _vsConfig.uiConfiguration;
          deferred.resolve(properties, validationProperties);
          return deferred.promise;
        }
        $http.get(AppConstants.AUTHORING_SERVICES_ENDPOINT + 'ui-configuration').then(function (response) {
            properties = response.data;
            $http.get('/config/versions.json').then(function (confResponse) {
              versions = confResponse.data;
              deferred.resolve(properties, validationProperties);
            }, function(error) {
              console.log(error);
              deferred.resolve(properties, validationProperties);
            });
        }, function(err) {
          // Backend unreachable — use VS Code offline fallback config
          console.warn('[configService] Backend unreachable, using VS Code fallback config:', err && err.status);
          properties = VSCODE_FALLBACK_CONFIG;
          deferred.resolve(properties, validationProperties);
        });
      } else {
        deferred.resolve(properties, validationProperties);
      }
      return deferred.promise;
    }

    return {
      getConfigurations: function () {
        var deferred = $q.defer();
        getConfigProperties().then(function() {
          deferred.resolve(properties);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },
      getVersions: function () {
        var deferred = $q.defer();
        getConfigProperties().then(function() {
            console.log(versions)
          deferred.resolve(versions.versions);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      }
    };
  }]);
