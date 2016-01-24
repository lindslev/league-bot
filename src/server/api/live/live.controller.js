var socket = require('./../../app').socket;
var _ = require('lodash');
var moment = require('moment');

var DB = require('mongodb-next');
var DB_LINK = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp-v2';
var db = DB(DB_LINK);

var helpers = require('./../../helpers');
var getWeekNumber = helpers.getWeekNumber;
var isGameOver = helpers.isGameOver;
var isMajors = helpers.isMajors;
var isValidKey = helpers.isValidKey;
var getMinorsName = helpers.getMinorsName;
var getGameNumber = helpers.getGameNumber;
var getHalfNumber = helpers.getHalfNumber;
var getTeam = helpers.getTeam;

exports.index = function(req, res) {
	var PAYLOAD = req.body;
	if ( !isValidKey(PAYLOAD.userkey) ) res.json(400);
	updateLiveDocument(PAYLOAD);
	res.json(200);
};

exports.show = function(req, res) {
	getLiveDocument(res);
};

var CONSTANTS = require('./../../constants');
var MLTP_TEAMS = CONSTANTS.MLTP_TEAMS;

function getLiveDocument(res) {
	db.connect.then(function() {
		return db.collection('live').findOne({ WEEK_NUMBER: getWeekNumber() });
	}).then(function (week) {
		if ( !week ) return res.json(400);
		res.json(week);
	});
}

function updateLiveDocument(PAYLOAD) {
	var IS_MAJORS = isMajors(PAYLOAD.userkey);
	db.connect.then(function () {
		return db.collection('live').findOne({ WEEK_NUMBER: getWeekNumber() });
	}).then(function (week) {
		var LEAGUE_TYPE = IS_MAJORS ? 'MAJORS' : 'MINORS';
		var week = getUpdatedWeek(week, PAYLOAD, IS_MAJORS);
		return db.collection('live').findOne({ WEEK_NUMBER: getWeekNumber() }).set(LEAGUE_TYPE, week[LEAGUE_TYPE]);
	}).then(function(qak) {
		return db.collection('live').findOne({ WEEK_NUMBER: getWeekNumber() });
	}).then(function (week) {
		var THIS_TEAM = getTeam(PAYLOAD.userkey);
		var TEAM_NAME = IS_MAJORS ? THIS_TEAM.name : THIS_TEAM.minorsName;
		var OPPONENT_MAJORS_NAME = THIS_TEAM.schedule[getWeekNumber() - 1];
		var OPPONENT = IS_MAJORS ? OPPONENT_MAJORS_NAME : getMinorsName(OPPONENT_MAJORS_NAME);
		var thisTeamScore = PAYLOAD.score.thisTeamScore;
		var otherTeamScore = PAYLOAD.score.otherTeamScore;
		PAYLOAD.score = {};
		PAYLOAD.score[TEAM_NAME] = thisTeamScore;
		PAYLOAD.score[OPPONENT] = otherTeamScore;
		PAYLOAD.LAST_UPDATE = {
			time: moment().subtract(5, 'h').format('hh:mmA'),
			game: PAYLOAD.game,
			half: PAYLOAD.half
		};
		var leagueType = IS_MAJORS ? 'MAJORS' : 'MINORS';
		var individualHalfStats = getStatsFromWeek(week, leagueType, TEAM_NAME);
		PAYLOAD.individualHalfStats = individualHalfStats;
		var LIVE_OBJ = _.assign({}, PAYLOAD, { teams: [TEAM_NAME, OPPONENT], majors: IS_MAJORS });
		if ( isGameOver(PAYLOAD) ) LIVE_OBJ.GAME_OVER = true;
		socket.emit('live', LIVE_OBJ);
	})
}

function getUpdatedWeek(week, PAYLOAD, IS_MAJORS) {
	var LEAGUE_TYPE = IS_MAJORS ? 'MAJORS' : 'MINORS';
	var THIS_TEAM = getTeam(PAYLOAD.userkey);
	var TEAM_NAME = IS_MAJORS ? THIS_TEAM.name : THIS_TEAM.minorsName;
	var gameToUpdate = getUpdatedGame(week, PAYLOAD, IS_MAJORS, LEAGUE_TYPE);
	return replaceGameInWeek(week, LEAGUE_TYPE, TEAM_NAME, gameToUpdate);
}

function getUpdatedGame(week, PAYLOAD, IS_MAJORS, LEAGUE_TYPE) {
	var KEY = PAYLOAD.userkey;
	var LEAGUE_GAMES = week[LEAGUE_TYPE];
	var THIS_TEAM = getTeam(KEY);
	var TEAM_NAME = IS_MAJORS ? THIS_TEAM.name : THIS_TEAM.minorsName;
	var OPPONENT_MAJORS_NAME = THIS_TEAM.schedule[getWeekNumber() - 1];
	var OPPONENT = IS_MAJORS ? OPPONENT_MAJORS_NAME : getMinorsName(OPPONENT_MAJORS_NAME);
	var gameToUpdate = _.find(LEAGUE_GAMES, function (game) {
		return game.TEAMS.indexOf(TEAM_NAME) > -1;
	});
	var scoreToUpdate = gameToUpdate[getGameNumber(PAYLOAD.game)][getHalfNumber(PAYLOAD.half)];
	scoreToUpdate[TEAM_NAME] = PAYLOAD.score.thisTeamScore;
	scoreToUpdate[OPPONENT] = PAYLOAD.score.otherTeamScore;
	gameToUpdate.RECENT_STATS = PAYLOAD.stats;
	gameToUpdate.LAST_UPDATE = {
		time: moment().subtract(5, 'h').format('hh:mmA'),
		game: PAYLOAD.game,
		half: PAYLOAD.half
	};
	if ( +PAYLOAD.state === 2 ) { // update individual half stats
		var stats = gameToUpdate.individualHalfStats || { G1H1: null, G1H2: null, G2H1: null, G2H2: null };
		var halfString = 'G' + PAYLOAD.game + 'H' + PAYLOAD.half;
		stats[halfString] = PAYLOAD.stats;
		gameToUpdate.individualHalfStats = stats;
	}
	if ( isGameOver(PAYLOAD) ) gameToUpdate.GAME_OVER = true;
	return gameToUpdate;
}

function replaceGameInWeek(week, LEAGUE_TYPE, TEAM_NAME, gameToUpdate) {
	_.remove(week[LEAGUE_TYPE], function (game) {
		return game.TEAMS.indexOf(TEAM_NAME) > -1;
	});
	week[LEAGUE_TYPE].push(gameToUpdate);
	return week;
}

function getStatsFromWeek(week, league, team) {
	var game = _.find(week[league], function(game) {
		return game.TEAMS.indexOf(team) > -1;
	}) || {};
	return game.individualHalfStats;
}
