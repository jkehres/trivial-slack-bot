'use strict';

const AWS = require('aws-sdk');

/*
Table Schema = {
	channel: 'C1H9RESGL',				// channel name from Slack API
	data: '2019-11-01',					// date entered by user
	slackId: '1503435956.000247,		// ts value from Slack API
	questionText: 'some text',			// text entered by user, may be zero length
	answer: 'fact',						// 'fact' or 'crap'
	answerText: 'some text',			// text entered by user, may be zero length
	users: {							// map with one key per user
		UB9NQLNNR: {					// username from Slack API
			timestamp: 1573618530557,	// Unix time of first vote in milliseconds
			answer: 'fact'				// 'fact' or 'crap'
		},
		...
	}
}
*/

const TABLE_NAME = process.env.TABLE_NAME;

const marshall = AWS.DynamoDB.Converter.marshall;
const dynamodb = new AWS.DynamoDB({region: process.env.AWS_REGION});

async function updateItem(params) {
	try {
		await dynamodb.updateItem(params).promise();
		return true;
	} catch (err) {
		if (err.code === 'ConditionalCheckFailedException') {
			return false;
		}
		throw err;
	}
}

module.exports.create = async ({channel, date, questionText}) => {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#qt': 'questionText'
		},
		ExpressionAttributeValues: marshall({':qt': questionText}),
		UpdateExpression: 'SET #qt = :qt',
		ConditionExpression: 'attribute_not_exists(#c)'
	});
};

module.exports.close = async ({channel, date, answer, answerText}) => {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#a': 'answer',
			'#at': 'answerText'
		},
		ExpressionAttributeValues: marshall({':a': answer, ':at': answerText}),
		UpdateExpression: 'SET #a = :a, #at = :at',
		ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#a)'
	});
};

module.exports.setSlackId = async ({channel, date, slackId}) => {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#sid': 'slackId'
		},
		ExpressionAttributeValues: marshall({':sid': slackId}),
		UpdateExpression: 'SET #sid = :sid',
		ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#sid)'
	});
};

module.exports.vote = async ({channel, date, user, answer, timestamp}) => {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#t': `users.${user}.timestamp`,
			'#a': `users.${user}.answer`
		},
		ExpressionAttributeValues: marshall({':t': timestamp, ':a': answer}),
		UpdateExpression: 'SET #t = :t, #a = :a',
		ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#a)'
	});
};

module.exports.changeVote = async ({channel, date, user, answer}) => {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#a': `users.${user}.answer`
		},
		ExpressionAttributeValues: marshall({':a': answer}),
		UpdateExpression: 'SET #a = :a',
		ConditionExpression: 'attribute_exists(#c) and attribute_exists(#a) and not #a = :a'
	});
};
