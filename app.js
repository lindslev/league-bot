var koa = require('koa');
var router = require('koa-router');
var bodyParser = require('koa-bodyparser');
var uuid = require('node-uuid');
var json = require('koa-json');
var send = require('koa-send');
var serve = require('koa-static-folder');
var cors = require('koa-cors');
// var jsonBody = require('koa-json-body');

var app = koa();
app.use(bodyParser());
app.use(router(app));
app.use(json());
app.use(cors());
// app.use(jsonBody({ limit: '10kb' }));

var comongo = require('co-mongo');
var co = require('co');
var cjson = require('cjson');
var teamdata = [];

co(function *() {
  var teams = cjson.load('./server/db/teams.json');
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var collection = yield db.collection('teams');
  var count = yield collection.count();
  var gemColl = yield db.collection('pub_stats');
  var count2 = yield gemColl.count();
  console.log('ct2', count2);
      // var geminfo = yield gemColl.insert({player: 'Gem',redScore: 0, blueScore: 0, captures: 0});
      // var geminfo = yield gemColl.update({player: 'Gem'}, {player: 'Gem',redScore: 1, blueScore: 3, captures: 0}, {upsert: true});

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
                              server: div[team].server
                            });
        }
      }
    }
  }

  teamdata = yield collection.find().toArray();
  console.log('ct', count);

  yield db.close();
});

app.use(serve('./client/bower_components'));
app.use(serve('./client/app'));

app.get('/', function *() {
  yield send(this, __dirname + '/client/index.html');
});

app.post('/api/teams', function *(){
  this.body = teamdata;
});

var corsOptions = {
  origin: true
};

var scoreKeeper = null;



var server = require('http').createServer(app.callback());

var io = require('socket.io').listen(app.listen(process.env.PORT || 4000));

io.on('connection', function(socket){
  console.log('usr cnnct 0mg');
  // socket.on('new score', function (data) {
  //   console.log('scores from userscrapt', data);
  // });
});

app.post('/api/test', cors(corsOptions), function*(){
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var pubColl = yield db.collection('pub_stats');
  var body = this.request.body;
  var playerTeam, gameState;
  if(body.state == '1') {
    gameState = 'in progress';
  } else if(body.state == '2') {
    gameState = 'complete';
  } else {
    gameState = 'about to begin';
  }
  body.team == '1' ? playerTeam = 'red' : playerTeam = 'blue';
  var playerUpdate = yield pubColl.update({player: body.name}, {player: body.name,redScore: body.red, blueScore: body.blue, captures: body.caps, tags: body.tags, team: playerTeam, server: body.server, state: gameState, map: body.map}, {upsert: true});
  // body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('info from tp userscript', body, new Date());
  io.sockets.emit('pubber', body);
  this.body = 'made it';
  yield db.close();
});

app.post('/api/pub/test', cors(corsOptions), function*(){
  // var db = yield comongo.connect('mongodb://localhost/mltp');
  // var pubColl = yield db.collection('pub_stats');
  var body = this.request.body;
  // var playerTeam, gameState;
  // if(body.state == '1') {
  //   gameState = 'in progress';
  // } else if(body.state == '2') {
  //   gameState = 'complete';
  // } else {
  //   gameState = 'about to begin';
  // }
  // body.team == '1' ? playerTeam = 'red' : playerTeam = 'blue';
  // var playerUpdate = yield pubColl.update({player: body.name}, {player: body.name,redScore: body.red, blueScore: body.blue, captures: body.caps, tags: body.tags, team: playerTeam, server: body.server, state: gameState, map: body.map}, {upsert: true});
  body = JSON.parse('[' + Object.keys(body)[0] + ']'); //this is the stats parsing thign
  console.log('info from tp userscript', body, new Date());
  io.sockets.emit('pubber', body);
  this.body = 'made it';
  // yield db.close();
});

app.post('/api/scorekeeper', function*(){
  var db = yield comongo.connect('mongodb://localhost/mltp');
  var pubColl = yield db.collection('pub_stats');
  var pubbers = yield pubColl.find().toArray();
  console.log('pubbers from db on pg refresh', pubbers);
  this.body = pubbers;
  yield db.close();
});

