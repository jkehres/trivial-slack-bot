'use strict';

module.exports = (handler) => {
	return async (ctx) => {
		const command = ctx.request.body;
		// TODO: validate command schema

		ctx.response.status = 200;
		// eslint-disable-next-line require-atomic-updates
		ctx.response.body = await handler(command);
	};
};
