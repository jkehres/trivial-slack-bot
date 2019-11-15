'use strict';

module.exports = class extends Error {
	constructor(msg, status) {
		super(msg);
		this.name = 'AppError';
		this.status = status;
	}
};
