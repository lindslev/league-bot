'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope) {

    $scope.teams = [];
    $scope.scorestuff = [];

    var teams;
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
        teams = teamdata.map(function(team){
          var thisTeamSchedule = team.schedule;
          // console.log('team...', team.name, team.schedule);
          var thisTeamOpponent = thisTeamSchedule[getWeekNum() - 1] || 'none';
          return { name: team.name, chosen: false, opponent: thisTeamOpponent};
        })
        // console.log('teams in api/teams', teams);
        constructScoreboards();
      })
      .error(function(err){
        if(err) console.log(err);
      })

    function findTeamIndex(teamToFind) {
      var idx;
      teams.forEach(function(team, i){
        // console.log('teamName and teamTofind', team.name, teamToFind);
        if(team.name == teamToFind) {
          console.log('foudn it', i);
          idx = i;
        }
      })
      return idx;
    }

    function constructScoreboards() {
        for(var i=0; i < teams.length; i++) {
          if(!teams[i].chosen) {
            $scope.games.push({
              team1: teams[i].name,
              team2: teams[i].opponent
            });
            teams[i].chosen = true;
            var oppIdx = findTeamIndex(teams[i].opponent);
            teams[oppIdx].chosen = true;
            console.log('team[i]...', teams[i]);
            // console.log('scope.games', $scope.games);
          }
        }
        // if(i >= teams.length && $scope.games.length <= 10) i=0;
      // }
      console.log('scope.games in construct scoreboard', $scope.games);
    }

    // $http.post('/api/scorekeeper', {})
    //   .success(function(teams){
    //     $scope.teams = teams;
    //   })
    //   .error(function(err){
    //     if(err) console.log(err);
    //   })

    socket.on('newGameUpdate', function(info) {
        $scope.teams = info;
        console.log('about to apply to scope....');
        $scope.$apply();
    });

    socket.on('newScoreUpdate', function(info) {
        $scope.scorestuff = info;
        console.log('about to apply to scope....');
        $scope.$apply();
    });
  });
