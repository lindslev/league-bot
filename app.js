var koa = require('koa');
var router = require('koa-router');
var bodyParser = require('koa-bodyparser');
var uuid = require('node-uuid');
var json = require('koa-json');
var send = require('koa-send');
var serve = require('koa-static-folder');
var cors = require('koa-cors');
var mount = require('koa-mount');
var app = koa();
app.use(bodyParser());
app.use(router(app));
app.use(json());
app.use(cors());
app.use(serve('./client/bower_components'));
app.use(serve('./client/app'));

var comongo = require('co-mongo');
var co = require('co');
var cjson = require('cjson');
var teamdata = [];
var games = [];
var teams = [];

co(function *() {
  var teams = cjson.load('./server/db/teams.json');
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var collection = yield db.collection('teams');
  var count = yield collection.count();
  var gamesColl = yield db.collection('games');
  var gameCount = yield gamesColl.count();

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
  this.body = teamdata;
});

var server = require('http').createServer(app.callback());

var io = require('socket.io').listen(app.listen(process.env.PORT || 4000));

io.on('connection', function(socket){
  console.log('usr cnnct 0mg');
});

/** function called when post request is made at the end of games **/
function *updateTeamsDB(teamId, gameStats) {
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var teams = yield db.collection('teams');
  var weekMS = 604800000;
  var compareMS = new Date(2014, 11, 21).getTime();
  var todayMS = new Date().getTime();
  var whichWeek = Math.round((todayMS - compareMS) / weekMS);
  var thisTeam = yield teams.findOne({key: teamId});
  var weekStr = "week" + whichWeek;
  //stats, map, server,game,half,key,score,state
  //0      1     2      3    4    5   6     7
  var gameNum = "game" + gameStats[3].game;
  var halfNum = "half" + gameStats[4].half;
  ((thisTeam[weekStr])[gameNum])[halfNum].push(gameStats);
  yield teams.update({key: teamId}, thisTeam);
  yield db.close();
}

/* request made at the end of games (or when games are ended early) */
app.post('/api/teams/game/stats', cors({origin:true}), function*(){
  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('info from tp userscript', body);
  var teamId = (body[5]).userkey;
  var completed = yield updateTeamsDB(teamId, body);
  io.sockets.emit('newGameUpdate', body);
  this.body = 'SUCCESS';
});

function getWeekNum() {
  var weekMS = 604800000;
  var compareMS = new Date(2014, 11, 21).getTime();
  /*REMEMBER TO CHANGE THIS TO WEEK 1 DATE*/
  var todayMS = new Date().getTime();
  var whichWeek = Math.round((todayMS - compareMS) / weekMS);
  return whichWeek;
}

/** for client to get game data from db **/
app.post('/api/scorekeeper', function*(){
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var gamesColl = yield db.collection('games');
  var thisWeek = getWeekNum();
  var thisWeekFromDB = yield gamesColl.findOne({week: thisWeek});
  this.body = thisWeekFromDB;
  yield db.close();
});

/** for contact with captain's userscript **/
app.post('/api/game/scorekeeper', cors({origin:true}), function*(){
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var games = yield db.collection('games');
  var thisWeek = getWeekNum();
  var thisWeekFromDB = yield games.findOne({week: thisWeek});

  var body = this.request.body;
  console.log('before parsing', body);
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('from scorekeeper and body[5]', body, body[5]);
  var teamId = (body[5]).userkey;

  var teamInfo = yield db.collection('teams');
  var team = yield teamInfo.findOne({key: teamId});
  console.log('team found?', team, teamId)
  var teamName = team.name;

  //create g1h1 g1h2 g2h1 or g2h2 string
  var gameNum = body[3].game;
  var halfNum = body[4].half;
  var halfToUpdate = "g" + gameNum + "h" + halfNum;

  //find which gameId to update
  for(var game in thisWeekFromDB) {
    if(thisWeekFromDB[game].team1 == teamName || thisWeekFromDB[game].team2 == teamName) {
      var gameIDToUpdate = game;
    }
  }

  var tempScoreObj = { };
  if(thisWeekFromDB[gameIDToUpdate].team1 == teamName) {
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team1] = body[6].score.thisTeamScore;
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team2] = body[6].score.otherTeamScore;
  } else {
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team2] = body[6].score.thisTeamScore;
    tempScoreObj[thisWeekFromDB[gameIDToUpdate].team1] = body[6].score.otherTeamScore;
  }

  (thisWeekFromDB[gameIDToUpdate])[halfToUpdate] = tempScoreObj;
  thisWeekFromDB[gameIDToUpdate].stats = body;

  yield games.update({week: thisWeek}, thisWeekFromDB);

  var objForClient = {
                        gameId: gameIDToUpdate,
                        halfToUpdate: halfToUpdate,
                        scoreObj: tempScoreObj
                    };
  io.sockets.emit('newScoreUpdate', objForClient);
  this.body = 'SUCCESS';
  yield db.close();
});
