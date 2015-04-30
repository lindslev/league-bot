'use strict';

angular.module('mltpApp')
  .controller('SeasonsCtrl', function ($http, $scope, $timeout, $routeParams) {
   $scope.seasonID = $routeParams.id;
  });
