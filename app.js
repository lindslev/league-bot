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

co(function *() {
  var teams = cjson.load('./server/db/teams.json');
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var collection = yield db.collection('teams');
  var count = yield collection.count();
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
  var teamTest = yield db.collection('team_test');
  var teams = yield teamTest.find().toArray();
  console.log('teamtest from db on pg refresh', teams);
  this.body = teams;
  yield db.close();
});

app.post('/api/game/scorekeeper', cors({origin:true}), function*(){
  var body = this.request.body;
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('from scorekeeper', body);
  io.sockets.emit('newScoreUpdate', body);
  this.body = 'hello...';
});

