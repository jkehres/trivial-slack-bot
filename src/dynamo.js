'use strict';

const AWS = require('aws-sdk');

/*
DynamoDB Schema Type 1 = {
	channel: 'C1H9RESGL',				// partition key - channel name from Slack API
	date: '2019-11-01',					// sort key - date entered by user
	slackId: '1503435956.000247',		// ts value from Slack API
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

DynamoDB Schema Type 2 = {
	channel: 'C1H9RESGL',				// partition key -channel name from Slack API
	date: '_current',					// sort key - magic alias value
	currentDate: '2019-11-01',			// date of current quiz question
}
*/

const TABLE_NAME = process.env.TABLE_NAME;

const marshall = AWS.DynamoDB.Converter.marshall;
const unmarshall = AWS.DynamoDB.Converter.unmarshall;

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

async function transactWriteItems(params) {
	try {
		await dynamodb.transactWriteItems(params).promise();
		return true;
	} catch (err) {
		if (err.code === 'TransactionCanceledException') {
			return false;
		}
		throw err;
	}
}

module.exports.getCurrentDate = async (channel) => {
	const result = await dynamodb.getItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date: '_current'}),
		ConsistentRead: true
	}).promise();
	return (result.Item) ? unmarshall(result.Item).currentDate : null;
};

module.exports.create = async ({channel, date, questionText}) => {
	return await transactWriteItems({
		TransactItems: [
			{
				Put: {
					TableName: TABLE_NAME,
					Item: marshall({channel, date, questionText, users: {}}),
					ExpressionAttributeNames: {
						'#channel': 'channel'
					},
					ConditionExpression: 'attribute_not_exists(#channel)'
				}
			},
			{
				Put: {
					TableName: TABLE_NAME,
					Item: marshall({channel, date: '_current', currentDate: date}),
					ExpressionAttributeNames: {
						'#channel': 'channel'
					},
					ConditionExpression: 'attribute_not_exists(#channel)'
				}
			}
		]
	});
};

module.exports.close = async ({channel, date, answer, answerText}) => {
	return await transactWriteItems({
		TransactItems: [
			{
				Update: {
					TableName: TABLE_NAME,
					Key: marshall({channel, date}),
					ExpressionAttributeNames: {
						'#channel': 'channel',
						'#answer': 'answer',
						'#answerText': 'answerText'
					},
					ExpressionAttributeValues: marshall({':answer': answer, ':answerText': answerText}),
					UpdateExpression: 'SET #answer = :answer, #answerText = :answerText',
					ConditionExpression: 'attribute_exists(#channel) and attribute_not_exists(#answer)'
				}
			},
			{
				Delete: {
					TableName: TABLE_NAME,
					Key: marshall({channel, date: '_current'}),
					ExpressionAttributeNames: {
						'#channel': 'channel'
					},
					ConditionExpression: 'attribute_exists(#channel)'
				}
			}
		]
	});
};

module.exports.setSlackId = async ({channel, date, slackId}) => {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#channel': 'channel',
			'#slackId': 'slackId'
		},
		ExpressionAttributeValues: marshall({':slackId': slackId}),
		UpdateExpression: 'SET #slackId = :slackId',
		ConditionExpression: 'attribute_exists(#channel) and attribute_not_exists(#slackId)'
	});
};

async function voteFirst({channel, date, user, answer, timestamp}) {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#channel': 'channel',
			'#answer': 'answer',
			'#users': 'users',
			'#user': user
		},
		ExpressionAttributeValues: marshall({':subObject': {answer, timestamp}}),
		UpdateExpression: 'SET #users.#user = :subObject',
		ConditionExpression: 'attribute_exists(#channel) and attribute_not_exists(#answer) and attribute_not_exists(#users.#user.#answer)'
	});
}

async function voteAgain({channel, date, user, answer}) {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#channel': 'channel',
			'#answer': 'answer',
			'#users': 'users',
			'#user': user
		},
		ExpressionAttributeValues: marshall({':answer': answer}),
		UpdateExpression: 'SET #users.#user.#answer = :answer',
		ConditionExpression: 'attribute_exists(#channel) and attribute_not_exists(#answer) and attribute_exists(#users.#user.#answer) and not #users.#user.#answer = :answer'
	});
}

module.exports.vote = async ({channel, date, user, answer, timestamp}) => {
	return await voteFirst({channel, date, user, answer, timestamp}) ||
		await voteAgain({channel, date, user, answer});
};

module.exports.query = async (channel, datePrefix) => {
	let lastEvaluatedKey = undefined;
	const items = [];

	do {
		const result = await dynamodb.query({
			TableName: TABLE_NAME,
			ExpressionAttributeNames: {
				'#channel': 'channel',
				'#date': 'date'
			},
			ExpressionAttributeValues: marshall({':channel': channel, ':datePrefix': datePrefix}),
			KeyConditionExpression: '#channel = :channel and begins_with(#date, :datePrefix)',
			ExclusiveStartKey: lastEvaluatedKey
		}).promise();
		lastEvaluatedKey = result.LastEvaluatedKey;
		result.Items.forEach(item => items.push(item));
	} while (lastEvaluatedKey);

	return items.map(unmarshall);
};
