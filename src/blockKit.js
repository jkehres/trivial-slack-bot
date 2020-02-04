'use strict';

const dateFormat = require('dateformat');

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22If%20you%27d%20like%20to%20know%20more%20about%20me%2C%20just%20type%20%60%2Ftrivial%20help%60.%22%7D%7D%5D
module.exports.getMentionedMessage = function() {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'If you\'d like to know more about me, just type `/trivial help`.'
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Hi!%20I%27m%20Trivial%2C%20a%20trivia%20bot%20for%20Fact%20or%20Crap%20questions.%20Here%20are%20my%20commands%3A%5Cn%60%2Ftrivial%20create%60%20-%20post%20a%20new%20trivia%20question%20to%20the%20channel%5Cn%60%2Ftrivial%20close%60%20-%20post%20the%20answer%20to%20an%20open%20trivia%20question%22%7D%7D%5D
module.exports.getHelpMessage = function() {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Hi! I\'m Trivial, a trivia bot for Fact or Crap questions. Here are my commands:\n`/trivial create` - post a new trivia question to the channel\n`/trivial close` - post the answer to an open trivia question\n`/trivial stats YYYY-MM` - post the results for specified month'
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22A%20trivia%20question%20for%20November%208%2C%202019%20was%20previously%20posted%20in%20this%20channel.%20Please%20create%20a%20question%20for%20another%20date.%22%7D%7D%5D
module.exports.getRecreateErrorMessage = function(date) {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `A trivia question for ${dateFormat(date, 'mmmm d, yyyy')} was previously posted in this channel. Please create a question for another date.`
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22A%20trivia%20question%20for%20November%208%2C%202019%20is%20currently%20open%20in%20this%20channel.%20Please%20close%20this%20question%20with%20%60%2Ftrivial%20close%60%20before%20creating%20a%20new%20question.%22%7D%7D%5D
module.exports.getMulitCreateErrorMessage = function(date) {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `A trivia question for ${dateFormat(date, 'mmmm d, yyyy')} is currently open in this channel. Please close this question with \`/trivial close\` before creating a new question.`
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22No%20trivia%20question%20is%20currently%20open%20in%20this%20channel.%20To%20create%20a%20question%20use%20%60%2Ftrivial%20create%60.%22%7D%7D%5D
module.exports.getCloseErrorMessage = function() {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'No trivia question is currently open in this channel. To create a question use `/trivial create`.'
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22I%20don%27t%20understand%20the%20command%20%60%2Ftrivial%20foobar%60.%20Type%20%60%2Ftrivial%20help%60%20to%20see%20my%20available%20commands.%22%7D%7D%5D
module.exports.getInvalidCommandErrorMessage = function(commandText) {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `I don't understand the command \`/trivial ${commandText}\`. Type \`/trivial help\` to see my available commands.`
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Asob%3A%20Something%20went%20wrong.%20Please%20ask%20my%20admin%20to%20my%20check%20logs.%22%7D%7D%5D
module.exports.getInternalErrorMessage = function() {
	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: ':sob: Something went wrong. Please ask my admin to my check logs.'
			}
		}
	];
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Trivia%20question%20for%20November%208%2C%202019%5Cn%3E%20Harald%2C%20nicknamed%20Tangle-hair%2C%20took%20an%20oath%20not%20to%20cut%20or%20comb%20his%20hair%20until%20he%20became%20the%20first%20king%20of%20a%20united%20Norway.%22%7D%7D%2C%7B%22block_id%22%3A%22vote_block%22%2C%22type%22%3A%22actions%22%2C%22elements%22%3A%5B%7B%22action_id%22%3A%22vote_fact_action%22%2C%22type%22%3A%22button%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Fact%22%7D%2C%22style%22%3A%22primary%22%2C%22value%22%3A%22fact%22%7D%2C%7B%22action_id%22%3A%22vote_crap_action%22%2C%22type%22%3A%22button%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Crap%22%7D%2C%22style%22%3A%22danger%22%2C%22value%22%3A%22crap%22%7D%5D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3A%201%3A%20Alice%5Cn%3A-1%3A%20Bob%5Cn%3A%201%3A%20Carolyn%5Cn%3A%201%3A%20Dave%22%7D%7D%5D
module.exports.getTriviaMessage = function({date, questionText, responses, answer, answerText}) {
	let mainMarkdown = `Trivia question for ${dateFormat(date, 'mmmm d, yyyy')}`;
	if (questionText) {
		mainMarkdown += `\n> ${questionText}`;
	}
	if (answer) {
		mainMarkdown +=`\n*Answer:* ${(answer === 'fact') ? 'Fact' : 'Crap'}`;
		if (answerText) {
			mainMarkdown += `\n> ${answerText}`;
		}
	}

	const blocks = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: mainMarkdown
			}
		}
	];

	if (!answer) {
		const dateKey = dateFormat(date, 'yyyy-mm-dd');
		blocks.push({
			type: 'actions',
			elements: [
				{
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Fact'
					},
					style: 'primary',
					value: `fact_${dateKey}`
				},
				{
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Crap'
					},
					style: 'danger',
					value: `crap_${dateKey}`
				}
			]
		});
	}

	if (responses && responses.length > 0) {
		const responsesMarkdown = [];
		responses.forEach(resp => {
			const respEmoji = (resp.answer === 'fact') ? ':+1:' : ':-1:';
			if (answer) {
				const resultEmoji = (resp.answer === answer) ? ':heavy_check_mark:' : ':x:';
				responsesMarkdown.push(`${resultEmoji} ${respEmoji} <@${resp.name}>`);
			} else {
				responsesMarkdown.push(`${respEmoji} <@${resp.name}>`);
			}
		});

		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: responsesMarkdown.join('\n')
			}
		});
	}

	return blocks;
};

// https://api.slack.com/tools/block-kit-builder?mode=modal&view=%7B%22callback_id%22%3A%22create%22%2C%22type%22%3A%22modal%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Trivia%20Question%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Create%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Cancel%22%7D%2C%22blocks%22%3A%5B%7B%22block_id%22%3A%22create_date_block%22%2C%22type%22%3A%22input%22%2C%22element%22%3A%7B%22action_id%22%3A%22create_date_action%22%2C%22type%22%3A%22datepicker%22%2C%22initial_date%22%3A%222019-11-08%22%2C%22placeholder%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Select%20a%20date%22%7D%7D%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Date%22%7D%7D%2C%7B%22block_id%22%3A%22create_text_block%22%2C%22type%22%3A%22input%22%2C%22element%22%3A%7B%22action_id%22%3A%22create_text_action%22%2C%22type%22%3A%22plain_text_input%22%2C%22placeholder%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Text%20of%20question%20(optional)%22%7D%7D%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Text%22%7D%2C%22optional%22%3Atrue%7D%5D%7D
module.exports.getCreateModal = function(channel) {
	const now = new Date();
	return {
		callback_id: 'create',
		private_metadata: channel,
		type: 'modal',
		title: {
			type: 'plain_text',
			text: 'Trivia Question'
		},
		submit: {
			type: 'plain_text',
			text: 'Create'
		},
		close: {
			type: 'plain_text',
			text: 'Cancel'
		},
		blocks: [
			{
				block_id: 'create_date_block',
				type: 'input',
				element: {
					action_id: 'create_date_action',
					type: 'datepicker',
					initial_date: dateFormat(now, 'yyyy-mm-dd'),
					placeholder: {
						type: 'plain_text',
						text: 'Select a date'
					}
				},
				label: {
					type: 'plain_text',
					text: 'Date'
				}
			},
			{
				block_id: 'create_text_block',
				type: 'input',
				element: {
					action_id: 'create_text_action',
					type: 'plain_text_input',
					placeholder: {
						type: 'plain_text',
						text: 'Text of question (optional)'
					}
				},
				label: {
					type: 'plain_text',
					text: 'Text'
				},
				optional: true
			}
		]
	};
};

// https://api.slack.com/tools/block-kit-builder?mode=modal&view=%7B%22callback_id%22%3A%22close%22%2C%22type%22%3A%22modal%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Trivia%20Question%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Cancel%22%7D%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Date*%5CnNovember%208%2C%202019%22%7D%7D%2C%7B%22block_id%22%3A%22close_answer_block%22%2C%22type%22%3A%22input%22%2C%22element%22%3A%7B%22action_id%22%3A%22close_answer_action%22%2C%22type%22%3A%22static_select%22%2C%22placeholder%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Select%20an%20answer%22%7D%2C%22options%22%3A%5B%7B%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Fact%22%7D%2C%22value%22%3A%22fact%22%7D%2C%7B%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Crap%22%7D%2C%22value%22%3A%22crap%22%7D%5D%2C%22initial_option%22%3A%7B%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Fact%22%7D%2C%22value%22%3A%22fact%22%7D%7D%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Answer%22%7D%7D%2C%7B%22block_id%22%3A%22close_text_block%22%2C%22type%22%3A%22input%22%2C%22element%22%3A%7B%22action_id%22%3A%22close_text_action%22%2C%22type%22%3A%22plain_text_input%22%2C%22placeholder%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Text%20of%20answer%20(optional)%22%7D%7D%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Text%22%7D%2C%22optional%22%3Atrue%7D%5D%7D
module.exports.getCloseModal = function({channel, date}) {
	return {
		callback_id: 'close',
		private_metadata: JSON.stringify({channel, date: dateFormat(date, 'yyyy-mm-dd')}),
		type: 'modal',
		title: {
			type: 'plain_text',
			text: 'Trivia Question'
		},
		submit: {
			type: 'plain_text',
			text: 'Close'
		},
		close: {
			type: 'plain_text',
			text: 'Cancel'
		},
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*Date*\n${dateFormat(date, 'mmmm d, yyyy')}`
				}
			},
			{
				block_id: 'close_answer_block',
				type: 'input',
				element: {
					action_id: 'close_answer_action',
					type: 'static_select',
					placeholder: {
						type: 'plain_text',
						text: 'Select an answer'
					},
					options: [
						{
							text: {
								type: 'plain_text',
								text: 'Fact'
							},
							value: 'fact'
						},
						{
							text: {
								type: 'plain_text',
								text: 'Crap'
							},
							value: 'crap'
						}
					],
					initial_option: {
						text: {
							type: 'plain_text',
							text: 'Fact'
						},
						value: 'fact'
					}
				},
				label: {
					type: 'plain_text',
					text: 'Answer'
				}
			},
			{
				block_id: 'close_text_block',
				type: 'input',
				element: {
					action_id: 'close_text_action',
					type: 'plain_text_input',
					placeholder: {
						type: 'plain_text',
						text: 'Text of answer (optional)'
					}
				},
				label: {
					type: 'plain_text',
					text: 'Text'
				},
				optional: true
			}
		]
	};
};

// https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Trivia%20results%20for%20December%2C%202019%5Cn%5Cn%40user.one%3A%207%20%3Aheavy_check_mark%3A%2C%204%20%3Ax%3A%5Cn%40user.two%3A%205%20%3Aheavy_check_mark%3A%2C%206%20%3Ax%3A%5Cn%40user.longname%3A%205%20%3Aheavy_check_mark%3A%2C%206%20%3Ax%3A%5Cn%40short%3A%205%20%3Aheavy_check_mark%3A%2C%205%20%3Ax%3A%5Cn%5Cn*Most%20right%3A*%20%40user.one%5Cn*Most%20wrong%3A*%20%40user.two%2C%20%40user.longname%22%7D%7D%5D
module.exports.getStats = function({datePrefix, users, mostRight, mostWrong}) {
	const markdown = [`Trivia results for ${dateFormat(datePrefix, 'UTC:mmmm, yyyy')}`, ''];
	if (users.length === 0) {
		markdown.push('_(None found)_');
	} else {
		users.forEach(user => {
			markdown.push(`<@${user.name}>: ${user.right} :heavy_check_mark:, ${user.wrong} :x:`);
		});
		markdown.push('');
		markdown.push(`*Most right:* ${mostRight.map(u => `<@${u}>`).join(', ')}`);
		markdown.push(`*Most wrong:* ${mostWrong.map(u => `<@${u}>`).join(', ')}`);
	}

	return [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: markdown.join('\n')
			}
		}
	];
};
