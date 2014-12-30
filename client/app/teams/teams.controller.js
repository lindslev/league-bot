'use strict';

angular.module('mltpApp')
  .controller('TeamsCtrl', function ($http, $scope, $routeParams) {

    $scope.teams = [], $scope.atlantic = [], $scope.northeast = [],
    $scope.midwest = [], $scope.pacific = [];
    $scope.teamName = $routeParams.name || 0;

    $http.post('/api/teams', {})
      .success(function(list){
            console.log('list', list);
            $scope.teams = list;
            $scope.idx;
            if($scope.teamName) { //if :/team/name - doesnt happen on /teams route
              $scope.teams.forEach(function(team, i){
                if(team.name.toLowerCase() == $scope.teamName.toLowerCase()) $scope.idx = i;
              });
            } else { //if /teams
              $scope.teams.forEach(function(team){
                if(team.key.split('')[0] == '1') {
                  $scope.atlantic.push(team);
                } else if(team.key.split('')[0] == '2') {
                  $scope.northeast.push(team);
                } else if(team.key.split('')[0] == '3') {
                  $scope.midwest.push(team);
                } else {
                  $scope.pacific.push(team);
                }
              });
            }
      })
      .error(function(err){
          if(err) throw new Error(err);
      });

  });
