module.exports = (questions) => {
	if (questions.length === 0) {
		return {
			users: [],
			mostRight: [],
			mostWrong: []
		};
	}

	const statsMap = new Map();
	questions.forEach(question => {
		Object.keys(question.users).forEach(name => {
			let stats = statsMap.get(name);
			if (!stats) {
				stats = {
					name,
					right: 0,
					wrong: 0
				};
			}
			if (question.users[name].answer === question.answer) {
				stats.right++;
			} else {
				stats.wrong++;
			}
			statsMap.set(name, stats);
		});
	});

	const stats = Array.from(statsMap.values());
	if (stats.length === 0) {
		return {
			users: [],
			mostRight: [],
			mostWrong: []
		};
	}

	const sortDescending = (array, field) => array.sort((a, b) => {
		if (a[field] < b[field]) return 1;
		if (a[field] > b[field]) return -1;
		return 0;
	});

	sortDescending(stats, 'wrong');
	const mostWrongValue = stats[0].wrong;

	sortDescending(stats, 'right');
	const mostRightValue = stats[0].right;

	const mostRight = stats.filter(user => user.right === mostRightValue).map(user => user.name);
	const mostWrong = stats.filter(user => user.wrong === mostWrongValue).map(user => user.name);

	return {
		users: stats,
		mostRight,
		mostWrong
	};
};
