'use strict';

angular.module('mltpApp')
  .controller('ScheduleCtrl', function ($http, $scope, $routeParams) {

    $scope.weekarr = ['1/18/2015', '1/25/2015','2/1/2015','2/8/2015','2/15/2015','2/22/2015',
                      '3/1/2015','3/8/2015','3/15/2015']
    $scope.maparr = [['http://i.imgur.com/Aa2JVEc.png','Smirk'],['http://i.imgur.com/wLQsUUc.png#map-velocity','Velocity'],
                    ['http://i.imgur.com/iEmJy16.png#map-wormy','Wormy'],['http://i.imgur.com/9uZSGOn.png#map-danger-zone','Danger Zone 3'],
                    ['http://i.imgur.com/zfqqa5C.png','Iron'],['http://i.imgur.com/G2IRxWd.png#map-45','45'],
                    ['http://i.imgur.com/VixChXZ.png#map-boombox','Boombox'],['http://i.imgur.com/xgoaXJy.png#map-star','Star'],['/#/schedule','Community Vote'],['http://i.imgur.com/CDcTbs0.png#map-smirk','Smirk']];

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
