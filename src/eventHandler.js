'use strict';

const AppError = require('./AppError');

module.exports = (handler) => {
	return async (ctx) => {
		// TODO: validate event schema
		const type = ctx.request.body.type;
		if (!type)  {
			throw new AppError('Missing type field', 400);
		}

		if (type === 'url_verification') {
			ctx.response.body = ctx.request.body.challenge;
		} else if (type === 'event_callback') {
			const event = ctx.request.body.event;
			if (!event)  {
				throw new AppError('Missing event field', 400);
			}
			await handler(event);
		} else {
			throw new AppError(`Unsupported type: ${type}`, 400);
		}

		// eslint-disable-next-line require-atomic-updates
		ctx.response.status = 200;
	};
};
