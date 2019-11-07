'use strict';

const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
	name: 'trivial',
	level: process.env.LOG_LEVEL || 'debug'
});
