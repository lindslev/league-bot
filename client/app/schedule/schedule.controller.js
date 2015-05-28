'use strict';

angular.module('mltpApp')
  .controller('ScheduleCtrl', function ($http, $scope, $routeParams, SeasonData) {

    $scope.weekarr = SeasonData[8].weeks;
    $scope.maparr = SeasonData[8].maps;

    var teamsdata, scheddata;

    $http.post('/api/teams', {})
      .success(function(teams){
        teamsdata = teams;

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
            })
            .error(function(err){
              if(err) console.log(err);
            })
      })
      .error(function(err){
        if(err) console.log(err);
      })

    function findTeamDivision(team) {
      var div;
      teamsdata.forEach(function(tm){
        if(tm.name == team) {
          div = tm.key.split('')[0];
        }
      })
      return div;
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

    $scope.weekId = $routeParams.id || 1;
    if($scope.weekId) {
      var strToPost = '/api/schedule/week/' + $scope.weekId;
      $http.post(strToPost, {})
        .success(function(week){
        $scope.games = [];
          for(var game in week) {
            if(game !== 'week' && game !== '_id') $scope.games.push(week[game]);
          }
        })
        .error(function(err){
          if(err) console.log(err);
        })
    }
  });
