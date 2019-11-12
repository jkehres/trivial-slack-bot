'use strict';

const logger = require('./logger');

module.exports.handler = async (event) => {
	event = decodeEvent({event});
	logger.debug({event}, 'Event received');
};

class Question {
	static get dbKeys() {
		return ['date', 'channel'];
	}

	get answers() {
		return this._answers;
	}

	get channel() {
		return this._channel;
	}

	get date() {
		return this._date;
	}

	constructor(image) {
		this._date = image.date.S;
		this._channel = image.channel.S;
		this._answers = [];
		Object.keys(image).forEach(key => {
			if (!Question.dbKeys.includes(key) && image[key] && image[key].M) {
				this._answers.push({
					name: key,
					answer: image[key].M.answer && image[key].M.answer.BOOL,
					timestamp: image[key].M.timestamp && image[key].M.timestamp.N,
				});
			}
		});
		this._answers.sort(this._compareAnswers);
	}

	_compareAnswers(a, b) {
		if (a.timestamp < b.timestamp) {
			return 1
		} else if (a.timestamp > b.timestamp) {
			return -1
		}

		if (a.name < b.name ) {
			return 1
		} else if (a.name > b.name) {
			return -1;
		}

		return 0;
	}
}

class DynamoDbRecord {
	constructor(record) {
		if(!record || !record.dynamodb || !record.dynamodb.Keys || record.dynamodb.SequenceNumber) {
			throw new Error('Bad Record');
		}
		this._keys = record.dynamodb.Keys;
		this._sequenceNumber = record.dynamodb.SequenceNumber;
		this._newImage = record.dynamodb.NewImage;
	}

	decodeImage(imageType) {
		return new imageType(this._newImage);
	}

	uniqueId() {
		var b = new Buffer(JSON.stringify(this._keys));
		return b.toString('base64');;
	}

	isMoreNewThan(record) {
		return record._sequenceNumber < this._sequenceNumber;
	}
}

function decodeEvent(event) {
	const records = {};
	event.event.Records.forEach(record => {
		try {
			record = new DynamoDbRecord(record);
			const uniqueRecordId = record.uniqueId();
			if (!records[uniqueRecordId] || record.isMoreNewThan(records[uniqueRecordId])) {
				records[uniqueRecordId] = record;
			}
		} catch(error) {
			logger.debug(error, 'Event received');
		}
	});

	return Object.values(records).map(element => element.decodeImage(Question));
}
