'use strict';

angular.module('mltpApp')
  .controller('HomeCtrl', function ($http, $scope, $timeout) {
    // $scope.test = function() {
    //   $http.get('http://674c6b3d.ngrok.com/groupster/arc')
    //     .success(function(res) {
    //       console.log('...', res);
    //     })
    // }
    $scope.comments = [];

    $http.get('http://serene-headland-9709.herokuapp.com/privatemajor')
      .success(function(res) {
        $scope.comments = res[0].comments;
      })

    $scope.submitComment = function() {
      var comment = { comment : $scope.comment };
      comment = JSON.stringify(comment);
      $scope.comments.push($scope.comment);
      $scope.comment = '';
      $http.post('http://serene-headland-9709.herokuapp.com/privatemajor', comment)
        .success(function(res) {
          console.log(res);
        })
    }
  });
