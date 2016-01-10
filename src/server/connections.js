var DB = require('mongodb-next');
var DB_LINK = process.env.MONGOLAB_URI || 'mongodb://localhost/mltp-v2';
var db = DB(DB_LINK);

module.exports = function() {
	db.connect.then(function () {
		return db.collection('analytics').findOne({ count: 'connect' });
	}).then(function(userCount) {
    if ( !userCount ) return;
    return db.collection('analytics').findOne({ count: 'connect' }).set('numberOf', userCount.numberOf + 1);
	});
}
