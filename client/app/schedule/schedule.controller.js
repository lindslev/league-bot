'use strict';

angular.module('mltpApp')
  .controller('ScheduleCtrl', function ($http, $scope, $routeParams) {

    $scope.weekarr = ['1/18/2015', '1/25/2015','2/1/2015','2/8/2015','2/15/2015','2/22/2015',
                      '3/1/2015','3/8/2015','3/15/2015']

    var teamsdata, scheddata;
    $http.post('/api/teams', {})
      .success(function(teams){
        teamsdata = teams;

          $http.post('/api/schedule', {})
            .success(function(sched){
              sched.sort(function(a,b){
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

    $scope.onSeeMoreClick = function(game) {
      var idToShow = "#moreInfo" + game.gameId;
      angular.element(idToShow).slideToggle();
    }

    $scope.weekId = $routeParams.id || 1;
    if($scope.weekId) {
      var strToPost = '/api/schedule/week/' + $scope.weekId;
      console.log('strtopost', strToPost);
      $http.post(strToPost, {})
        .success(function(week){
        console.log('inside post success', week);
        $scope.games = [];
          for(var game in week) {
            if(game !== 'week' && game !== '_id') $scope.games.push(week[game]);
          }
          $scope.games.forEach(function(game){
            if(game.stats) {
              game.playerObjArr = [];
              for(var j=6; j < game.stats.length; j++) { //start at first player obj in stats arr
                game.playerObjArr.push(game.stats[j]);
              }
              j=0;
            }
          })
        })
        .error(function(err){
          if(err) console.log(err);
        })
    }
  });
