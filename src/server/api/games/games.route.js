var app = require('./../../app').app;

var controller = require('./games.controller');
var routePrefix = '/api/games';

/** add routes here **/
app.post(routePrefix + '/', controller.index);
app.get(routePrefix + '/', controller.show);
