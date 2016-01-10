var app = require('./../../app').app;

var controller = require('./streams.controller');
var routePrefix = '/api/streams';

/** add routes here **/
app.post(routePrefix + '/', controller.index);
app.post(routePrefix + '/auth', controller.auth);
