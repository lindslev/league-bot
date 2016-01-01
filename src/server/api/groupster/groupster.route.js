var app = require('./../../app').app;

var controller = require('./groupster.controller');
var routePrefix = '/groupster';

/** add routes here **/
app.get(routePrefix + '/:server', controller.index);
