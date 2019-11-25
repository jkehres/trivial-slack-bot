'use strict';

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
const AppError = require('./AppError');
const logger = require('./logger');
const blockKit = require('./blockKit');
const slack = require('./slackClient');
const dynamo = require('./dynamo');

async function postEphemeral({channel, text, blocks, user}) {
	const result = await slack.chat.postEphemeral({channel, text, blocks, user});
	if (!result.ok) {
		throw new AppError(`Failed to post message: ${result.error}`, 500);
	}
}

async function openView({trigger_id, view}) {
	const result = await slack.views.open({trigger_id, view});
	if (!result.ok) {
		throw new AppError(`Failed to open view: ${result.error}`, 500);
	}
}

const router = new Router();

router.get('/ping', async (ctx) => {
	ctx.response.body = 'hello';
	ctx.response.status = 200;
});

router.get('/test', async (ctx) => {
	const result = await slack.api.test();
	ctx.response.body = result;
	ctx.response.status = 200;
});

router.post('/command', verifyRequest, commandHandler(async (command) => {
	logger.debug({command}, 'Received command');
	const channel = command.channel_id;
	const user = command.user_id;
	switch (command.text) {
		case 'help':
			logger.debug({user, channel}, 'Help command');
			return {
				response_type: 'ephemeral',
				text: 'You asked for help',
				blocks: blockKit.getHelpMessage()
			};
		case 'create': {
			const date = await dynamo.getCurrentDate(channel);
			logger.debug({user, channel, date}, 'Create command');
			if (date) {
				logger.debug({user, channel, date}, 'Create command failed');
				return {
					response_type: 'ephemeral',
					text: 'Create failed',
					blocks: blockKit.getMulitCreateErrorMessage(Date.parse(date))
				};
			} else {
				await openView({
					trigger_id: command.trigger_id,
					view: blockKit.getCreateModal(channel)
				});
			}
			break;
		}
		case 'close': {
			const date = await dynamo.getCurrentDate(channel);
			logger.debug({user, channel, date}, 'Close command');
			if (date) {
				await openView({
					trigger_id: command.trigger_id,
					view: blockKit.getCloseModal({
						channel,
						date: Date.parse(date)
					})
				});
			} else {
				logger.debug({user, channel, date}, 'Close command failed');
				return {
					response_type: 'ephemeral',
					text: 'Close failed',
					blocks: blockKit.getCloseErrorMessage()
				};
			}
			break;
		}
	}
}));

router.post('/action', verifyRequest, actionHandler(async (action) => {
	logger.debug({action}, 'Received action');
	const user = action.user.id;
	switch (action.type) {
		case 'view_submission': {
			const view = action.view;
			switch (view.callback_id) {
				case 'create': {
					const channel = view.private_metadata;
					const date = view.state.values.create_date_block.create_date_action.selected_date;
					const questionText = view.state.values.create_text_block.create_text_action.value || null;
					logger.debug({user, channel, date, questionText}, 'Create action');
					if (!await dynamo.create({channel, date, questionText})) {
						logger.debug({user, channel, date, questionText}, 'Create action failed');
						await postEphemeral({
							channel,
							user,
							text: 'Create failed',
							blocks: blockKit.getRecreateErrorMessage(Date.parse(date))
						});
					}
					break;
				}
				case 'close': {
					const {channel, date} = JSON.parse(view.private_metadata);
					const answer = view.state.values.close_answer_block.close_answer_action.selected_option.value;
					const answerText = view.state.values.close_text_block.close_text_action.value || null;
					logger.debug({user, channel, date, answer, answerText}, 'Close action');
					if (!await dynamo.close({channel, date, answer, answerText})) {
						logger.debug({user, channel, date, answer, answerText}, 'Close action failed');
						await postEphemeral({
							channel,
							user,
							text: 'Internal error',
							blocks: blockKit.getInternalErrorMessage()
						});
					}
					break;
				}
			}
			break;
		}
		case 'block_actions': {
			const [answer, date] = action.actions[0].value.split('_');
			const channel = action.channel.id;
			const slackId = action.container.message_ts;
			const timestamp = Date.now();
			logger.debug({user, channel, date, answer, timestamp}, 'Vote action');
			await dynamo.vote({channel, date, user, answer, timestamp, slackId});
			break;
		}
	}
}));

router.post('/event', verifyRequest, eventHandler(async (event) => {
	logger.debug({event}, 'Received event');
	if (event.type === 'app_mention') {
		const channel = event.channel;
		const user = event.user;
		logger.debug({user, channel}, 'Mention event');
		await postEphemeral({
			channel,
			user,
			text: 'You mentioned me',
			blocks: blockKit.getMentionedMessage()
		});
	}
}));

const app = new Koa();
app.use(errorHandler);
app.use(requestResponseLogger);
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

module.exports.handler = serverless(app);
