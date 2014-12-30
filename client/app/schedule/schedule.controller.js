'use strict';

angular.module('mltpApp')
  .controller('ScheduleCtrl', function ($http, $scope,$routeParams) {
    $scope.playerName = $routeParams.name || 0;
  });
