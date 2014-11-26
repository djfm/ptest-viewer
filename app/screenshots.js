var fs 	= require('fs');
var p 	= require('path');
var q 	= require('q');
var _   = require('underscore');

function formatName (name) {

	var exp = /^\s*(\d+)\)\s*([^,]+)\s*,\s*(\d+);(\d+);(\d+)$/;

	var m = exp.exec(name);

	if (m) {
		return m[2] + ', ' + m[3] + ':' + m[4] + ':' + m[5];
	}

	return name;
}

function paginate (index, first, last) {
	
	var size = 3;

	var i, before = [], after = [];

	for (i = index - size; i <= index; ++i) {
		if (i >= first && i !== last) {
			before.push({
				enable: index !== i,
				position: i,
				label: i
			});
		}
	}

	for (i = index + 1; i < index + size; ++i) {
		if (i <= last) {
			after.push({
				enable: index !== i,
				position: i,
				label: i
			});
		}
	}

	if (before.length === 0 || before[0].position !== first) {
		before.unshift({
			enable: index !== first,
			position: first,
			label: first
		});
	}

	if (before.length >= 2) {
		before.splice(1, 0, {
			placeholder: true
		});
	}

	if (after.length === 0 || after[after.length - 1].position !== last) {
		after.push({
			enable: index !== last,
			position: last,
			label: last
		});
	}

	if (after.length >= 2) {
		after.splice(-1, 0, {
			placeholder: true
		});
	}

	return {
		before: before,
		after: after
	};
}

function getScreenshots (db, baseDir, testToken, which) {
	var d = q.defer();

	var templateData = {
		screenshots: [],
		testToken: testToken,
		testName: db.getTestName(testToken)
	};

	var screenshotsDir = p.join(baseDir, testToken, 'screenshots');
	
	if (!fs.existsSync(screenshotsDir)) {
		d.resolve(templateData);
	} else {
		fs.readdir(screenshotsDir, function (err, files) {

			files = _.filter(files, function (file) {
				return !/\.json$/.exec(file);
			});

			which = which || files.length;

			if (err) {
				d.reject(err);
			} else {
				files.sort();
				templateData.screenshots = files;

				var pos = which - 1;

				if (pos <= 0) {
					pos = 0;
				}

				if (pos >= files.length - 1) {
					pos = files.length - 1;
				}

				if (pos >= 0) {
					var path = p.join(screenshotsDir, files[pos]);

					var ext = /\.(\w+)$/.exec(files[pos])[1];

					templateData.imageName = formatName(p.basename(files[pos], '.' + ext));
					
					fs.readFile(path, function (err, buffer) {
						if (err) {
							d.reject(err);
						} else {
							templateData.imageSource = 'data:image/' + ext + ';base64,' + buffer.toString('base64');
							templateData.pagination = paginate(pos + 1, 1, files.length);

							var metadataFile = p.join(screenshotsDir, p.basename(files[pos], '.' + ext) + '.json');

							fs.readFile(metadataFile, function (err, data) {

								if (!err) {
									templateData.imageMetadata = JSON.parse(data.toString());

									templateData.imageMetadata.warningsCount = 0;

									_.each(templateData.imageMetadata['Browser Log'], function (entry) {
										switch (entry.level.toLowerCase()) {
											case 'warning':
												entry.class = 'default';
												++templateData.imageMetadata.warningsCount;
												break;
											case 'info':
												entry.class = 'info';
												break;
											default:
												entry.class = 'danger';
										}
									});
								}

								d.resolve(templateData);
							});
						}
					});
				} else {
					d.resolve(templateData);
				}
			}
		});
	}

	return d.promise;
}

exports.getScreenshots =getScreenshots;