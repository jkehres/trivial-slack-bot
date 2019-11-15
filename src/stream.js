'use strict';

const logger = require('./logger');
const groupBy = require('lodash.groupby');
const AWS = require('aws-sdk');
const allowedEvents = ['MODIFY', 'INSERT'];

module.exports.handler = async (event) => {
	const unmarshalledRecords = event.Records
		.filter(record => record.eventName && allowedEvents.includes(record.eventName))
		.map(record => AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage));

	const groupedRecords = groupBy(unmarshalledRecords, record => {
		if (!record.channel || !record.date) {
			return 'deleteMe';
		}

		return `${record.channel}.${record.date}`;
	});
	delete(groupedRecords['deleteMe']); // delete bad events

	for (const records of Object.entries(groupedRecords)) {
		const latestRecord = records.pop();
		logger.debug({latestRecord}, 'Event received');
	}

};
