'use strict';

module.exports = (handler) => {
	return async (ctx) => {
		const action = ctx.request.body;
		// TODO: validate action schema

		ctx.response.status = 200;
		// eslint-disable-next-line require-atomic-updates
		ctx.response.body = await handler(action);
	};
};
