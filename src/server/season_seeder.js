var MLTP_TEAMS = require('./constants').MLTP_TEAMS;
var WEEKS_IN_SEASON = MLTP_TEAMS[0].schedule.length;

var DB = require('mongodb-next');
var DB_LINK = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp-v2';
var db = DB(DB_LINK);
var _ = require('lodash');

var getMinorsName = require('./helpers').getMinorsName;

module.exports = function() {
	db.connect.then(function () {
		db.collection('teams_s9').find({ name: MLTP_TEAMS[0].name })
			.then(function(result) {
				var NOT_SEEDED = result.length === 0;
				if ( NOT_SEEDED ) {
					batchTeams(db.collection('teams_s9').batch());
					batchLive(db.collection('live').batch());
				}
			});
	});
}

function batchTeams(batch) {
	MLTP_TEAMS.forEach(function (team) {
		var teamDoc = buildTeamCollectionDocument(team);
		batch.insert(teamDoc);
	});
	batch.then(function() {
		console.log('Successfully seeded the teams collection.');
	});
}

function buildTeamCollectionDocument(team) {
	var teamDoc =  _.assign({}, team, { WEEKS: [] });
	team.schedule.forEach(function (opponent, idx) {
		teamDoc['WEEKS'].push({
			WEEK_NUMBER: idx + 1,
			AGAINST: opponent,
			MAJORS: {
				GAME_ONE: {
					HALF_ONE: [], HALF_TWO: []
				},
				GAME_TWO: {
					HALF_ONE: [], HALF_TWO: []
				}
			},
			MINORS: {
				GAME_ONE: {
					HALF_ONE: [], HALF_TWO: []
				},
				GAME_TWO: {
					HALF_ONE: [], HALF_TWO: []
				}
			}
		});
	});
	return teamDoc;
}

function batchLive(batch) {
	var LIVE_DOC = buildGameCollectionDocument();
	LIVE_DOC.WEEKS.forEach(function (week) {
		batch.insert(week);
	});
	batch.then(function() {
		console.log('Successfully seeded the live collection.');
	});
}

function buildGameCollectionDocument() {
	var liveDoc = { WEEKS: [] };
	for ( var i = 0; i < WEEKS_IN_SEASON; i++ ) {
		var WEEK = {
			WEEK_NUMBER: i + 1,
			MAJORS: [],
			MINORS: []
		};
		MLTP_TEAMS.forEach(function (team) {
			var gameAdded = isGameAddedAlready(team, WEEK.MAJORS);
			if ( !gameAdded ) {
				WEEK.MAJORS.push(buildGame(team, i));
				WEEK.MINORS.push(buildGame(team, i, true));
			}
		});
		liveDoc.WEEKS.push(WEEK);
	}
	return liveDoc;
}

function isGameAddedAlready(team, games) {
	return !!_.find(games, function(game) {
		return game.TEAMS.indexOf(team.name) > -1;
	});
}

function buildGame(team, i, minors) {
	var teamName = minors ? team.minorsName : team.name;
	var opponentName = minors ? getMinorsName(team.schedule[i]) : team.schedule[i];
	var GAME = {
		TEAMS: [teamName, opponentName],
		GAME_ONE: { HALF_ONE: {}, HALF_TWO: {} },
		GAME_TWO: { HALF_ONE: {}, HALF_TWO: {} },
		RECENT_STATS: {}
	};
	GAME.GAME_ONE.HALF_ONE[teamName] = null;
	GAME.GAME_ONE.HALF_ONE[opponentName] = null;
	GAME.GAME_ONE.HALF_TWO[teamName] = null;
	GAME.GAME_ONE.HALF_TWO[opponentName] = null;
	GAME.GAME_TWO.HALF_ONE[teamName] = null;
	GAME.GAME_TWO.HALF_ONE[opponentName] = null;
	GAME.GAME_TWO.HALF_TWO[teamName] = null;
	GAME.GAME_TWO.HALF_TWO[opponentName] = null;
	return GAME;
}
