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
					Item: marshall({channel, date, questionText}),
					ExpressionAttributeNames: {
						'#c': 'channel'
					},
					ConditionExpression: 'attribute_not_exists(#c)'
				}
			},
			{
				Put: {
					TableName: TABLE_NAME,
					Item: marshall({channel, date: '_current', currentDate: date}),
					ExpressionAttributeNames: {
						'#c': 'channel'
					},
					ConditionExpression: 'attribute_not_exists(#c)'
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
						'#c': 'channel',
						'#a': 'answer',
						'#at': 'answerText'
					},
					ExpressionAttributeValues: marshall({':a': answer, ':at': answerText}),
					UpdateExpression: 'SET #a = :a, #at = :at',
					ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#a)'
				}
			},
			{
				Delete: {
					TableName: TABLE_NAME,
					Key: marshall({channel, date: '_current'}),
					ExpressionAttributeNames: {
						'#c': 'channel'
					},
					ConditionExpression: 'attribute_exists(#c)'
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
			'#c': 'channel',
			'#sid': 'slackId'
		},
		ExpressionAttributeValues: marshall({':sid': slackId}),
		UpdateExpression: 'SET #sid = :sid',
		ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#sid)'
	});
};

async function voteFirst({channel, date, user, answer, timestamp}) {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#a': 'answer',
			'#ut': `users.${user}.timestamp`,
			'#ua': `users.${user}.answer`
		},
		ExpressionAttributeValues: marshall({':ut': timestamp, ':ua': answer}),
		UpdateExpression: 'SET #ut = :ut, #ua = :ua',
		ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#a) and attribute_not_exists(#ua)'
	});
}

async function voteAgain({channel, date, user, answer}) {
	return await updateItem({
		TableName: TABLE_NAME,
		Key: marshall({channel, date}),
		ExpressionAttributeNames: {
			'#c': 'channel',
			'#a': 'answer',
			'#ua': `users.${user}.answer`
		},
		ExpressionAttributeValues: marshall({':ua': answer}),
		UpdateExpression: 'SET #ua = :ua',
		ConditionExpression: 'attribute_exists(#c) and attribute_not_exists(#a) and attribute_exists(#ua) and not #ua = :ua'
	});
}

module.exports.vote = async ({channel, date, user, answer, timestamp}) => {
	return await voteFirst({channel, date, user, answer, timestamp}) ||
		await voteAgain({channel, date, user, answer});
};
