var colors = require('../app/colors');
var interval = colors.interval;
require('chai').should();
	
/* global describe, it */

describe("Color", function () {
	describe('Interval', function () {
		it('Should tell me in which interval my value lies', function () {
			interval(0, 0, 100).should.equal("interval_1");
			interval(1, 0, 100).should.equal("interval_1");
			interval(19, 0, 100).should.equal("interval_1");
			interval(20, 0, 100).should.equal("interval_1");
			interval(21, 0, 100).should.equal("interval_2");
			interval(76, 0, 100).should.equal("interval_4");
			interval(81, 0, 100).should.equal("interval_5");
			interval(100, 0, 100).should.equal("interval_5");

			interval(0, 100, 0).should.equal("interval_5");
			interval(76, 100, 0).should.equal("interval_2");
			interval(81, 100, 0).should.equal("interval_1");
		});
	});
});