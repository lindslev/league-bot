'use strict';

angular.module('mltpApp')
.controller('TeamsCtrl', function ($http, $scope, $routeParams) {

  $scope.teams = [], $scope.atlantic = [], $scope.northeast = [],
  $scope.midwest = [], $scope.pacific = [];
  $scope.teamName = $routeParams.name || 0;
  $scope.divisionName = $routeParams.division || 0;
  $scope.divisionName = $scope.divisionName.charAt(0).toUpperCase() + $scope.divisionName.slice(1);
  if($scope.divisionName.toLowerCase() == 'northeast' || $scope.divisionName.toLowerCase() == 'atlantic') {
    $scope.conference = 'East';
  } else {
    $scope.conference = 'West';
  }
  $scope.record = [];
  $scope.wins = 0, $scope.ties = 0, $scope.losses = 0;
  $scope.standings = [];
  $scope.standingsHash = {};

  $http.post('/api/teams', {})
  .success(function(list){
    $scope.teams = list;
    $scope.idx;
            if($scope.teamName) { //if :/team/name - doesnt happen on /teams route
              $scope.teams.forEach(function(team, i){
                if(team.name.toLowerCase() == $scope.teamName.toLowerCase()) $scope.idx = i;
              });
            } else { //if /teams

              //also build standings hash and team objects in here somewhere because down there is not working

              $scope.teams.forEach(function(team){
                if(team.key.split('')[0] == '1') {
                  $scope.atlantic.push(team);
                  $scope.standingsHash[team.name] = {
                    name: team.name,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    points: 0,
                    division: 'Atlantic',
                    conference: 'east',
                    capDiff: 0
                  }
                } else if(team.key.split('')[0] == '2') {
                  $scope.northeast.push(team);
                  $scope.standingsHash[team.name] = {
                    name: team.name,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    points: 0,
                    division: 'Northeast',
                    conference: 'east',
                    capDiff: 0
                  }
                } else if(team.key.split('')[0] == '3') {
                  $scope.midwest.push(team);
                  $scope.standingsHash[team.name] = {
                    name: team.name,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    points: 0,
                    division: 'Midwest',
                    conference: 'west',
                    capDiff: 0
                  }
                } else {
                  $scope.pacific.push(team);
                  $scope.standingsHash[team.name] = {
                    name: team.name,
                    wins: 0,
                    losses: 0,
                    ties: 0,
                    points: 0,
                    division: 'Pacific',
                    conference: 'west',
                    capDiff: 0
                  }
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

            $scope.sched.forEach(function(week){ //for every week of season
              for(var gameNum in week){ //for every matchup in the week
                var game = week[gameNum]; //game should really say 'matchup' because each matchup has two games

                /***** THIS CODE == CALCULATE LEAGUE STANDINGS ****/
                var team1 = game.team1;
                var team2 = game.team2;

                if(game.g1h1 !== null && game.g1h2 !== null) {
                  var team1scoreG1 = game.g1h1[team1] + game.g1h2[team1];
                  var team2scoreG1 = game.g1h1[team2] + game.g1h2[team2];
                  var team1capDiffG1 = team1scoreG1 - team2scoreG1;
                  var team2capDiffG1 = team2scoreG1 - team1scoreG1;
                  if(team1scoreG1 > team2scoreG1) {
                    $scope.standingsHash[team1].wins += 1;
                    $scope.standingsHash[team2].losses += 1;
                    $scope.standingsHash[team1].points += 3;
                    $scope.standingsHash[team1].capDiff += team1capDiffG1;
                    $scope.standingsHash[team2].capDiff += team2capDiffG1;
                  } else if(team1scoreG1 == team2scoreG1) {
                    $scope.standingsHash[team1].ties += 1;
                    $scope.standingsHash[team2].ties += 1;
                    $scope.standingsHash[team1].points += 1;
                    $scope.standingsHash[team2].points += 1;
                    //shouldnt be a cap diff for a tie..
                  } else {
                    $scope.standingsHash[team2].wins += 1;
                    $scope.standingsHash[team1].losses += 1;
                    $scope.standingsHash[team2].points += 3;
                    $scope.standingsHash[team1].capDiff += team1capDiffG1;
                    $scope.standingsHash[team2].capDiff += team2capDiffG1;
                  }
                }

                if(game.g2h1 !== null && game.g2h2 !== null) {
                  var team1scoreG2 = game.g2h1[team1] + game.g2h2[team1];
                  var team2scoreG2 = game.g2h1[team2] + game.g2h2[team2];
                  var team1capDiffG2 = team1scoreG2 - team2scoreG2;
                  var team2capDiffG2 = team2scoreG2 - team1scoreG2;
                  if(team1scoreG2 > team2scoreG2) {
                    $scope.standingsHash[team1].wins += 1;
                    $scope.standingsHash[team2].losses += 1;
                    $scope.standingsHash[team1].points += 3;
                    $scope.standingsHash[team1].capDiff += team1capDiffG2;
                    $scope.standingsHash[team2].capDiff += team2capDiffG2;
                  } else if(team1scoreG2 == team2scoreG2) {
                    $scope.standingsHash[team1].ties += 1;
                    $scope.standingsHash[team2].ties += 1;
                    $scope.standingsHash[team1].points += 1;
                    $scope.standingsHash[team2].points += 1;
                    //shouldnt be a cap diff for a tie..
                  } else {
                    $scope.standingsHash[team2].wins += 1;
                    $scope.standingsHash[team1].losses += 1;
                    $scope.standingsHash[team2].points += 3;
                    $scope.standingsHash[team1].capDiff += team1capDiffG1;
                    $scope.standingsHash[team2].capDiff += team2capDiffG1;
                  }
                }
                /***** THIS CODE ENCOMPASSES HOW TO GET AN INDIVIDUAL'S TEAM RECORD ******/
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
                /***** END HOW TO GET AN INDIVIDUAL TEAM'S RECORD *****/

              }
            }); //end sched.forEach

            //populate standings arr from hash for ng-repeat
            for(var team in $scope.standingsHash) {
              $scope.standings.push($scope.standingsHash[team]);
            }

          }) //end .success
.error(function(err){
  if(err) throw new Error(err);
});

})
.error(function(err){
  if(err) throw new Error(err);
});

});
