'use strict';

angular.module('mltpApp', ['ngRoute'])
 .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/client/app/home/home.html',
        controller: 'HomeCtrl'
      })
      .when('/teams', {
        templateUrl: '/client/app/teams/teams.html',
        controller: 'TeamsCtrl'
      })
      .when('/teams/:name', {
        templateUrl: '/client/app/teams/team.html',
        controller: 'TeamsCtrl'
      })
      .when('/schedule', {
        templateUrl: '/client/app/schedule/schedule.html',
        controller: 'ScheduleCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
