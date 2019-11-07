'use strict';

const { WebClient } = require('@slack/web-api');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const serverless = require('serverless-http');
const errorHandler = require('./errorHandler');
const requestResponseLogger = require('./requestResponseLogger');
const verifyRequest = require('./verifyRequest');
const commandHandler = require('./commandHandler');
const actionHandler = require('./actionHandler');
const eventHandler = require('./eventHandler');
const errorWithStatus = require('./errorWithStatus');
const logger = require('./logger');

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);
const router = new Router();

router.get('/ping', async (ctx) => {
	ctx.response.body = 'hello';
	ctx.response.status = 200;
});

router.get('/test', async (ctx) => {
	const result = await web.api.test();
	ctx.response.body = result;
	ctx.response.status = 200;
});

router.post('/command', verifyRequest, commandHandler(async (command) => {
	logger.debug({command}, 'Received command');
	return {
		response_type: 'ephemeral',
		text: `You sent the command '${command.text}'`
	};
}));

router.post('/action', verifyRequest, actionHandler(async (action) => {
	logger.debug({action}, 'Received action');
	return {
		response_type: 'ephemeral',
		text: 'You performed an action'
	};
}));

router.post('/event', verifyRequest, eventHandler(async (event) => {
	logger.debug({event}, 'Received event');
	if (event.type === 'app_mention') {
		const result = await web.chat.postEphemeral({
			channel: event.channel,
			user: event.user,
			text: 'You mentioned me'
		});
		if (!result.ok) {
			throw errorWithStatus(`Failed to post message: ${result.error}`, 500);
		}
	}
}));

const app = new Koa();
app.use(errorHandler);
app.use(requestResponseLogger);
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

module.exports.handler = serverless(app);
