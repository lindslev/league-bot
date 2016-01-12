var socket = require('./../../app').socket;

var DB = require('mongodb-next');
var DB_LINK = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp-v2';
var db = DB(DB_LINK);

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('r7WRzIXqZC2ZNXcaq_KF0A');

var helpers = require('./../../helpers');
var getWeekNumber = helpers.getWeekNumber;
var isGameOver = helpers.isGameOver;
var isMajors = helpers.isMajors;
var isValidKey = helpers.isValidKey;
var getGameNumber = helpers.getGameNumber;
var getHalfNumber = helpers.getHalfNumber;
var makeTSV = helpers.makeTSV;

exports.index = function(req, res) {
	var PAYLOAD = req.body;
	var KEY = PAYLOAD.userkey;
	var IS_MAJORS = isMajors(KEY);
	KEY = IS_MAJORS ? KEY : KEY.split('_m')[0];
	if ( !isValidKey(PAYLOAD.userkey) ) res.json(400);
	db.connect
		.then(updateTeamInDB.bind(this, PAYLOAD))
		.then(function() {
			return db.collection('teams_s9').findOne({ key: KEY });
		}).then(mandrillTSVs.bind(this, res, PAYLOAD));
};

exports.show = function(req, res) {
	getTeamsDocuments(res);
};

function getTeamsDocuments(res) {
	db.connect.then(function() {
		return db.collection('teams_s9').find();
	}).then(function (teams) {
		if ( !teams ) return res.json(400);
		res.json(teams);
	});
}

function updateTeamInDB(PAYLOAD) {
	var KEY = PAYLOAD.userkey;
	var IS_MAJORS = isMajors(KEY);
	KEY = IS_MAJORS ? KEY : KEY.split('_m')[0];
	return db.collection('teams_s9').findOne({ key: KEY })
	.then(function (team) {
		if ( !team ) return;
		var teamWeeks = team.WEEKS;
		var LEAGUE = isMajors(KEY) ? 'MAJORS' : 'MINORS';
		var GAME_NUM = getGameNumber(PAYLOAD.game);
		var HALF_NUM = getHalfNumber(PAYLOAD.half);
		var weekToUpdate = teamWeeks[getWeekNumber() - 1];
		weekToUpdate[LEAGUE][GAME_NUM][HALF_NUM].push(PAYLOAD.stats);
		teamWeeks[getWeekNumber() - 1] = weekToUpdate;
		return db.collection('teams_s9').findOne({ key: KEY }).set('WEEKS', teamWeeks);
	});
}

function mandrillTSVs(res, PAYLOAD, team) {
	if ( isGameOver(PAYLOAD) ) {
		var KEY = PAYLOAD.userkey;
		var IS_MAJORS = isMajors(KEY);
		var LEAGUE = IS_MAJORS ? 'MAJORS' : 'MINORS';
		var week = team.WEEKS[getWeekNumber() - 1];
		var teamName = IS_MAJORS ? team.name : team.minorsName;
		var stats = [
			{ name: teamName, game: 1, half: 1, stats: week[LEAGUE].GAME_ONE.HALF_ONE },
			{ name: teamName, game: 1, half: 2, stats: week[LEAGUE].GAME_ONE.HALF_TWO },
			{ name: teamName, game: 2, half: 1, stats: week[LEAGUE].GAME_TWO.HALF_ONE },
			{ name: teamName, game: 2, half: 2, stats: week[LEAGUE].GAME_TWO.HALF_TWO }
		];
		var TSVs = buildTSVs(stats);
		var message = { subject: 'Week ' + getWeekNumber() + ': ' + teamName + ' (' + LEAGUE + ')',
										from_email: 'geminycrickett@gmail.com', from_name: 'Gem_BOT',
										to: [{ email: 'geminycrickett@gmail.com', name: 'Gem' },
												 { email: 'jackjwalton@gmail.com', name: 'Ash' },
												 { email: 'mrgone92@gmail.com', name: 'Mr.Gone' }
												],
										important: false, track_opens: true, auto_html: false, preserve_recipients: true,
										merge: false, attachments: TSVs };
		mandrill_client.messages.send({ message: message, async: false, ip_pool: 'Main Pool' }, function(result) {
			console.log('Mandrill success for team: ', teamName);
			res.json(200);
		}, function(e) {
			console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		});
	}
}

function buildTSVs(stats) {
	var tsvs = [];
	stats.forEach(function(half) {
		half.stats.forEach(function(data) {
			var fileName = '' + half.name + 'game' + half.game + 'half' + half.half + '.tsv';
			var tsv = makeTSV(data);
			var attachment = { type: 'data:text/tsv;charset=utf-8', name: fileName, content: tsv };
			tsvs.push(attachment);
		});
	});
	return tsvs;
}
