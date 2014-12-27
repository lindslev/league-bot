'use strict';

angular.module('mltpApp')
  .controller('PlayersCtrl', function ($http, $scope,$routeParams) {
    $scope.playerName = $routeParams.name || 0;
  });
