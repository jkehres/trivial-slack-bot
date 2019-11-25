'use strict';

const logger = require('./logger');
const _ = require('lodash');
const AWS = require('aws-sdk');
const blockKit = require('./blockKit');
const slack = require('./slackClient');
const dynamo = require('./dynamo');

const allowedEvents = ['MODIFY', 'INSERT'];

module.exports.handler = async (event) => {
	logger.debug({event}, 'event');
	const unmarshalledRecords = event.Records
		.filter(record => allowedEvents.includes(record.eventName))
		.map(record => AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage))
		.filter(record => {
			if (!record.channel || !record.date) {
				logger.warn({record}, 'Bad Record');
				return false;
			}

			// Tag for a transient record that should be ignored.
			if (record.date === '_current') {
				return false;
			}

			// ignore cases where there is a userlist or an answer without a slackId
			if ((record.answer || Object.keys(record.users).length > 0) && !record.slackId) {
				return false;
			}

			return true;
		});

	logger.debug({unmarshalledRecords}, 'unmarshalledRecords');
	const groupedRecords = _.groupBy(unmarshalledRecords, record => `${record.channel}.${record.date}`);

	for (const records of Object.entries(groupedRecords)) {
		const latestRecord = records.pop().pop();
		logger.debug({latestRecord}, 'Event received');

		const responses = latestRecord.users && Object.keys(latestRecord.users).map(key => {
			return {
				name: `<@${key}>`,
				answer: latestRecord.users[key] && latestRecord.users[key].answer  === 'fact',
				timestamp: latestRecord.users[key] && latestRecord.users[key].timestamp
			};
		}).sort((a,b) => a.timestamp - b.timestamp);

		const blocks = blockKit.getOpenMessage({
			date: Date.parse(latestRecord.date),
			questionText: latestRecord.questionText,
			responses,
			answer: latestRecord.answer,
			answerText: latestRecord.answerText
		});

		await postMessage({
			date: latestRecord.date,
			channel: latestRecord.channel,
			blocks,
			slackId: latestRecord.slackId
		});
	}
};

async function postMessage({date, channel, blocks, slackId}) {
	const postMessageParamters = {
		date,
		channel,
		text: '',
		blocks,
		ts: slackId
	};

	const result = slackId
		? await slack.chat.update(postMessageParamters)
		: await slack.chat.postMessage(postMessageParamters);

	if (!result.ok) {
		logger.error({result}, 'Failed to set message');
		return;
	}

	if (!slackId) {
		logger.debug({result}, 'Setting message ts');
		await dynamo.setSlackId({
			date,
			channel,
			slackId: result.message.ts
		});
	}
}
