var constants 	= require('./constants');
var fs 			= require('fs');
var moment 		= require('moment');
var p  			= require('path');
var q  			= require('q');
var _  			= require('underscore');

function Database () {

	var results = [];
	var byTestToken = {};

	this.add = function (token, data) {

		_.each(data, function (item, position) {
			var testToken = token + '_' + position;

			item.position = position;
			item.testToken = testToken;

			byTestToken[testToken] = item;
		});

		results = results.concat(data);
	};

	this.count = function () {
		return _.size(results);
	};

	this.getTestName = function (testToken) {
		return byTestToken[testToken].testName;
	};

	this.summarize = function (filter) {

		filter = _.clone(filter || {});

		if (filter.startedBefore) {
			filter.startedBefore = moment(filter.startedBefore, constants.dateFormat).unix();
		}

		if (filter.startedAfter) {
			filter.startedAfter = moment(filter.startedAfter, constants.dateFormat).unix();
		}

		results.sort(function (a, b) {
			return a.startedAt - b.startedAt;
		});

		var key = function (result) {
			return result.testName;
		};

		var name = function (result) {
			return result.testName;
		};

		var summary = {};
		var data = {};

		_.each(results, function (result) {

			summary.firstDate = !summary.firstDate ? result.startedAt : Math.min(summary.firstDate, result.startedAt);
			summary.lastDate = Math.max(summary.lastDate || 0, result.startedAt);

			if (filter.startedAfter && result.startedAt < filter.startedAfter) {
				return;
			}

			if (filter.startedBefore && result.startedAt > filter.startedBefore) {
				return;
			}

			var k = key(result);
			var obj = data[k] || {errors: {}};

			obj.name = obj.name || name(result);

			obj.count = 1 + (obj.count || 0);
			obj.okCount = (obj.okCount || 0) + (result.statusChar === '.' ? 1 : 0);
			obj.koCount = (obj.koCount || 0) + (result.statusChar === 'E' ? 1 : 0);

			if (result.startedAt && result.finishedAt && result.statusChar === '.') {
				obj.totalSuccessTime = (obj.totalSuccessTime || 0) + result.finishedAt - result.startedAt;
			}

			if (result.error) {
				var msg = result.error.class;
				if (result.error.message) {
					msg += ': ' + result.error.message;
				}

				obj.errors[msg] = (obj.errors[msg] || []);

				obj.errors[msg].push({
					testToken: result.testToken
				});
			}

			data[k] = obj;
		});

		_.each(data, function (test) {
			test.successRate = (100 * test.okCount / test.count).toFixed(2);
			test.errorRate = (100 * test.koCount / test.count).toFixed(2);
			test.unknownRate = Math.abs((100 - test.successRate - test.errorRate)).toFixed(2);

			test.errors = _.map(
				_.pairs(test.errors).sort(function (a, b) {return b[1].length - a[1].length;}),
				function (pair) {
					return {
						message: pair[0],
						errors: pair[1]
					};
				}
			);
			if (test.totalSuccessTime && test.okCount) {
				test.averageSuccessTime = Math.round(test.totalSuccessTime / test.okCount);
			}
		});

		summary.data = data;

		return summary;
	};
}

function loadJsonFromFolder (path) {
	var db = new Database();

	var d = q.defer();

	fs.readdir(path, function (err, files) {
		if (err) {
			d.reject(err);
		} else {
			var promises = files.reduce(function (promises, file) {

				if (/\.json$/.exec(file)) {
					var d = q.defer();
					promises.push(d.promise);
					fs.readFile(p.join(path, file), function (err, data) {
						if (err) {
							d.reject(err);
						} else {
							db.add(p.basename(file, '.json'), JSON.parse(data.toString()));
							d.resolve();
						}
					});
				}

				return promises;
			}, []);

			q.all(promises).then(function () {
				d.resolve(db);
			}, d.reject);
		}
	});

	return d.promise;
}

exports.loadJsonFromFolder = loadJsonFromFolder;