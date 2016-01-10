var express = require('express');
var path = require('path');
var app = express();
var cors = require('cors');
var bodyParser = require('body-parser');
var publicDir = __dirname + '/public';
var distJs = path.normalize(__dirname + '/../../dist/js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());

app.use(express.static(publicDir));
app.use(express.static(distJs));

var server = require('http').createServer();

var io = require('socket.io').listen(app.listen(process.env.PORT || 1337));
var analyzeConnections = require('./connections');

io.on('connection', function (socket) {
  analyzeConnections();
});

require('./season_seeder')();

module.exports = {
	app: app,
	socket: io.sockets
};

require('./routes');

app.get('*', function (req, res) {
  res.sendFile(path.normalize(__dirname + '/../../dist/index.html'));
});
