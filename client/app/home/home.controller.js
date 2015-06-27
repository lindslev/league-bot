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

    // var URL1 = 'http://localhost:4000/privatemajorlist';
    // var URL2 = 'http://localhost:4000/privatemajor/';

    var URL2 = 'http://serene-headland-9709.herokuapp.com/privatemajor/';
    var URL1 = 'http://serene-headland-9709.herokuapp.com/privatemajorlist';

    $http.get(URL1)
      .success(function(res) {
        if(res[0]) $scope.comments = res[0].comments;
      })

    $scope.submitComment = function() {
      // var comment = { comment : $scope.comment };
      // comment = JSON.stringify(comment);
      if($scope.comments.indexOf($scope.comment) > -1) {
        //do nothing
        console.log('Comment already exists')
      } else {
        var comment = encodeURIComponent($scope.comment);
        $scope.comments.push($scope.comment);
        $scope.comment = '';
        $http.get(URL2 + comment)
          .success(function(res) {
            console.log(res);
          })
      }
    }
  });
