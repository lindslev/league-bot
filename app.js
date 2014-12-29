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

/*** populating teams in the db ***/
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
  var tempGameColl = yield db.collection('tempGames');
  var tempGameCount = yield tempGameColl.count();
  console.log('tempGameCount', tempGameCount);
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
          //add gameResult:null
        }
      }
    }
  }
  console.log('ct', count);
  teamdata = yield collection.find().toArray();

  // function getWeekNum() {
  //   var weekMS = 604800000;
  //   var compareMS = new Date(2014, 11, 21).getTime();
  //   var todayMS = new Date().getTime();
  //   var whichWeek = Math.round((todayMS - compareMS) / weekMS);
  //   return whichWeek;
  // }

  // function findTeamIndex(teamToFind) {
  //       var idx;
  //       teams.forEach(function(team, i){
  //         if(team.name == teamToFind) {
  //           idx = i;
  //         }
  //       })
  //       return idx;
  //     }

  // teams = teamdata.map(function(team){
  //         var thisTeamSchedule = team.schedule;
  //         var thisTeamOpponent = thisTeamSchedule[getWeekNum() - 1] || 'none';
  //         return { name: team.name, chosen: false, opponent: thisTeamOpponent};
  //       });

  // if(tempGameCount == 0) {
    // for(var i=0; i < teams.length; i++) {
    //   if(!teams[i].chosen) {
    //     var gameID = games.length + 1;
    //     games.push({
    //       team1: teams[i].name,
    //       team2: teams[i].opponent,
    //       gameId: gameID
    //     });
    //     teams[i].chosen = true;
    //     var oppIdx = findTeamIndex(teams[i].opponent);
    //     teams[oppIdx].chosen = true;
    //     // console.log('team[i]...', teams[i]);
    //     // console.log('scope.games', $scope.games);
    //   }
    // }
    // yield constructGameIDsServerSide();
    // console.log('games after constructing', games);
    // for(var i=0; i < games.length; i++) {
    //   var game = games[i];
    //   yield tempGameColl.insert({
    //     team1: game.team1,
    //     team2: game.team2,
    //     gameId: game.gameId,
    //     stats: null
    //   })
    // }
  // }
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

function *populateDB(teamId, gameStats) {
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

// var games = [];
// var teams = teamdata.map(function(team){
//           var thisTeamSchedule = team.schedule;
//           var thisTeamOpponent = thisTeamSchedule[getWeekNum() - 1] || 'none';
//           return { name: team.name, chosen: false, opponent: thisTeamOpponent};
//         });

function *constructGameIDsServerSide() {
  function getWeekNum() {
    var weekMS = 604800000;
    var compareMS = new Date(2014, 11, 21).getTime();
    var todayMS = new Date().getTime();
    var whichWeek = Math.round((todayMS - compareMS) / weekMS);
    return whichWeek;
  }

  teams = teamdata.map(function(team){
    var thisTeamSchedule = team.schedule;
    var thisTeamOpponent = thisTeamSchedule[getWeekNum() - 1] || 'none';
    return { name: team.name, chosen: false, opponent: thisTeamOpponent};
  });

  function findTeamIndex(teamToFind) {
    var idx;
    teams.forEach(function(team, i){
      if(team.name == teamToFind) {
        idx = i;
      }
    })
    return idx;
  }
  // console.log('teamdata', teamdata);
  // console.log('teams in construct', teams);
  // console.log('games in construct', games);
  for(var i=0; i < teams.length; i++) {
    if(!teams[i].chosen) {
      var gameID = games.length + 1;
      games.push({
        team1: teams[i].name,
        team2: teams[i].opponent,
        team1score: null,
        team2score: null,
        gameId: gameID,
        stats: null
      });
      teams[i].chosen = true;
      var oppIdx = findTeamIndex(teams[i].opponent);
      teams[oppIdx].chosen = true;
      // console.log('team[i]...', teams[i]);
      // console.log('scope.games', $scope.games);
    }
  }
  // if(i >= teams.length && $scope.games.length <= 10) i=0;
// }
// console.log('scope.games in construct scoreboard', games);
}


app.post('/api/teams/game/stats', cors({origin:true}), function*(){
  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('info from tp userscript', body);
  var teamId = (body[5]).userkey;
  var completed = yield populateDB(teamId, body);
  io.sockets.emit('newGameUpdate', body);
  this.body = 'made it';
});


app.post('/api/scorekeeper', function*(){
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var tempGameInfo = yield db.collection('tempGames');
  var games = yield tempGameInfo.find().toArray();
  console.log('tempGames from db on pg refresh', games);
  this.body = games;
  yield db.close();
});

app.post('/api/game/scorekeeper', cors({origin:true}), function*(){
  //1. construct some sort of
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var tempGameInfo = yield db.collection('tempGames');
  // var tempGames = yield tempGameInfo.findOne();
  var count = yield tempGameInfo.count();
  console.log('count of tempgames', count);
  // if(count == 0) {



  yield constructGameIDsServerSide();
  console.log('games after constructing', games);
  if(count == 0) {
    for(var i=0; i < games.length; i++) {
      var game = games[i];
      yield tempGameInfo.update({gameId: gameId}, {
        team1: game.team1,
        team2: game.team2,
        team1score: null,
        team2score: null,
        gameId: game.gameId,
        stats: null
      }, {upsert: true});
    }
  }

  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  var teamId = (body[5]).userkey;
  console.log('from scorekeeper', body);

  var teamInfo = yield db.collection('teams');
  var team = yield teamInfo.findOne({key: teamId});
  var teamName = team.name;
  console.log('y r u erroring teamName', teamName);
  var gameUpdateToSave = yield tempGameInfo.findOne({team1: teamName});
  if(!gameUpdateToSave) {
    var gameUpdateToSave = yield tempGameInfo.findOne({team2: teamName});
  }
  var gameId = gameUpdateToSave.gameId;
  gameUpdateToSave.stats = body;

  var thisTeam;
  teamdata.forEach(function(team){
    if(team.key == teamId) {
      thisTeam = team.name;
    }
  })
  if(gameUpdateToSave.team1 == thisTeam) {
    gameUpdateToSave.team1score = body[6].score.thisTeamScore;
    gameUpdateToSave.team2score = body[6].score.otherTeamScore;
    // console.log('game after updating', game);
  } else {
    gameUpdateToSave.team2score = body[6].score.thisTeamScore;
    gameUpdateToSave.team1score = body[6].score.otherTeamScore;
    // console.log('game after updating', game);
  }

  yield tempGameInfo.update({gameId: gameId}, gameUpdateToSave);

  var objForClient = {body: body, gameId: gameId};

  io.sockets.emit('newScoreUpdate', objForClient);
  this.body = 'hello...';
  // this.body = teams;
  yield db.close();
});

// app.post('/api/game/scorekeeper', cors({origin:true}), function*(){
//   var body = this.request.body;
//   body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
//   console.log('from scorekeeper', body);
//   io.sockets.emit('newScoreUpdate', body);
//   this.body = 'hello...';
// });

