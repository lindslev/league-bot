'use strict';

angular.module('mltpApp')
  .controller('ScheduleCtrl', function ($http, $scope, $routeParams) {

    $scope.weekarr = ['1/18/2015', '1/25/2015','2/1/2015','2/8/2015','2/15/2015','2/22/2015',
                      '3/1/2015','3/8/2015','3/15/2015']
    $scope.maparr = [['http://i.imgur.com/CDcTbs0.png#map-smirk','Smirk'],['http://i.imgur.com/wLQsUUc.png#map-velocity','Velocity'],
                    ['http://i.imgur.com/iEmJy16.png#map-wormy','Wormy'],['http://i.imgur.com/9uZSGOn.png#map-danger-zone','Danger Zone 3'],
                    ['http://i.imgur.com/zfqqa5C.png','Iron'],['http://i.imgur.com/G2IRxWd.png#map-45','45'],
                    ['http://i.imgur.com/VixChXZ.png#map-boombox','Boombox'],['http://i.imgur.com/xgoaXJy.png#map-star','Star'],['/#/schedule','Community Vote'],['http://i.imgur.com/CDcTbs0.png#map-smirk','Smirk']];

    var teamsdata, scheddata;
    $scope.seeMoreOpen = false;

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
        }
      })
      angular.element(idToShow).slideToggle();
      $scope.seeMoreOpen = false;
    }

    $scope.onSeeMoreClick = function(game, halfOrGame) {
      var playerObjArr = [];
      var statsToCompile = [];
      var team1 = game.team1;
      var week = 'week' + $routeParams.id;
      teamsdata.forEach(function(team){
        if(team1 == team.name) {
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

      statsToCompile.forEach(function(statArr){
        for(var i=7; i < statArr.length; i++) {
          if(checkPlayerObjArr(statArr[i].name, playerObjArr)) { //if player not already in there
            playerObjArr.push(statArr[i]);
          } else { //if player in there
            // playerObjArr.forEach(function(p){
            //   if(statArr[i].name == p.name) {
            //     //combine stats???
            //   }
            // })
            playerObjArr.push(statArr[i]);
          }
        }
      })

      function checkPlayerObjArr(player, playerObjArr) {
        playerObjArr.forEach(function(p){
          if(p.name == player) {
            return false;
          }
        })
        return true;
      }

      function combineStats() { }

      $scope.games.forEach(function(tempGame){
        if(tempGame.gameId == game.gameId) {
          //push statsToCompile (organized) to tempGame.playerObjArr
          tempGame.playerObjArr = playerObjArr;
          tempGame.close = 'Close Stats';
        }
      })
      var idToShow = "#moreInfo" + game.gameId;
      if(!$scope.seeMoreOpen) {
        angular.element(idToShow).slideToggle();
        $scope.seeMoreOpen = true;
      }
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
