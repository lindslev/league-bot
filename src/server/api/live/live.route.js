var app = require('./../../app').app;

var controller = require('./live.controller');
var routePrefix = '/api/live';

/** add routes here **/
app.post(routePrefix + '/', controller.index);
app.get(routePrefix + '/', controller.show);
