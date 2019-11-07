'use strict';

const logger = require('./logger');

module.exports = async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		ctx.response.status = err.status || 500;
		ctx.response.body = err.message;
		if (ctx.response.status >= 500) {
			logger.error({ err }, 'Error in request handler');
		}
	}
};
