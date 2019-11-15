'use strict';

const AppError = require('./AppError');

module.exports = (handler) => {
	return async (ctx) => {
		const action = ctx.request.body;
		if (!action)  {
			throw new AppError('Missing action field', 400);
		}
		if (!action.payload)  {
			throw new AppError('Missing payload field', 400);
		}

		const payload = JSON.parse(action.payload);

		ctx.response.status = 200;
		// eslint-disable-next-line require-atomic-updates
		ctx.response.body = await handler(payload);
	};
};
