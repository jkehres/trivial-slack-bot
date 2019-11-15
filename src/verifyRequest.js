'use strict';

const crypto = require('crypto');
const AppError = require('./AppError');

const MAX_AGE = 5 * 60 * 1000; // 5 minutes

const signingSecret = process.env.SLACK_SIGNING_SECRET;

module.exports = async (ctx, next) => {
	const timestamp = ctx.request.headers['x-slack-request-timestamp'];
	if (!timestamp)  {
		throw new AppError('Missing x-slack-request-timestamp header', 400);
	}

	const signature = ctx.request.headers['x-slack-signature'];
	if (!signature)  {
		throw new AppError('Missing x-slack-signature header', 400);
	}

	if (Date.now() - (parseInt(timestamp) * 1000) > MAX_AGE) {
		throw new AppError('Request is too old', 400);
	}

	const [version, hexStr] = signature.split('=');
	const expectedHash = Buffer.from(hexStr, 'hex');

	const signedData = `${version}:${timestamp}:${ctx.request.rawBody}`;
	const hmac = crypto.createHmac('sha256', signingSecret);
	hmac.update(signedData);
	const actualHash = hmac.digest();

	if (!crypto.timingSafeEqual(actualHash, expectedHash)) {
		throw new AppError('Request failed validation', 400);
	}

	await next();
};
