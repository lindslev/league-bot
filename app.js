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

var comongo = require('co-mongo');
var co = require('co');
var cjson = require('cjson');
var teamdata = [];
var games = [];
var teams = [];

var DB = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp';
var keys = ['11abc','12def','13ghi','14jkl','15mno',
            '21abc','22def','23ghi','24jki','25mno',
            '31abc','32def','33ghi','34jkl','35mno',
            '51abc','52def','53ghi','54jkl','55mno'];


co(function *() {
  var teams = yield cjson.load('./server/db/teams.json');
  var db = yield comongo.connect(DB);
  var collection = yield db.collection('teams');
  var count = yield collection.count();
  var gamesColl = yield db.collection('games');
  var gameCount = yield gamesColl.count();
  var userTracking = yield db.collection('analytics');
  var userCount = yield userTracking.count();

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
  var teamsColl = yield db.collection('teams');
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
  var teams = yield db.collection('teams');
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
    if(!globalSent){
      yield mandrillTSVs(teamId);
      console.log('mandrilling for teamId', teamId);
    }
  }
  this.body = 'SUCCESS';
});

function *sentStatsCheck(teamId) { //checks to see if already mandrill'd opponent's stats
  var db = yield comongo.connect(DB);
  var teams = yield db.collection('teams');
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
  var teams = yield db.collection('teams');
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
  var compareMS = new Date(2015, 0, 16).getTime(); //2 days before scheduled week 1 start date
  var todayMS = new Date().getTime();
  var whichWeek = Math.round((todayMS - compareMS) / weekMS);
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
  var gamesColl = yield db.collection('games');
  var weekId = Number(this.params.id);
  var thisWeek = yield gamesColl.findOne({week: weekId});
  this.body = thisWeek;
  yield db.close();
});

/** for client to get ALL weeks from db for schedule **/
app.post('/api/schedule', function*(){
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('games');
  var weeks = yield gamesColl.find().toArray();
  this.body = weeks;
  yield db.close();
});

/** for client to get THIS WEEK from db on.score **/
app.post('/api/scorekeeper', function*(){
  var db = yield comongo.connect(DB);
  var gamesColl = yield db.collection('games');
  var thisWeek = getWeekNum();
  var thisWeekFromDB = yield gamesColl.findOne({week: thisWeek});
  this.body = thisWeekFromDB;
  yield db.close();
});

/** for contact with captain's userscript **/
app.post('/api/game/scorekeeper', cors({origin:true}), function*(){
  var db = yield comongo.connect(DB);
  var games = yield db.collection('games');
  var thisWeek = getWeekNum();
  var thisWeekFromDB = yield games.findOne({week: thisWeek});

  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  var teamId = (body[4]).userkey;
  if(keys.indexOf(teamId) < 0) {
    this.body = "Not a valid API key.";
    throw new Error('Not a valid API key.');
  }

  var teamInfo = yield db.collection('teams');
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
  var gamesColl = yield db.collection('games');
  var weekId = getWeekNum();
  var thisWeeksGames = yield gamesColl.findOne({week: weekId});
  console.log('thisweek', thisWeeksGames, weekId);
  var body = this.request;
  //expected syntax == team="name"&link="???"
  var params = ((body.url.split('?'))[1]).split('&');
  var team = (params[0].split('='))[1];
  team = team.replace("%20", " ");
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
