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

    // $scope.onSeeMoreClick = function(game) {
    //   var idToShow = "#moreInfo" + game.gameId;
    //   angular.element(idToShow).slideToggle();
    // }

    $scope.weekId = $routeParams.id || 1;
    if($scope.weekId) {
      var strToPost = '/api/schedule/week/' + $scope.weekId;
      $http.post(strToPost, {})
        .success(function(week){
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
