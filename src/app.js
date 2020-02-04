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
const calcStats = require('./calcStats');

async function postMessage({channel, text, blocks, user, ephemeral}) {
	try {
		const post = ephemeral ? slack.chat.postEphemeral : slack.chat.postMessage;
		const result = await post({channel, text, blocks, user});
		if (!result.ok) {
			throw new AppError(`Failed to post message: ${result.error}`, 500);
		}
	} catch (err) {
		if (err.data && err.data.error) {
			throw new AppError(`Failed to post message: ${err.data.error}`, 500);
		} else {
			throw new AppError(`Failed to post message: ${err.message}`, 500);
		}
	}
}

async function openView({trigger_id, view}) {
	try {
		const result = await slack.views.open({trigger_id, view});
		if (!result.ok) {
			throw new AppError(`Failed to open view: ${result.error}`, 500);
		}
	} catch (err) {
		if (err.data && err.data.error) {
			throw new AppError(`Failed to open view: ${err.data.error}`, 500);
		} else {
			throw new AppError(`Failed to open view: ${err.message}`, 500);
		}
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
	const tokenizedText = command.text.split(' ');
	switch (tokenizedText[0]) {
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

		case 'stats': {
			if (tokenizedText.length != 2) {
				logger.debug({user, channel, commandText: command.text}, 'Invalid parameter count');
				return {
					response_type: 'ephemeral',
					text: 'Invalid command',
					blocks: blockKit.getInvalidCommandErrorMessage(command.text)
				};
			}

			const datePrefix = tokenizedText[1];
			if (!/\d{4}-\d{2}/.test(datePrefix)) {
				logger.debug({user, channel, datePrefix}, 'Invalid month parameter');
				return {
					response_type: 'ephemeral',
					text: 'Invalid command',
					blocks: blockKit.getInvalidCommandErrorMessage(command.text)
				};
			}

			const questions = await dynamo.query(channel, datePrefix);
			logger.debug({user, channel, datePrefix, questions}, 'Query result');

			const stats = calcStats(questions);
			logger.debug({user, channel, stats}, 'Stats result');

			await postMessage({
				channel,
				user,
				text: 'Results',
				blocks: blockKit.getStats(Object.assign({datePrefix}, stats)),
				ephemeral: false
			});
			break;
		}

		default: {
			logger.debug({user, channel, commandText: command.text}, 'Invalid command');
			return {
				response_type: 'ephemeral',
				text: 'Invalid command',
				blocks: blockKit.getInvalidCommandErrorMessage(command.text)
			};
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
						await postMessage({
							channel,
							user,
							text: 'Create failed',
							blocks: blockKit.getRecreateErrorMessage(Date.parse(date)),
							ephemeral: true
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
						await postMessage({
							channel,
							user,
							text: 'Internal error',
							blocks: blockKit.getInternalErrorMessage(),
							ephemeral: true
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
			const timestamp = Date.now();
			logger.debug({user, channel, date, answer, timestamp}, 'Vote action');
			await dynamo.vote({channel, date, user, answer, timestamp});
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
		await postMessage({
			channel,
			user,
			text: 'You mentioned me',
			blocks: blockKit.getMentionedMessage(),
			ephemeral: true
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
