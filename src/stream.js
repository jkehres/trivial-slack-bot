'use strict';

const logger = require('./logger');
const groupBy = require('lodash.groupby');
const AWS = require('aws-sdk');
const blockKit = require('./blockKit');
const slack = require('./slackClient');
const dynamo = require('./dynamo');

const allowedEvents = ['MODIFY', 'INSERT'];

module.exports.handler = async (event) => {
	logger.debug({event}, 'event');
	const unmarshalledRecords = event.Records
		.filter(record => allowedEvents.includes(record.eventName))
		.map(record => AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage));
	logger.debug({unmarshalledRecords}, 'unmarshalledRecords');
	const groupedRecords = groupBy(unmarshalledRecords, record => {
		if (!record.channel || !record.date) {
			logger.warn({record}, 'Bad Record');
			return 'deleteMe';
		}

		return `${record.channel}.${record.date}`;
	});
	delete(groupedRecords['deleteMe']); // delete bad events

	for (const records of Object.entries(groupedRecords)) {
		logger.debug({records}, 'Records');
		const latestRecord = records.pop().pop();
		// Tag for a transient record that should be ignored.
		if (latestRecord.date === '_current') {
			continue;
		}
		logger.debug({latestRecord}, 'Event received');

		const responses = latestRecord.users && Object.keys(latestRecord.users).map(key => {
			return {
				name: `<@${key}>`,
				answer: latestRecord.users[key] && latestRecord.users[key].answer  === 'fact'
			};
		});

		const blockKitParamters = {
			date: Date.parse(latestRecord.date),
			questionText: latestRecord.questionText,
			responses,
			answer: latestRecord.answer,
			answerText: latestRecord.answerText
		};

		const blocks = latestRecord.answer
			? blockKit.getClosedMessage(blockKitParamters)
			: blockKit.getOpenMessage(blockKitParamters);

		const postMessageParamters = {
			date: latestRecord.date,
			channel: latestRecord.channel,
			text: '',
			blocks,
			ts: latestRecord.slackId
		};

		const result = latestRecord.slackId
			? await slack.chat.update(postMessageParamters)
			: await postMessage(postMessageParamters);

		if (!result.ok) {
			logger.error({result}, 'Failed to set message');
		}
	}
};

async function postMessage({date, channel, text, blocks}) {
	const result = await slack.chat.postMessage({
		channel,
		text,
		blocks
	});

	dynamo.setSlackId({
		date,
		channel,
		slackId: result.message.ts
	});

	return result;
}
