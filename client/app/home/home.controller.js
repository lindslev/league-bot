'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope, $timeout) {
    // $scope.test = function() {
    //   $http.get('http://674c6b3d.ngrok.com/groupster/arc')
    //     .success(function(res) {
    //       console.log('...', res);
    //     })
    // }
    var vid = document.getElementById("audio");
    vid.volume = 0.3;
  });
