'use strict';

const crypto = require('crypto');
const logger = require('./logger');
const errorWithStatus = require('./errorWithStatus');

const MAX_AGE = 5 * 60 * 1000; // 5 minutes

const signingSecret = process.env.SLACK_SIGNING_SECRET;

module.exports = async (ctx, next) => {
	const timestamp = ctx.request.headers['x-slack-request-timestamp'];
	if (!timestamp)  {
		throw errorWithStatus('Missing x-slack-request-timestamp header', 400);
	}

	const signature = ctx.request.headers['x-slack-signature'];
	if (!signature)  {
		throw errorWithStatus('Missing x-slack-signature header', 400);
	}

	if (Date.now() - (parseInt(timestamp) * 1000) > MAX_AGE) {
		throw errorWithStatus('Request is too old', 400);
	}

	const [version, hexStr] = signature.split('=');
	const expectedHash = Buffer.from(hexStr, 'hex');

	const signedData = `${version}:${timestamp}:${ctx.request.rawBody}`;
	const hmac = crypto.createHmac('sha256', signingSecret);
	hmac.update(signedData);
	const actualHash = hmac.digest();

	logger.debug({timestamp, signedData, expectedHash, actualHash}, 'Validating request');
	if (!crypto.timingSafeEqual(actualHash, expectedHash)) {
		throw errorWithStatus('Request failed validation', 400);
	}

	await next();
};
