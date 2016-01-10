var _ = require('lodash');

var DB = require('mongodb-next');
var DB_LINK = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp-v2';
var db = DB(DB_LINK);

var helpers = require('./../../helpers');
var getWeekNumber = helpers.getWeekNumber;

var MLTP_TEAMS = require('./../../constants').MLTP_TEAMS;

exports.index = function(req, res) {
  var STREAM_DATA = req.body;
  db.connect.then(function() {
    return db.collection('live').findOne({ WEEK_NUMBER: getWeekNumber() })
  }).then(function (week) {
    var league = STREAM_DATA.league;
    var team = STREAM_DATA.team;
    if ( !isValidTeamName(team) || !isLeagueRight(team, league) ) {
      throw new Error('Not valid submission.');
      return res.json(400);
    }
    var games = week[league];
    var gameToUpdate = _.find(games, function(game) {
      return game.TEAMS[0] === team || game.TEAMS[1] === team;
    });
    gameToUpdate.STREAM = { time: STREAM_DATA.time, link: STREAM_DATA.link };
    games = replaceGameInGames(gameToUpdate, games);
    return db.collection('live').findOne({ WEEK_NUMBER: getWeekNumber() }).set(league, games);
  }).then(function(qak) {
    res.json(200);
  }).catch(function(err) {
    res.json(err);
  });
}

function replaceGameInGames(update, games) {
  _.remove(games, function (game) {
    return game.TEAMS[0].indexOf(update.TEAMS[0]) > -1;
  });
  games.push(update);
  return games;
}

exports.auth = function(req, res) {
  var CODE = req.body.code;
  if ( CODE === 'qakboop123' ) {
    res.json(200);
  } else {
    res.json(400);
  }
}

function isValidTeamName(name) {
  return !!_.find(MLTP_TEAMS, function(t) {
    return t.name === name || t.minorsName === name;
  });
}

function isLeagueRight(name, league) {
  var leagueRight = false;
  MLTP_TEAMS.forEach(function(t) {
    if ( t.name === name && league === 'MAJORS' ) leagueRight = true;
    if ( t.minorsName === name && league === 'MINORS' ) leagueRight = true;
  });
  return leagueRight;
}
