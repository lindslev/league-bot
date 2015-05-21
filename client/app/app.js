'use strict';

angular.module('mltpApp', ['ngRoute'])
 .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/client/app/home/home.html',
        controller: 'HomeCtrl'
      })
      .when('/balloffame', {
        templateUrl: '/client/app/balloffame/balloffame.html',
        controller: 'HomeCtrl'
      })
      .when('/live', {
        templateUrl: '/client/app/live/live.html',
        controller: 'LiveCtrl'
      })
      .when('/teams', {
        templateUrl: '/client/app/teams/teams.html',
        controller: 'TeamsCtrl'
      })
      .when('/teams/:name', {
        templateUrl: '/client/app/teams/team.html',
        controller: 'TeamsCtrl'
      })
      .when('/standings', {
        templateUrl: '/client/app/teams/standings.html',
        controller: 'TeamsCtrl'
      })
      .when('/standings/:division', {
        templateUrl: '/client/app/teams/div_standings.html',
        controller: 'TeamsCtrl'
      })
      .when('/schedule', {
        templateUrl: '/client/app/schedule/schedule.html',
        controller: 'ScheduleCtrl'
      })
      .when('/schedule/week/:id', {
        templateUrl: '/client/app/schedule/week.html',
        controller: 'ScheduleCtrl'
      })
      .when('/seasons', {
        templateUrl: '/client/app/seasons/seasons.html',
        controller: 'SeasonsCtrl'
      })
      .when('/seasons/:id', {
        templateUrl: '/client/app/seasons/season.html',
        controller: 'SeasonsCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
