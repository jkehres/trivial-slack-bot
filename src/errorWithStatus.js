'use strict';

module.exports = (message, status) => {
	const err = new Error(message);
	err.status = status;
	return err;
};
