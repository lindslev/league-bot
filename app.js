var koa = require('koa');
var router = require('koa-router');
var bodyParser = require('koa-bodyparser');
var uuid = require('node-uuid');
var json = require('koa-json');
var send = require('koa-send');
var serve = require('koa-static-folder');
var cors = require('koa-cors');
var mount = require('koa-mount');
var helmet = require('koa-helmet');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('r7WRzIXqZC2ZNXcaq_KF0A');
var app = koa();
app.use(bodyParser());
app.use(router(app));
app.use(json());
app.use(cors());
app.use(helmet.cacheControl());
app.use(serve('./client/bower_components'));
app.use(serve('./client/app'));
app.use(serve('./client/assets'));
app.use(serve('./client/components'));

var comongo = require('co-mongo');
var co = require('co');
var cjson = require('cjson');
var teamdata = [];
var games = [];
var teams = [];

var DB = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp-dev';
var keys = ['11abc8','12def8','13ghi8','14jkl8','15mno8',
            '21abc8','22def8','23ghi8','24jkl8','25mno8',
            '31abc8','32def8','33ghi8','34jkl8','35mno8',
            '51abc8','52def8','53ghi8','54jkl8','55mno8'];

co(function *() {
  var teams = yield cjson.load('./server/db/s8teams.json');
  var db = yield comongo.connect(DB);
  var collection = yield db.collection('s8teams');
  var count = yield collection.count();
  var gamesColl = yield db.collection('s8games');
  var gameCount = yield gamesColl.count();
  var userTracking = yield db.collection('analytics');
  var userCount = yield userTracking.count();

  console.log('da fuq is the game count homie', gameCount)

  if(userCount == 0) {
    yield userTracking.insert({count: 'connect', numberOf: 0});
  }

  /*** populating teams in the db ***/
  if(count == 0) {
    for(var conference in teams.teams.conferences) {
      for(var division in teams.teams.conferences[conference]) {
        var conf = teams.teams.conferences[conference];
        for(var team in conf[division]){
          var div = conf[division];
          yield collection.insert(
                            { name: team,
                              captain: div[team].captain,
                              roster: div[team].roster,
                              server: div[team].server,
                              key: div[team].key,
                              schedule: div[team].schedule,
                              week1: div[team].week1,
                              week2: div[team].week2,
                              week3: div[team].week3,
                              week4: div[team].week4,
                              week5: div[team].week5,
                              week6: div[team].week6,
                              week7: div[team].week7,
                              week8: div[team].week8,
                              week9: div[team].week9
                            });
        }
      }
    }
  }
  teamdata = yield collection.find().toArray();

  /** construct the schedule (and scoreboards) in the games db **/
  function findTeamIndex(teamz, teamToFind) {
    var idx;
    teamz.forEach(function(team, i){
      if(team.name.toLowerCase() == teamToFind.toLowerCase()) {
        idx = i;
      }
    })
    return idx;
  }

  if(gameCount == 0) { //needs to only be run at the start of a new season
    var x = 1;
    while(x < 10) {
      teams = teamdata.map(function(team){
        var thisTeamSchedule = team.schedule;
        var thisTeamOpponent = thisTeamSchedule[x - 1] || 'none';
        return { name: team.name, chosen: false, opponent: thisTeamOpponent};
      });
      for(var i=0; i < teams.length; i++) {
        if(!teams[i].chosen) {
          var gameID = games.length + 1;
          games.push({
            team1: teams[i].name,
            team2: teams[i].opponent,
            g1h1: null,
            g1h2: null,
            g2h1: null,
            g2h2: null,
            gameId: gameID,
            stats: null
          });
          teams[i].chosen = true;
          var oppIdx = findTeamIndex(teams, teams[i].opponent);
          teams[oppIdx].chosen = true;
        }
      }
      i=0;
      var objForDBColl = { "week": x };
      // build obj to insert to collection
      for(var j=0; j < games.length; j++) {
        objForDBColl[games[j].gameId] = {
          team1: games[j].team1,
          team2: games[j].team2,
          g1h1: null,
          g1h2: null,
          g2h1: null,
          g2h2: null,
          gameId: games[j].gameId,
          stats: null
        }
      }
      yield gamesColl.update({weekId: x}, objForDBColl, {upsert: true});
      j=0;
      games = [];
      x++;
    }
  }

  yield db.close();
});
/***/

/*** serving index.html client side for angular ***/
app.get('/', function *() {
  yield send(this, __dirname + '/client/index.html');
});

/*** team data for client side ***/
app.post('/api/teams', function *(){
  var db = yield comongo.connect(DB);
  var teamsColl = yield db.collection('s8teams');
  var teams = yield teamsColl.find().toArray();
  this.body = teams;
  yield db.close();
});

var server = require('http').createServer(app.callback());

var io = require('socket.io').listen(app.listen(process.env.PORT || 4000));

io.on('connection', function(socket){
  console.log('User connected.');
  co(analyzeConnections());
});

function *analyzeConnections(){
  var db = yield comongo.connect(DB);
  var userTracking = yield db.collection('analytics');
  var userCount = yield userTracking.findOne({count:'connect'});
  userCount.numberOf += 1;
  yield userTracking.update({count:'connect'}, userCount);
  yield db.close();
}

// expected req format from userscript:
//  map, server, game, half, key, score, state, stats...
  // 0     1      2      3    4    5      6

/** function called when post request is made at the end of games **/
function *updateTeamsDB(teamId, gameStats) {
  var db = yield comongo.connect(DB);
  var teams = yield db.collection('s8teams');
  var whichWeek = getWeekNum();
  var thisTeam = yield teams.findOne({key: teamId});
  var weekStr = "week" + whichWeek;
  var gameNum = "game" + gameStats[2].game;
  var halfNum = "half" + gameStats[3].half;
  ((thisTeam[weekStr])[gameNum])[halfNum].push(gameStats);
  yield teams.update({key: teamId}, thisTeam);
  yield db.close();
}

var globalSent = false;
/* request made at the end of games (or when games are ended early) */
app.post('/api/teams/game/stats', cors({origin:true}), function*(){
  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('game end stats: ', body);
  var teamId = (body[4]).userkey;
  if(keys.indexOf(teamId) < 0) {
    this.body = "Not a valid API key.";
    throw new Error('Not a valid API key.');
  }
  var completed = yield updateTeamsDB(teamId, body);
  io.sockets.emit('newGameUpdate', body);
  if(body[2].game == 2 && body[3].half == 2 && body[6].state == 2) { //if g2h2 and state is over
    yield sentStatsCheck(teamId); //check if stats for this game have already been sent
    // if(!globalSent){ // removing this conditional for now due to lp/tears issue of week 1
    yield mandrillTSVs(teamId);
    console.log('mandrilling for teamId', teamId);
    // }
  }
  this.body = 'SUCCESS';
});

function *sentStatsCheck(teamId) { //checks to see if already mandrill'd opponent's stats
  var db = yield comongo.connect(DB);
  var teams = yield db.collection('s8teams');
  var team = yield teams.findOne({key:teamId});
  var weekNum = getWeekNum();
  var opponentName = team.schedule[weekNum - 1];
  var opponent = yield teams.findOne({name:opponentName});
  var weekStr = "week" + weekNum;
  if(opponent[weekStr].hasOwnProperty('sent')) {
    globalSent = true;
  } else {
    globalSent = false;
  }
  yield db.close();
}

function makeTSV(statsData) {
  var result = '';
  statsData.forEach(function(player, i) {
      if(i == 0)
          result += Object.keys(player).join('\t') + '\r\n';
      var values = [];
      for(key in player) {
          values.push(player[key]);
      };
      result += values.join('\t') + '\r\n';
  });
  // this will take the resulting string and base64 encode it.
  var encodedResult = new Buffer(result).toString('base64');
  return(encodedResult);
}

function *mandrillTSVs(teamId) {
  var tsvArr = [];
  var db = yield comongo.connect(DB);
  var teams = yield db.collection('s8teams');
  var team = yield teams.findOne({key:teamId});
  var weekStr = "week" + getWeekNum();
  var game1 = team[weekStr].game1;
  var game2 = team[weekStr].game2;
  for(var half in game1) {
    for(var i=0; i < game1[half].length; i++) {
      var currentStatsArr = (game1[half])[i];
      var statsData = currentStatsArr.slice(7,currentStatsArr.length);
      var thisTsv = makeTSV(statsData);
      var fileName = "" + team.name + "game1" + half + ".tsv";
      var objToPush = {
        "type": "data:text/tsv;charset=utf-8",
        "name": fileName,
        "content": thisTsv
      }
      tsvArr.push(objToPush)
    }
  }
  for(var half in game2) {
    for(var i=0; i < game2[half].length; i++) {
      var currentStatsArr = (game2[half])[i];
      var statsData = currentStatsArr.slice(7,currentStatsArr.length);
      var thisTsv = makeTSV(statsData);
      var fileName = "" + team.name + "game2" + half + ".tsv";
      var objToPush = {
        "type": "data:text/tsv;charset=utf-8",
        "name": fileName,
        "content": thisTsv
      }
      tsvArr.push(objToPush);
    }
  }
  var message = {
      "subject": team.name,
      "from_email": "geminycrickett@gmail.com",
      "from_name": "Gem",
      "to": [{
              "email": "geminycrickett@gmail.com",
              "name": "Gem"
          },
          {
            "email": "leodarrfut@gmail.com",
            "name": "Nqoba"
          }],
      "important": false,
      "track_opens": true,
      "auto_html": false,
      "preserve_recipients": true,
      "merge": false,
      "attachments": tsvArr
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
      // console.log(message);
      // console.log(result);
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
  (team[weekStr])['sent'] = true;
  yield teams.update({key:teamId}, team);
  yield db.close();
}


function getWeekNum() {
  var weekMS = 604800000;
  var compareMS = new Date(2015, 5, 12).getTime(); //2 days before scheduled week 1 start date
  var todayMS = new Date().getTime();
  var whichWeek = Math.ceil((todayMS - compareMS) / weekMS);
  if(whichWeek < 1) {
    whichWeek = 1;
  } else if(whichWeek > 9) {
    whichWeek = 9;
  }
  return whichWeek;
}

/** for client to get a SPECIFIC week on pg load **/
app.post('/api/schedule/week/:id', function*(){
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('s8games');
  var weekId = Number(this.params.id);
  var thisWeek = yield gamesColl.findOne({week: weekId});
  this.body = thisWeek;
  yield db.close();
});

/** for client to get ALL weeks from db for schedule **/
app.post('/api/schedule', function*(){
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('s8games');
  var weeks = yield gamesColl.find().toArray();
  this.body = weeks;
  yield db.close();
});

/** for client to get THIS WEEK from db on.score **/
app.post('/api/scorekeeper', cors({origin:true}), function*(){
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('s8games');
  var thisWeek = getWeekNum();
  var thisWeekFromDB = yield gamesColl.findOne({week: thisWeek});
  this.body = thisWeekFromDB;
  yield db.close();
});

/** for contact with captain's userscript **/
app.post('/api/game/scorekeeper', cors({origin:true}), function*(){
  var db = yield comongo.connect(DB);
  var games = yield db.collection('s8games');
  var thisWeek = getWeekNum();
  var thisWeekFromDB = yield games.findOne({week: thisWeek});

  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  var teamId = (body[4]).userkey;
  if(keys.indexOf(teamId) < 0) {
    this.body = "Not a valid API key.";
    throw new Error('Not a valid API key.');
  }

  console.log('body in scorekeeper', body)

  var teamInfo = yield db.collection('s8teams');
  var team = yield teamInfo.findOne({key: teamId});
  var teamName = team.name;

  //create g1h1 g1h2 g2h1 or g2h2 string
  var gameNum = body[2].game;
  var halfNum = body[3].half;
  var halfToUpdate = "g" + gameNum + "h" + halfNum;

  //find which gameId to update
  for(var game in thisWeekFromDB) {
    if(thisWeekFromDB[game].team1 == teamName || thisWeekFromDB[game].team2 == teamName) {
      var gameIDToUpdate = game;
    }
  }

  var tempScoreObj = { };
  if(thisWeekFromDB[gameIDToUpdate].team1 == teamName) {
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team1] = body[5].score.thisTeamScore;
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team2] = body[5].score.otherTeamScore;
  } else {
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team2] = body[5].score.thisTeamScore;
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team1] = body[5].score.otherTeamScore;
  }

  (thisWeekFromDB[gameIDToUpdate])[halfToUpdate] = tempScoreObj;
  thisWeekFromDB[gameIDToUpdate].stats = body;

  yield games.update({week: thisWeek}, thisWeekFromDB);

  var objForClient = {
                        gameId: gameIDToUpdate,
                        halfToUpdate: halfToUpdate,
                        scoreObj: tempScoreObj,
                        stats: body
                    };
  io.sockets.emit('newScoreUpdate', objForClient);
  this.body = 'SUCCESS';
  yield db.close();
});

/** for POSTMAN RESTclient to add stream links on sundays once decided **/
app.post('/api/game/stream', function*(){
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('s8games');
  var weekId = getWeekNum();
  var thisWeeksGames = yield gamesColl.findOne({week: weekId});
  console.log('thisweek', thisWeeksGames, weekId);
  var body = this.request;
  //expected syntax == team="name"&link="???"
  var params = ((body.url.split('?'))[1]).split('&');
  var team = (params[0].split('='))[1];
  team = team.replace(/%20/g, " ");
  var stream = (params[1].split('='))[1];
  console.log(team, stream)

  for(var game in thisWeeksGames) {
    if(thisWeeksGames[game].team1 == team || thisWeeksGames[game].team2 == team) {
      thisWeeksGames[game].streamLink = stream;
    }
  }

  yield gamesColl.update({week: weekId}, thisWeeksGames);
  this.body = body;
  yield db.close();
});


/**

END


CURRENT


SEASON


STUFF


**/

/** for client to get season 7 games coll **/
app.post('/api/season/7/games', function*() {
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('games');
  var weeks = yield gamesColl.find().toArray();
  this.body = weeks;
  yield db.close();
});

/** for client to get season 7 teams coll **/
app.post('/api/season/7/teams', function*() {
  var db = yield comongo.connect(DB);
  var teams = yield db.collection('teams');
  var t = yield teams.find().toArray();
  this.body = t;
  yield db.close();
});

var request = require('koa-request');

var cookiesHash = {
  origin: 'tagpro=s%3AZULO6VqUoWbUeY0zIfKnhN3R.as4SvRDDW3%2BK5%2F%2FJ7z7T0gkNEvVQ71sn32FlXV5CYJA',
  radius: 'tagpro=s%3AD7EiXNwLlTj83q8Xkrs06QAu.stp69Bcpgye0LoAeKxGine5awAGBzxVpKFa4kI7kZ58',
  sphere: 'tagpro=s%3AuCGdoe7Gb9pXZSeSyzAdagNx.S%2FPZA3hRwSR6y%2BxhZiPlCn40oOnYp6uo3p3%2FyTiDcHw',
  segment: 'tagpro=s%3ANy20Pk99iWShSDx2cLSBbzDL.FKeQMolzcuDHATGoCDMEcE%2Bq3hIHHrj9MZEkojmcr30',
  pi: 'tagpro=s%3AWXgfxW1ECMa16jt7G0pRS0ik.ejEuqhUf45%2BsLG9a%2FCPnArbmZ2%2Bezh3T5WrV%2BgO2vqc',
  arc: 'tagpro=s%3AaaviXP6X898AEnnyrU8DaiXh.TsxF0senCpA5a51GSLr2HGHdjuQTDZCLvcD4i7jMcUo',
  centra: 'tagpro=s%3AuYWz7VVoxDmEB58rsXOptqXR.5RcYHGRYL4q96x33a98vSlTs2JygoNXH2EzFEMFQ4hI',
  chord: 'tagpro=s%3AFZfL0608E3SXZfA23NtwIp5g.ZI594qkQ65RZAWHLb5JV0BL3MEfeZw34t6hu8SrWq18',
  orbit: 'tagpro=s%3AiWrzwCxmuw99mFDvjp13mAMW.HXSXSo7UKr7X5M%2Frd1Pel9LX5RFJlQ4Wg7WuqRf6KMM',
  diameter: 'tagpro=s%3AsoiGybyucdrRaTZK472tMigq.oWYMjRzp9sii5n24JXCGcHUc4%2BRbgpDjxdY8etm%2FOGE',
  maptest2: 'tagpro=s%3AmwxCdeGDwxwrWG1vfDbSSfGk.p7CV3Bj7LuF38kYsCPkpNgeXlF0R0yyV6N7xyFm%2FZGM',
  tangent: 'tagpro=s%3A0qWPVVhfILU96rogHooAQWoC.pRSEKUp3FaRG5AuAi58dWbKrIDc5%2BrUpy%2BxvfhYQ5J8'
}

/*** for groupster lolz ***/
app.get('/groupster/:server', cors({origin:true}), function*(){
  var url = 'http://tagpro-' + this.params.server + '.koalabeast.com/groups/create/';
  var response = yield request.post({url: url, headers:{ Cookie: cookiesHash[this.params.server] }, form: { }});
  var link = response.body.split('/groups/')[1];
  this.body = link;
});

