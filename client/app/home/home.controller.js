'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope, $timeout) {

    var teams, teamdatacopy;
    $scope.games = [];
    $scope.thisWeek = getWeekNum();
    $scope.maparr = [['http://i.imgur.com/Aa2JVEc.png','Smirk'],['http://i.imgur.com/wLQsUUc.png#map-velocity','Velocity'],
                    ['http://i.imgur.com/iEmJy16.png#map-wormy','Wormy'],['http://i.imgur.com/9uZSGOn.png#map-danger-zone','Danger Zone 3'],
                    ['http://i.imgur.com/zfqqa5C.png','Iron'],['http://i.imgur.com/G2IRxWd.png#map-45','45'],
                    ['http://i.imgur.com/VixChXZ.png#map-boombox','Boombox'],['http://i.imgur.com/xgoaXJy.png#map-star','Star'],['/#/schedule','Community Vote'],['http://i.imgur.com/Aa2JVEc.png','Smirk']];


    function getWeekNum() {
      var weekMS = 604800000;
      var compareMS = new Date(2015, 0, 24).getTime(); //2 days before scheduled week 1 start date
      var todayMS = new Date().getTime();
      var whichWeek = Math.ceil((todayMS - compareMS) / weekMS);
      if(whichWeek < 1) {
        whichWeek = 1;
      } else if(whichWeek > 9) {
        whichWeek = 9;
      }
      return whichWeek;
    }

    $scope.onSeeMoreClick = function(game) {
      var idToShow = "#moreInfo" + game.gameId;
      angular.element(idToShow).slideToggle();
    }

    //gets team data from db and constructs arr of teams and opponents for building scoreboards
    $http.post('/api/teams', {})
      .success(function(teamdata){
        teamdatacopy = teamdata.map(function(team){ return team; });
        teams = teamdata.map(function(team){
          var thisTeamSchedule = team.schedule;
          var thisTeamOpponent = thisTeamSchedule[getWeekNum() - 1] || 'none';
          return { name: team.name, chosen: false, opponent: thisTeamOpponent};
        })
      })
      .error(function(err){
        if(err) console.log(err);
      })

    $http.post('/api/scorekeeper', {})
      .success(function(thisWeeksGames){
        for(var game in thisWeeksGames) {
          if(game !== 'week' && game !== '_id') $scope.games.push(thisWeeksGames[game]);
        }
        $scope.games.forEach(function(game){
          if(game.stats) {
            game.playerObjArr = [];
            for(var j=7; j < game.stats.length; j++) { //start at first player obj in stats arr
              game.playerObjArr.push(game.stats[j]);
            }
            j=0;
          }
        })
      })
      .error(function(err){
        if(err) console.log(err);
      })

    socket.on('newGameUpdate', function(info) {
        $scope.teams = info;
        $scope.$apply();
    });

    socket.on('newScoreUpdate', function(objFromServer) {
        $scope.serverobj = objFromServer;
        $scope.games.forEach(function(game){
          if(game.gameId == objFromServer.gameId) {
            game[objFromServer.halfToUpdate] = objFromServer.scoreObj;
            $scope.$apply();
            var idForCSS = "#" + objFromServer.gameId + " .gameTitle";
            if(objFromServer.stats[6].state == 2) {
              angular.element(idForCSS).addClass('red');
            } else {
              angular.element(idForCSS).addClass('green');
            }
            $timeout(function(){
              angular.element(idForCSS).removeClass('red');
              angular.element(idForCSS).removeClass('green');
              if(halfToUpdate == 'g2h2' && objFromServer.stats[6] == 2) angular.element(idForCSS).addClass('complete');
            }, 5000);
            //adding part to deal w. live stats?
            if(objFromServer.stats) {
              game.playerObjArr = [];
              for(var j=7; j < objFromServer.stats.length; j++) { //start at first player obj in stats arr
                game.playerObjArr.push(objFromServer.stats[j]);
              }
              j=0;
            }
          }
        });
        $scope.$apply();
    });
  });
