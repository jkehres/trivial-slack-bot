'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_TOKEN;

module.exports = new WebClient(token);
