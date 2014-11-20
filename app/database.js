var fs = require('fs');
var p  = require('path');
var q  = require('q');
var _  = require('underscore');

function Database () {

	var results = [];

	this.add = function (data) {
		results = results.concat(data);
	};

	this.count = function () {
		return results.length;
	};

	this.summarize = function () {

		var key = function (result) {
			return result.testName;
		};

		var name = function (result) {
			return result.testName.split('::').join('<br>::');
		};

		var summary = {};

		_.each(results, function (result) {
			var k = key(result);
			var obj = summary[k] || {errors: {}};

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

				obj.errors[msg] = (obj.errors[msg] || 0) + 1;
			}

			summary[k] = obj;
		});

		_.each(summary, function (test) {
			test.successRate = (100 * test.okCount / test.count).toFixed(2);
			test.errorRate = (100 * test.koCount / test.count).toFixed(2);
			test.unknownRate = Math.abs((100 - test.successRate - test.errorRate)).toFixed(2);

			test.errors = _.pairs(test.errors).sort(function (a, b) {return b[1] - a[1]});
			if (test.totalSuccessTime && test.okCount) {
				test.averageSuccessTime = Math.round(test.totalSuccessTime / test.okCount);
			}
		});
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
							db.add(JSON.parse(data.toString()));
							d.resolve();
						}
					});
				}

				return promises;
			}, []);

			q.all(promises).then(function () {
				console.log('loaded', db.count());
				d.resolve(db);
			}, d.reject);
		}
	});

	return d.promise;
}

exports.loadJsonFromFolder = loadJsonFromFolder;