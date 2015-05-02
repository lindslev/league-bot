'use strict';

angular.module('mltpApp')
  .factory('SeasonData', function () {
    var seasons = {
      7 : {
        weeks: ['1/18/2015', '1/25/2015','2/8/2015','2/22/2015',
                      '3/1/2015','3/8/2015','3/15/2015', '3/22/2015', '3/29/2015'],
        maps: [['http://i.imgur.com/Aa2JVEc.png','Smirk'],['http://i.imgur.com/wLQsUUc.png#map-velocity','Velocity'],
                    ['http://i.imgur.com/iEmJy16.png#map-wormy','Wormy'],['http://i.imgur.com/9uZSGOn.png#map-danger-zone','Danger Zone 3'],
                    ['http://i.imgur.com/zfqqa5C.png','Iron'],['http://i.imgur.com/G2IRxWd.png#map-45','45'],
                    ['http://i.imgur.com/VixChXZ.png#map-boombox','Boombox'],['http://i.imgur.com/xgoaXJy.png#map-star','Star'],['/#/schedule','Community Vote'],['http://i.imgur.com/Aa2JVEc.png','Smirk']],
        games: '/api/season/7/games',
        teams: '/api/season/7/teams'
      }
    }

    return seasons;
  });
