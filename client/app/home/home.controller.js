'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope, $timeout) {

    var teams, teamdatacopy;
    $scope.games = [];
    $scope.thisWeek = getWeekNum();

    function getWeekNum() {
      var weekMS = 604800000;
      var compareMS = new Date(2014, 11, 21).getTime();
      var todayMS = new Date().getTime();
      var whichWeek = Math.round((todayMS - compareMS) / weekMS);
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
          game.playerObjArr = [];
          for(var j=6; j < game.stats.length; j++) { //start at first player obj in stats arr
            game.playerObjArr.push(game.stats[j]);
          }
          j=0;
        })
        console.log('!!!!', $scope.games);
      })
      .error(function(err){
        if(err) console.log(err);
      })

    socket.on('newGameUpdate', function(info) {
        $scope.teams = info;
        console.log('about to apply to scope....');
        $scope.$apply();
    });

    socket.on('newScoreUpdate', function(objFromServer) {
        $scope.serverobj = objFromServer;
        $scope.games.forEach(function(game){
          if(game.gameId == objFromServer.gameId) {
            game[objFromServer.halfToUpdate] = objFromServer.scoreObj;
            var idForCSS = "#" + objFromServer.gameId + " .gameTitle";
            angular.element(idForCSS).addClass('green');
            $timeout(function(){
              angular.element(idForCSS).removeClass('green');
            }, 5000);
          }
        });
        console.log('about to apply to sc0000pe');
        $scope.$apply();
    });
  });
