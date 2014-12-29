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

    function findTeamIndex(teamToFind) {
      var idx;
      teams.forEach(function(team, i){
        // console.log('teamName and teamTofind', team.name, teamToFind);
        if(team.name == teamToFind) {
          // console.log('foudn it', i);
          idx = i;
        }
      })
      return idx;
    }

    function constructScoreboards() {
        for(var i=0; i < teams.length; i++) {
          if(!teams[i].chosen) {
            var gameID = $scope.games.length + 1;
            $scope.games.push({
              team1: teams[i].name,
              team2: teams[i].opponent,
              team1score: null,
              team2score: null,
              gameId: gameID,
              stats: null
            });
            teams[i].chosen = true;
            var oppIdx = findTeamIndex(teams[i].opponent);
            teams[oppIdx].chosen = true;
            // console.log('team[i]...', teams[i]);
            // console.log('scope.games', $scope.games);
          }
        }
        // if(i >= teams.length && $scope.games.length <= 10) i=0;
      // }
      console.log('scope.games in construct scoreboard', $scope.games);
    }

    $http.post('/api/scorekeeper', {})
      .success(function(allGames){
        $scope.tempGameInfo = allGames;
        $scope.games = allGames;
        // $scope.games.forEach(function(game){
        //   if(game.gameId == scoreUpdateObj.gameId) {
        //     game.stats = scoreUpdateObj.body;

        //     //find which team these stats were sent by, by the key, then update team1
        //     var thisTeam;
        //     teamdatacopy.forEach(function(team){
        //       if(team.key == scoreUpdateObj.body[5]) {
        //         thisTeam = team.name;
        //       }
        //     })
        //     if(thisTeam == game.team1) {
        //       game.team1score = game.stats[6].thisTeamScore;
        //       game.team2score = game.stats[6].otherTeamScore;
        //     } else {
        //       game.team2score = game.stats[6].thisTeamScore;
        //       game.team1score = game.stats[6].otherTeamScore;
        //     }
        //     // if(scoreUpdateObj.body[5] == )
        //     //   game.team1score
        //   }
        // })
      })
      .error(function(err){
        if(err) console.log(err);
      })

    socket.on('newGameUpdate', function(info) {
        $scope.teams = info;
        console.log('about to apply to scope....');
        $scope.$apply();
    });

    socket.on('newScoreUpdate', function(scoreUpdateObj) {
        $scope.scorestuff = scoreUpdateObj;
        $scope.games.forEach(function(game){
          if(game.gameId == scoreUpdateObj.gameId) {
            game.stats = scoreUpdateObj.body;

            //find which team these stats were sent by, by the key, then update team1
            var thisTeam;
            teamdatacopy.forEach(function(team){
              if(team.key == scoreUpdateObj.body[5]) {
                thisTeam = team.name;
              }
            })
            console.log('WTFFFFFFFFF game.stats[6]', game.stats[6]);
            if(thisTeam == game.team1) {
              game.team1score = game.stats[6].score.thisTeamScore;
              game.team2score = game.stats[6].score.otherTeamScore;
              // console.log('game after updating', game);
            } else {
              game.team2score = game.stats[6].score.thisTeamScore;
              game.team1score = game.stats[6].score.otherTeamScore;
              console.log('game after updating', game);
            }
            // if(scoreUpdateObj.body[5] == )
            //   game.team1score
          }
          // return game;
        })
        console.log('about to apply to sc0000pe');
        $scope.$apply();
    });
  });
