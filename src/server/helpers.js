var CONSTANTS = require('./constants');
var _ = require('lodash');

module.exports = {
  getWeekNumber: function() {
    var weekMS = 604800000;
    var compareMS = new Date(2016, 0, 8).getTime(); // 2 days before scheduled week 1 start date
    var todayMS = new Date().getTime();
    var whichWeek = Math.ceil((todayMS - compareMS) / weekMS);
    if ( whichWeek < 1 ) whichWeek = 1;
    if ( whichWeek > CONSTANTS.WEEKS_IN_SEASON ) whichWeek = CONSTANTS.WEEKS_IN_SEASON;
    return whichWeek;
  },
  isMajors: function(key) {
    return key.indexOf('_m') === -1;
  },
  isValidKey: function(key) {
    return CONSTANTS.KEYS.indexOf(key) > -1;
  },
  getMinorsName: function(name) {
  	return _.find(CONSTANTS.MLTP_TEAMS, function (team) {
  		return team.name === name;
  	}).minorsName;
  },
  getGameNumber: function(num) {
    return Number(num) === 1 ? 'GAME_ONE' : 'GAME_TWO';
  },
  getHalfNumber: function(num) {
    return Number(num) === 1 ? 'HALF_ONE' : 'HALF_TWO';
  },
  getTeam: function(key) {
  	return _.find(CONSTANTS.MLTP_TEAMS, function (team) {
  		return team.key === key || team.key + '_m' === key;
  	});
  },
  isGameOver: function(PAYLOAD) {
    return +PAYLOAD.state === 2 && +PAYLOAD.game === 2 && +PAYLOAD.half === 2;
  },
  makeTSV: function(stats) {
    var result = '';
    stats.forEach(function(player, i) {
        if(i == 0)
            result += Object.keys(player).join('\t') + '\r\n';
        var values = [];
        for(key in player) {
            values.push(player[key]);
        };
        result += values.join('\t') + '\r\n';
    });
    return new Buffer(result).toString('base64');
  }
};
