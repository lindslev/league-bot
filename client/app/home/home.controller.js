'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope) {

    $scope.pubbers = [];

    // $http.post('/api/scorekeeper', {})
    //   .success(function(pubbers){
    //     $scope.pubbers = pubbers;
    //     // $scope.redscore = gem.redScore;
    //     // $scope.bluescore = gem.blueScore;
    //     // $scope.gemscore = gem.captures;
    //     // $scope.gemTags = gem.tags || 0;
    //     // if(gem.team == '1') {
    //     //   $scope.gemTeam = 'red';
    //     // } else {
    //     //   $scope.gemTeam = 'blue';
    //     // }
    //   })
    //   .error(function(err){
    //     if(err) console.log(err);
    //   })

    socket.on('pubber', function(info) {
      $scope.pubbers = info;
        // var playerTeam, gameState;
        // info.team == '1' ? playerTeam = 'red' : playerTeam = 'blue';
        // if(info.state == '1') {
        //   gameState = 'in progress';
        // } else if(info.state == '2') {
        //   gameState = 'complete';
        // } else {
        //   gameState = 'about to begin';
        // }
        // console.log('gameState in controller socket', gameState);
        // var playerObj = {
        //   player: info.name,
        //   redScore: info.red,
        //   blueScore: info.blue,
        //   captures: info.caps,
        //   tags: info.tags,
        //   team: playerTeam,
        //   state: gameState,
        //   server: info.server,
        //   map: info.map
        // }

        // var notAlreadyInPubbers = true;
        // $scope.pubbers.forEach(function(pubber, idx){
        //   if(pubber.player == info.name) {
        //     $scope.pubbers[idx] = playerObj;
        //     notAlreadyInPubbers = false;
        //   }
        // });
        // if(notAlreadyInPubbers) $scope.pubbers.push(playerObj);
        // $scope.redscore = message.red;
        // $scope.bluescore = message.blue;
        // $scope.gemscore = message.caps;
        // $scope.gemTags = message.tags;
        // if(message.team == '1') {
        //   $scope.gemTeam = 'red';
        // } else {
        //   $scope.gemTeam = 'blue';
        // }
        console.log('about to apply to scope....');
        $scope.$apply();
    });
  });
