'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope) {

    $scope.teams = [];
    $scope.scorestuff = [];
    $scope.tempGameInfo = [];

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

    //gets team data from db and constructs arr of teams and opponents for building scoreboards
    $http.post('/api/teams', {})
      .success(function(teamdata){
        teamdatacopy = teamdata.map(function(team){ return team; });
        teams = teamdata.map(function(team){
          var thisTeamSchedule = team.schedule;
          // console.log('team...', team.name, team.schedule);
          var thisTeamOpponent = thisTeamSchedule[getWeekNum() - 1] || 'none';
          return { name: team.name, chosen: false, opponent: thisTeamOpponent};
        })
        // console.log('teams in api/teams', teams);
        // constructScoreboards();
      })
      .error(function(err){
        if(err) console.log(err);
      })

    $http.post('/api/scorekeeper', {})
      .success(function(thisWeeksGames){
        // $scope.games = thisWeeksGames;
        for(var game in thisWeeksGames) {
          if(game !== 'week' && game !== '_id') $scope.games.push(thisWeeksGames[game]);
        }
        $scope.tempGameInfo = $scope.games;
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
          }
        });
        console.log('about to apply to sc0000pe');
        $scope.$apply();
    });
  });
