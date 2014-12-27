'use strict';

angular.module('mltpApp')
  .controller('TeamsCtrl', function ($http, $scope, $routeParams) {

    $scope.teams = [];
    $scope.teamName = $routeParams.name || 0;

    $http.post('/api/teams', {})
      .success(function(list){
            $scope.teams = list;
            $scope.idx;
            if($scope.teamName) {
              $scope.teams.forEach(function(team, i){
                if(team.name.toLowerCase() == $scope.teamName.toLowerCase()) $scope.idx = i;
              });
            }
      })
      .error(function(err){
          if(err) throw new Error(err);
      });

  });
