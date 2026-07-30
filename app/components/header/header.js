'use strict';

angular.module('singleConceptAuthoringApp')

  .directive('scaHeader', ['$rootScope', '$timeout', '$modal', '$location', '$route', 'metadataService', 'templateService', '$routeParams', 'accountService', 'permissionService', 'vsCodeService', function ($rootScope, $timeout, $modal, $location, $route, metadataService, templateService, $routeParams, accountService, permissionService, vsCodeService) {
    return {
      restrict: '',
      transclude: false,
      replace: true,
      scope: true,
      templateUrl: 'components/header/header.html',
      link: function (scope, element, attrs) {

        // timeout variable for current notification
        var timeout = null;
        var classificationResultsFound = false;
        var validationReportFound = false;
        scope.projectOrCodeSystemFound = false;
        scope.imsRoles = [];
        scope.rbacRoles = [];

        // Cache for appLaunchers to avoid infinite digest cycles
        var cachedAppLaunchers = null;
        var lastApps = null;
        var lastAccountDetails = null;

        scope.getAppLaunchers = function () {
          // Only recalculate if dependencies have changed
          if ($rootScope.apps !== lastApps || $rootScope.accountDetails !== lastAccountDetails) {
            lastApps = $rootScope.apps;
            lastAccountDetails = $rootScope.accountDetails;
            if ($rootScope.apps && $rootScope.accountDetails) {
              cachedAppLaunchers = $rootScope.apps.filter(function (app) {
                return !app.clientName || $rootScope.accountDetails.clientAccess.includes(app.clientName);
              }).sort((a, b) => (a.group ?? 99) - (b.group ?? 99) || (a.order ?? 99) - (b.order ?? 99) || a.Application.localeCompare(b.Application));
            } else {
              cachedAppLaunchers = [];
            }
          }
          return cachedAppLaunchers || [];
        };

        // template selection
        scope.getSelectedTemplate = templateService.getSelectedTemplate;
        scope.clearTemplate = function() {
          templateService.clearSelectedTemplate();
        };

        // function to format date to required form
        scope.formatDate = function (date) {
          var hours = date.getHours();
          var minutes = date.getMinutes();
          var ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          minutes = minutes < 10 ? '0' + minutes : minutes;
          var strTime = hours + ':' + minutes + ' ' + ampm;
          var offset = String(String(new Date().toString()).split('(')[1]).split(')')[0];
          return date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear() + '  ' + strTime + ' (' + offset + ')';
        };

        // clear notification (by user request or notification)
        scope.clearNotification = function () {
          scope.notification = null;
        };

        scope.isProjectsLoaded = function() {
            return metadataService.getProjects().length > 0;
        };

        scope.openSearchProjectsModal = function () {
          $modal.open({
              templateUrl: 'shared/project-search/projectSearch.html',
              controller: 'projectSearchCtrl'
          });
        };

        scope.gotoNotificationLink = function () {

          // if on current page, reload to force any required refresh
          // NOTE Want to handle cases where # is supplied or not supplied
          // (really shouldn't be, but is in many cases)

          if(classificationResultsFound){
            $location.path(scope.notification.url).search('expandClassification', 'true');
          }
          else if(validationReportFound){
            $location.path(scope.notification.url).search('expandValidation', 'true');
          }
          else if (scope.notification.url.endsWith($location.url()) || $location.url().endsWith(scope.notification.url)) {
            $route.reload();
          }
          else{
            $location.path(scope.notification.url);
          }
          scope.clearNotification();
        };

        scope.$on('gotoNotificationLink', function (event, notification) {
          scope.gotoNotificationLink();
        });

        // Expected format from notificationService.js
        // {message: ..., url: ..., durationInMs: ...}
        scope.$on('notification', function (event, notification) {

          if (notification) {

            // cancel any existing timeout
            if (timeout) {
              $timeout.cancel(timeout);
            }

            // validation checking of notification url
            if (notification.url) {
              // strip any leading #
              if (notification.url.indexOf('#') === 0) {
                notification.url = notification.url.substring(1);
              }

              // ensure path starts with /
              if (notification.url.indexOf('/') !== 0) {
                notification.url = '/' + notification.url;
              }
            }

            // set the notification
            $timeout(function () {
              scope.notification = notification;
            }, 0);


            // if a duration supplied, apply it
            if (notification.durationInMs > 0) {
              timeout = $timeout(function () {
                scope.notification = null;
              }, notification.durationInMs);
            }

            //Detect classification with results
            if (notification.message.startsWith('Classification completed successfully for project')
              && notification.url) {
              classificationResultsFound = true;
            } else {
              classificationResultsFound = false;
            }

            //Detect validation reports
            if (notification.message.startsWith('Validation Completed for project')
              && notification.url) {
              validationReportFound = true;
            } else {
              validationReportFound = false;
            }
          }
        });

        // local storage for current project
        // NOTE: task is set in edit.js as rootScope variable

        scope.parseTitleSection = function (titleSection) {
          titleSection = titleSection.replace(/ *\<[^)]*\> */g, "");
          // check if matches the current task
          if ($rootScope.currentTask && titleSection === $rootScope.currentTask.key) {
            return $rootScope.currentTask.summary;
          }

          // otherwise try to match against the existing projects list
          else {

            var projects = metadataService.getProjects();
            if(projects)
            {
                var matchingProjects = projects.filter(function (el) {
                  return el.key === titleSection;
                });
                if (matchingProjects.length > 0) {
                  return matchingProjects[0].title;
                }
            }
            var codeSystems = metadataService.getCodeSystems();
            if(codeSystems)
            {
                var matchingCodeSystems = codeSystems.filter(function (el) {
                  return el.shortName === titleSection;
                });
                if (matchingCodeSystems.length > 0) {
                  return matchingCodeSystems[0].name + ' Code System';
                }
            }

            return null;
          }
        };

        scope.$on('clearNotifications', function (event, data) {
          scope.clearNotification();
        });

        // watch for changes in page title to format breadcrumbs
        scope.$watch('pageTitle', function () {
          if ($rootScope.pageTitle) {
            scope.titleSections = $rootScope.pageTitle.split('/');
          }
        });

        //////////////////////////
        // User Settings
        //////////////////////////
        scope.openSettingsModal = function () {
          var modalInstance = $modal.open({
            templateUrl: 'shared/user-preferences/userPreferences.html',
            controller: 'userPreferencesCtrl'
          });

          modalInstance.result.then(function (response) {
            if (response) {
              // do nothing -- user preferences ctrl should make appropriate
              // changes on completion
            }
          }, function () {
          });
        };

        // These nav items are plain ng-href="#/..." anchors with no ng-click, relying on
        // the browser's native same-document hash navigation. That only works when the
        // resolved href's non-fragment part matches the current document address — true in
        // a normal browser, but NOT in the VS Code webview, where <base href> points at the
        // extension's local asset root while the real document address is VS Code's own
        // webview host URL. There the browser treats the click as a cross-document
        // navigation to a nonexistent resource and silently does nothing. Driving the route
        // change through $location.url() directly (and preventing the native navigation)
        // sidesteps that mismatch entirely, in both environments.
        scope.gotoDashboard = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('home');
        };

        scope.gotoMyTasks = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('home');
        };

        scope.gotoReviewTasks = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('review-tasks');
        };

        scope.gotoMyProjects = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('my-projects');
        };

        scope.gotoCodeSystems = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('codesystems');
        };

        scope.gotoLogin = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('login');
        };

        scope.gotoLogout = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('logout');
        };

        scope.gotoTemplates = function() {
          vsCodeService.openExternalApp('/template-management/');
        };

        scope.gotoAllProjects = function($event) {
          if ($event) { $event.preventDefault(); }
          $location.url('projects');
        };

        scope.openBrowser = function() {
          accountService.getUserPreferences().then(function (response) {
              scope.userPreferences = response;
              if(window.location.href.indexOf("task/") > -1) {
                  vsCodeService.openExternalApp('/browser/?perspective=full&conceptId1=138875005&edition=' + $rootScope.currentTask.branchPath.substring(0, $rootScope.currentTask.branchPath.lastIndexOf('/')) + '&release=' + $rootScope.currentTask.key);
                }
              else if(window.location.href.indexOf("project/") > -1) {
                  vsCodeService.openExternalApp('/browser/?perspective=full&conceptId1=138875005&edition=' + metadataService.getBranchRoot() + '/' + $routeParams.projectKey);
                }
              else if(scope.userPreferences && scope.userPreferences.branchPath){
                  vsCodeService.openExternalApp('/browser/?perspective=full&conceptId1=138875005&edition=' + scope.userPreferences.branchPath);
                }
              else{
                  vsCodeService.openExternalApp('/browser/?perspective=full&conceptId1=138875005');
              }
          });
        };

        scope.openDailyBuild = function() {
          if (!$rootScope.endpoints || !$rootScope.endpoints.dailyBuildEndpoint) { return; }
          if(window.location.href.indexOf("codesystem/") > -1) {
            var codeSystem = metadataService.getCodeSystenForGivenShortname($routeParams.codeSystem);
            vsCodeService.openExternalApp($rootScope.endpoints.dailyBuildEndpoint + '?perspective=full&conceptId1=138875005&edition=' + codeSystem.branchPath);
          } else {
            vsCodeService.openExternalApp($rootScope.endpoints.dailyBuildEndpoint);
          }
        };

        scope.openReporting = function() {
          if(window.location.href.indexOf("task/") > -1) {
            vsCodeService.openExternalApp('/reporting/' + $rootScope.currentTask.branchPath);
          } else if(window.location.href.indexOf("project/") > -1) {
            vsCodeService.openExternalApp('/reporting/' + metadataService.getBranchRoot() + '/' + $routeParams.projectKey);
          } else if(window.location.href.indexOf("codesystem/") > -1) {
            var codeSystem = metadataService.getCodeSystenForGivenShortname($routeParams.codeSystem);
            vsCodeService.openExternalApp('/reporting/' + codeSystem.branchPath);
          } else {
            vsCodeService.openExternalApp('/reporting/');
          }
        };

        scope.openReleaseNotes = function() {
          vsCodeService.openExternalApp('/release-notes-management/');
        };

        scope.openValidationBrowser = function() {
          vsCodeService.openExternalApp('/validation-browser/');
        };

        scope.openMRCM = function() {
          if(metadataService.isExtensionSet()) {
            let date = metadataService.getPreviousRelease();
            let path = 'MAIN/' + date.slice(0,4) + '-' + date.slice(4,6) + '-' + date.slice(6,8);

            vsCodeService.openExternalApp('/mrcm/?branch=' + path);
          }
          else{
              vsCodeService.openExternalApp('/mrcm/');
          }
        };

        scope.openTranslationDashboard = function() {
          var shortName;
          var codeSystem;
          if(window.location.href.indexOf("task/") > -1) {
            codeSystem = metadataService.getCodeSystemForGivenBranch($rootScope.currentTask && $rootScope.currentTask.branchPath);
            shortName = codeSystem ? codeSystem.shortName : null;
          } else if(window.location.href.indexOf("project/") > -1) {
            codeSystem = metadataService.getCodeSystemForGivenBranch(metadataService.getBranchRoot() + '/' + $routeParams.projectKey);
            shortName = codeSystem ? codeSystem.shortName : null;
          } else if(window.location.href.indexOf("codesystem/") > -1) {
            codeSystem = metadataService.getCodeSystenForGivenShortname($routeParams.codeSystem);
            shortName = codeSystem ? codeSystem.shortName : null;
          } else {
            shortName = null;
          }
          vsCodeService.openExternalApp('/simplex/translation-dashboard' + (shortName && shortName.includes('-') ? ('/' + shortName) : ''));
        };

        scope.$watch('accountDetails', function () {
          if ($rootScope.accountDetails) {
            scope.imsRoles = [];
            angular.forEach($rootScope.accountDetails.roles, function (role) {
              scope.imsRoles.push(role.replace('ROLE_', '').toLowerCase());
            });
          }
        });

        scope.$watch('userRoles', function () {
          scope.projectOrCodeSystemFound = $routeParams.projectKey || $routeParams.codeSystem;
          if ($rootScope.userRoles) {
            scope.rbacRoles = [];
            angular.forEach($rootScope.userRoles, function (role) {
              scope.rbacRoles.push(role.toLowerCase());
            });
          }
        }, true);

        $('body').on('mouseup', function(e) {
          if(!$(e.target).closest('.popover').length) {
              $('.popover').each(function(){
                if ($(this).hasClass("in") && $(this).hasClass("accountDetails") ) {
                  document.getElementById('accountDetails').click();
                }
              });
          }
        });
      }
    };
  }]);
