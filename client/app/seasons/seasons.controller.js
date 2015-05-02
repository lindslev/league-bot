'use strict';

angular.module('mltpApp')
  .controller('SeasonsCtrl', function ($http, $scope, $location, $timeout, $routeParams, SeasonData) {
   $scope.seasonID = $routeParams.id;
   if(!$scope.seasonID) { //seasons

   } else { //season/id
    if(Number($scope.seasonID) !== 7) {
      $location.path('/seasons');
    } else { //if season 7
      $scope.teams = [], $scope.atlantic = [], $scope.northeast = [],
      $scope.midwest = [], $scope.pacific = [];
      $scope.teamName = $routeParams.name || 0;
      $scope.divisionName = $routeParams.division || 'arbitrary';
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
      $scope.weekarr = SeasonData[$scope.seasonID].weeks;
      $scope.maparr = SeasonData[$scope.seasonID].maps;

       $http.post( SeasonData[$scope.seasonID].teams, {})
          .success(function(list){
            $scope.teams = list;
            $scope.idx;

            function findTeamDivision(team) {
              var div;
              list.forEach(function(tm){
                if(tm.name == team) {
                  div = tm.key.split('')[0];
                }
              })
              return div;
            }

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

              $http.post( SeasonData[$scope.seasonID].games, {})
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

                      if(!$scope.teamName) { // use this condition because in outer api call, we dont build standingsHash when we're on a team page
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
                              $scope.standingsHash[team1].capDiff += team1capDiffG2;
                              $scope.standingsHash[team2].capDiff += team2capDiffG2;
                            }
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
                  console.log('standingsHash', $scope.standingsHash)
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
    }
  }

  ///////
  ///////
  // start logic for week stuff
  ///////
  ///////

    $scope.weekarr = SeasonData[$scope.seasonID].weeks;
    $scope.maparr = SeasonData[$scope.seasonID].maps;

    var teamsdata, scheddata;

    $http.post(SeasonData[$scope.seasonID].teams, {})
      .success(function(teams){
        teamsdata = teams;

          $http.post(SeasonData[$scope.seasonID].games, {})
            .success(function(sched){
                scheddata = sched;
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
                function findTeamDivision(team) {
                  var div;
                  teamsdata.forEach(function(tm){
                    if(tm.name == team) {
                      div = tm.key.split('')[0];
                    }
                  })
                  return div;
                }

                $scope.showDiffWeek = function(i) {
                  var week = scheddata[i];
                  $scope.weekId = i + 1;
                  $scope.games = [];
                  for(var game in week) {
                    if(game !== 'week' && game !== '_id' && game !== '$$hashKey') $scope.games.push(week[game]);
                  }
                }

                $scope.toggleAbout = function() {
                  angular.element('#aboutWeek').slideToggle();
                }

                $scope.closeStats = function(game) {
                  var idToShow = "#moreInfo" + game.gameId;
                  var classOfHeadersToClear = '.seeMore' + game.gameId;
                  angular.element(classOfHeadersToClear).removeClass('yellow');
                  $scope.games.forEach(function(g){
                    if(g.gameId == game.gameId) {
                      g.close = "";
                      g.open = false;
                    }
                  })
                  angular.element(idToShow).slideToggle();
                }

                $scope.onSeeMoreClick = function(game, halfOrGame) {
                  var playerObjArr = [];
                  var statsToCompile = [];
                  var team1 = game.team1;
                  var team2 = game.team2;
                  var week = 'week' + $routeParams.id;
                  var checkTheOtherTeam = false;
                  var idOfHeaderToHighlight = '#' + halfOrGame + game.gameId;
                  var classOfHeadersToClear = '.seeMore' + game.gameId;
                  angular.element(classOfHeadersToClear).removeClass('yellow');
                  angular.element(idOfHeaderToHighlight).addClass('yellow');

                  teamsdata.forEach(function(team){
                    if(team1 == team.name) {
                      if(halfOrGame.length == 2) { //if G1 or G2
                        var whichGame = (halfOrGame.split(''))[1];
                        var halvesToCheck = 'game' + whichGame;
                        for(var half in (team[week])[halvesToCheck]) {
                          var game = (team[week])[halvesToCheck];
                          var halfStats = game[half];
                          if(halfStats.length == 0) checkTheOtherTeam = true;
                          halfStats.forEach(function(stat){ //bc this is an array of stats arrays, loop thru
                           statsToCompile.push(stat);
                          })
                        }
                      } else { //if just one half
                        var whichGame = (halfOrGame.split(''))[1];
                        var whichHalf = (halfOrGame.split(''))[3];
                        var gameToCheck = 'game' + whichGame;
                        var halfToCheck = 'half' + whichHalf;
                        var stats = ((team[week])[gameToCheck])[halfToCheck]; //bc this is an array of stats arrays, loop thru
                        if(stats.length == 0) checkTheOtherTeam = true;
                        stats.forEach(function(stat){
                          statsToCompile.push(stat);
                        })
                      }
                    }
                  });
                  if(checkTheOtherTeam) {
                    statsToCompile = [];
                    teamsdata.forEach(function(team){
                      if(team2 == team.name) {
                        if(halfOrGame.length == 2) { //if G1 or G2
                          var whichGame = (halfOrGame.split(''))[1];
                          var halvesToCheck = 'game' + whichGame;
                          for(var half in (team[week])[halvesToCheck]) {
                            var game = (team[week])[halvesToCheck];
                            var halfStats = game[half];
                            halfStats.forEach(function(stat){ //bc this is an array of stats arrays, loop thru
                             statsToCompile.push(stat);
                            })
                          }
                        } else { //if just one half
                          var whichGame = (halfOrGame.split(''))[1];
                          var whichHalf = (halfOrGame.split(''))[3];
                          var gameToCheck = 'game' + whichGame;
                          var halfToCheck = 'half' + whichHalf;
                          var stats = ((team[week])[gameToCheck])[halfToCheck]; //bc this is an array of stats arrays, loop thru
                          stats.forEach(function(stat){
                            statsToCompile.push(stat);
                          })
                        }
                      }
                    });
                  }
                  statsToCompile.forEach(function(statArr){
                    for(var i=7; i < statArr.length; i++) {
                      if(checkPlayerObjArr(statArr[i].name, playerObjArr)) { //if player not already in there
                        playerObjArr.push(statArr[i]);
                      } else { //if player in there
                        var playerObjArrCopy = playerObjArr.map(function(thing){ return thing; });
                        playerObjArrCopy.forEach(function(p, idx){
                          if(statArr[i].name == p.name) {
                            var newObj = {};
                            newObj.minutes = p.minutes + statArr[i].minutes;
                            newObj.score = p.score + statArr[i].score;
                            newObj.tags = p.tags + statArr[i].tags;
                            newObj.pops = p.pops + statArr[i].pops;
                            newObj.grabs = p.grabs + statArr[i].grabs;
                            newObj.drops = p.drops + statArr[i].drops;
                            newObj.hold = p.hold + statArr[i].hold;
                            newObj.captures = p.captures + statArr[i].captures;
                            newObj.prevent = p.prevent + statArr[i].prevent;
                            newObj.returns = p.returns + statArr[i].returns;
                            newObj.support = p.support + statArr[i].support;
                            newObj.name = p.name;
                            playerObjArr.splice(idx, 1);
                            playerObjArr.push(newObj);
                          }
                        })
                      }
                    }
                  })

                  function checkPlayerObjArr(player, playerObjArr) {
                    var toReturn = true;
                    playerObjArr.forEach(function(p){
                      if(p.name == player) {
                        toReturn = false;
                      }
                    })
                    return toReturn;
                  }

                  $scope.games.forEach(function(tempGame){
                    if(tempGame.gameId == game.gameId) {
                      //push statsToCompile (organized) to tempGame.playerObjArr
                      tempGame.playerObjArr = playerObjArr;
                      tempGame.close = 'Close Stats';
                      var idToShow = "#moreInfo" + game.gameId;
                      if(!game.open) {
                        angular.element(idToShow).slideToggle();
                      }
                      tempGame.open = true;
                    }
                  })
                }

                $scope.weekId = 1;
                if($scope.weekId) {
                  var week = scheddata[$scope.weekId - 1];
                  $scope.games = [];
                  for(var game in week) {
                    if(game !== 'week' && game !== '_id') $scope.games.push(week[game]);
                  }
                }

            })
            .error(function(err){
              if(err) console.log(err);
            })
      })
      .error(function(err){
        if(err) console.log(err);
      })

});
