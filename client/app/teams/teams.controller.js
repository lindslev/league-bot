'use strict';

angular.module('mltpApp')
  .controller('TeamsCtrl', function ($http, $scope, $routeParams) {

    $scope.teams = [], $scope.atlantic = [], $scope.northeast = [],
    $scope.midwest = [], $scope.pacific = [];
    $scope.teamName = $routeParams.name || 0;
    $scope.record = [];
    $scope.wins = 0, $scope.ties = 0, $scope.losses = 0;

    $http.post('/api/teams', {})
      .success(function(list){
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

        function findTeamDivision(team) {
          var div;
          list.forEach(function(tm){
            if(tm.name == team) {
              div = tm.key.split('')[0];
            }
          })
          return div;
        }

        $http.post('/api/schedule', {})
          .success(function(sched){
            sched.sort(function(a,b){ //because db doesnt give weeks back in order, for some reason
              if(a.week < b.week) return -1;
              if(a.week > b.week) return 1;
              return 0;
            })
            $scope.sched = [];
            sched.forEach(function(week){
              for(var game in week) {
                if(game == 'week' || game == '_id') {
                  delete week[game];
                } else {
                  (week[game])['team1division'] = Number(findTeamDivision((week[game])['team1']));
                  (week[game])['team2division'] = Number(findTeamDivision((week[game])['team2']));
                }
              }
            });
            $scope.sched = sched;

            $scope.sched.forEach(function(week){
              for(var gameNum in week){
                var game = week[gameNum]; //game should really say 'matchup' because each matchup has two games
                var objForRecordArray = {
                  'game1':null,
                  'game2':null
                }
                if(game.team1 == $scope.teamName || game.team2 == $scope.teamName) {
                  if(game.g1h1 !== null && game.g1h2 !== null) {
                    //get scores for g1h1
                    for(var competitor in game.g1h1) {
                      if(competitor == $scope.teamName) {
                        var thisTeamScoreG1 = game.g1h1[competitor];
                      } else {
                        var otherTeamScoreG1 = game.g1h1[competitor];
                      }
                    }
                    //get scores for g1h2
                    for(var competitor in game.g1h2) {
                      if(competitor == $scope.teamName) {
                        thisTeamScoreG1 += game.g1h2[competitor];
                      } else {
                        otherTeamScoreG1 += game.g1h2[competitor];
                      }
                    }
                    if(thisTeamScoreG1 > otherTeamScoreG1) {
                      objForRecordArray.game1 = 'Win';
                      $scope.wins++;
                    } else if(thisTeamScoreG1 == otherTeamScoreG1) {
                      objForRecordArray.game1 = 'Tie';
                      $scope.ties++;
                    } else {
                      objForRecordArray.game1 = 'Loss';
                      $scope.losses++;
                    }
                  }
                }
                //repeat for game 2.... omg
                if(game.team1 == $scope.teamName || game.team2 == $scope.teamName) {
                  if(game.g2h1 !== null && game.g2h2 !== null) {
                    //get scores for g2h1
                    for(var competitor in game.g2h1) {
                      if(competitor == $scope.teamName) {
                        var thisTeamScoreG2 = game.g2h1[competitor];
                      } else {
                        var otherTeamScoreG2 = game.g2h1[competitor];
                      }
                    }
                    //get scores for g2h2
                    for(var competitor in game.g2h2) {
                      if(competitor == $scope.teamName) {
                        thisTeamScoreG2 += game.g2h2[competitor];
                      } else {
                        otherTeamScoreG2 += game.g2h2[competitor];
                      }
                    }
                    if(thisTeamScoreG2 > otherTeamScoreG2) {
                      objForRecordArray.game2 = 'Win';
                      $scope.wins++;
                    } else if(thisTeamScoreG2 == otherTeamScoreG2) {
                      objForRecordArray.game2 = 'Tie';
                      $scope.ties++;
                    } else {
                      objForRecordArray.game2 = 'Loss';
                      $scope.losses++;
                    }
                  }
                  $scope.record.push(objForRecordArray);
                }

              }
            }); //end sched.forEach
console.log($scope.record)
          }) //end .success
          .error(function(err){
            if(err) throw new Error(err);
          });

      })
      .error(function(err){
        if(err) throw new Error(err);
      });



  });
