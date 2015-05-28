'use strict';

angular.module('mltpApp')
  .factory('SeasonData', function () {
    var seasons = {
      1: {
        spreadsheet: 'https://docs.google.com/spreadsheet/ccc?key=0AkfNPWbAf5FhdFNNSG9aVmliWVA0ZDRKclBCbjBJRnc#gid=23'
      },
      2: {
        spreadsheet: 'https://docs.google.com/spreadsheet/ccc?key=0AkfNPWbAf5FhdGpDUXIzZUxrbERWU3I4UU44MkZFUGc#gid=7'
      },
      3: {
        spreadsheet: 'https://docs.google.com/spreadsheet/ccc?key=0Avyp5w3MmFWRdHVuWGFoZDBYRGlQXzdRV0lESk1USEE#gid=6'
      },
      4: {
        spreadsheet: 'https://docs.google.com/spreadsheet/ccc?key=0Avyp5w3MmFWRdFRKdGEwbW9tWnd0dWRQMi1tNzBFa2c#gid=2'
      },
      5: {
        spreadsheet: 'https://docs.google.com/spreadsheets/d/1n_JC6VaN-nhvkjTpUXywirknKrmTCVMEnWZBAUwgP7c/edit?pli=1#gid=1487646455'
      },
      6 : {
        spreadsheet: 'https://docs.google.com/spreadsheets/d/1E0sq06JhLpvLbIpCKrodLMXAeaMKK6CLaI-NFgkSwZU/edit#gid=1341912944'
      },
      7 : {
        weeks: ['1/18/2015', '1/25/2015','2/8/2015','2/22/2015',
                      '3/1/2015','3/8/2015','3/15/2015', '3/22/2015', '3/29/2015'],
        maps: [['http://i.imgur.com/Aa2JVEc.png','Smirk'],['http://i.imgur.com/wLQsUUc.png#map-velocity','Velocity'],
                    ['http://i.imgur.com/iEmJy16.png#map-wormy','Wormy'],['http://i.imgur.com/9uZSGOn.png#map-danger-zone','Danger Zone 3'],
                    ['http://i.imgur.com/zfqqa5C.png','Iron'],['http://i.imgur.com/G2IRxWd.png#map-45','45'],
                    ['http://i.imgur.com/VixChXZ.png#map-boombox','Boombox'],['http://i.imgur.com/xgoaXJy.png#map-star','Star'],['/#/schedule','Community Vote'],['http://i.imgur.com/Aa2JVEc.png','Smirk']],
        games: '/api/season/7/games',
        teams: '/api/season/7/teams',
        spreadsheet: 'https://docs.google.com/spreadsheets/d/1gYRmRLbaxMyyWdLPh_7gkR5dHlH0qNwEExsd9p5uTM0/edit#gid=740173053'
      },
      8 : {
        weeks: ['6/7/2015','6/14/2015', '6/21/2015','6/28/2015','7/12/2015',
                '7/19/2015','7/26/2015','8/2/2015', '8/9/2015'],
        maps: [['http://i.imgur.com/0lUIxgA.png#map-pilot', 'Pilot'], ['http://i.imgur.com/VixChXZ.png#map-boombox', 'Boombox'], ['http://i.imgur.com/hL0ITjs.png#map-monarch', 'Monarch'], ['http://i.imgur.com/iEmJy16.png#map-wormy', 'Wormy'],['http://i.imgur.com/zfqqa5C.png#map-iron','IRON'],['http://i.imgur.com/Aa2JVEc.png', 'Smirk'],['http://i.imgur.com/wLQsUUc.png#map-velocity', 'Velocity'], ['/#/schedule', 'Community'],['http://i.imgur.com/bpxNkeb.jpg#map-geokoala','GeoKoala'],['http://i.imgur.com/0lUIxgA.png#map-pilot', 'Pilot']]
      }
    }

    return seasons;
  });
