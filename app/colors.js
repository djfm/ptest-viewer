function interval (value, worst, best) {

	var n = 5;

	var invert = worst > best;

	if (invert) {
		var tmp = worst;
		worst = best;
		best = tmp;
	}

	if (value < worst) {
		value = worst;
	}

	if (value > best) {
		value = best;
	}

	worst = worst || 0;
	best  = best || 100;

	var q;

	if (value === worst) {
		q = 1;
	}

	if (value === best) {
		q = n;
	}


	if (q === undefined) {
		q = Math.ceil(n * (value - worst) / (best - worst));
	}

	if (q > n) {
		q = n;
	}

	if (q <= 0) {
		q = 1;
	}

	if (invert) {
		q = n - q + 1;
	}

	return "interval_" + q;
}

exports.interval = interval;