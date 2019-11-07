'use strict';

const logger = require('./logger');

module.exports = async (ctx, next) => {
	const startTime = Date.now();
	ctx.res.on('finish', () => {
		const req = {
			method: ctx.request.method,
			url: ctx.request.url,
			query: ctx.request.query,
			headers: ctx.request.headers
		};

		const res = {
			status: ctx.response.status,
			body: (ctx.response.status >= 400) ? ctx.response.body : undefined
		};

		const responseTime = Date.now() - startTime;
		const tenantId = ctx.state.tenantId;
		logger.info({tenantId, req, res, responseTime}, `HTTP ${ctx.request.method} ${ctx.request.url}`);
	});

	await next();
};
