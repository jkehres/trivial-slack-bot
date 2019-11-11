'use strict';

const logger = require('./logger');

module.exports.handler = async (event) => {
	logger.debug({event}, 'Event received');
};
