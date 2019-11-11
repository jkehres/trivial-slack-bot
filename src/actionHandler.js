'use strict';

const errorWithStatus = require('./errorWithStatus');

module.exports = (handler) => {
	return async (ctx) => {
		const action = ctx.request.body;
		if (!action)  {
			throw errorWithStatus('Missing action field', 400);
		}
		if (!action.payload)  {
			throw errorWithStatus('Missing payload field', 400);
		}

		const payload = JSON.parse(action.payload);

		ctx.response.status = 200;
		// eslint-disable-next-line require-atomic-updates
		ctx.response.body = await handler(payload);
	};
};
