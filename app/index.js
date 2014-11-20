var express = require('express');
var hbs = require('hbs');
var database = require('./database'); 

var app = express();

var statsFolder = process.argv[2] || '.';

hbs.registerHelper('interval', require('./colors').interval);

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
	database
	.loadJsonFromFolder(statsFolder)
	.then(function (db) {
		res.render('index', {
			testsCount: db.count(),
			summary: db.summarize()
		});
	}, function (e) {
		res.send(e.toString());
	});
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening on http://%s:%s', host, port);
});