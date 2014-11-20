var express = require('express');
var hbs = require('hbs');
var database = require('./database'); 
var screenshots = require('./screenshots'); 

var app = express();

var statsFolder = process.argv[2] || '.';

hbs.registerHelper('interval', require('./colors').interval);
hbs.registerHelper('increment', function (n) {
	return n + 1;
});

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

var maybeDatabase;

function refresh() {
	maybeDatabase = database.loadJsonFromFolder(statsFolder);
}

refresh();

app.get('/refresh', function (req, res) {
	refresh();
	res.redirect('/');
});

app.get('/', function (req, res) {	
	maybeDatabase
	.then(function (db) {
		res.render('index', {
			testsCount: db.count(),
			summary: db.summarize()
		});
	}, function (e) {
		res.send(e.toString());
	});
});

app.get('/screencasts/:testToken/:which?', function (req, res) {
	var testToken = req.params.testToken;
	maybeDatabase.then(function (db) {
		screenshots.getScreenshots(db, statsFolder, testToken, req.params.which).then(function (templateData) {
			res.render('screenshots', templateData);
		}, function (e) {
			res.send(e);
		});
	}, function (e) {
		res.send(e);
	});
	
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening on http://%s:%s', host, port);
});