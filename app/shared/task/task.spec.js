'use strict'

// This is the unmodified generator-angular example spec (PasswordController/$scope.grade
// don't exist anywhere in this app) — never adapted into a real test of the task module.
// Marked pending rather than deleted or faked, since it's a placeholder, not a typo.
xdescribe ('task creation modal', function() {
  beforeEach(angular.mock.module('singleConceptAuthoringApp'));

  var $controller;

  beforeEach(inject(function(_$controller_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));

  describe('$scope.grade', function() {
    it('sets the strength to "strong" if the password length is >8 chars', function() {
      var $scope = {};
      var controller = $controller('PasswordController', { $scope: $scope });
      $scope.password = 'longerthaneightchars';
      $scope.grade();
      expect($scope.strength).toEqual('strong');
    });
  });
})