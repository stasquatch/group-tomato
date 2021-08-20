const { App } = require('@slack/bolt');
const pjson = require('./package.json');
const { timeout, clearActiveTimeout } = require('./timeHelpers');
require('dotenv').config();

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	socketMode: false,
	appToken: process.env.SLACK_APP_TOKEN
});

const enrollReactjis = [
	'raising_hand',
	'man-raising-hand',
	'woman-raising-hand'
];

const pomodoroSessionTypes = {
	session: 'session',
	shortBreak: 'shortBreak',
	longBreak: 'longBreak'
}

let sessionParticipants = [];
let isActive = false;
let sessionBuffer = 2; // in mins, the amount of time between sessions to post goals
let pomodoroCadence = [
	{
		type: pomodoroSessionTypes.session,
		length: 25
	}, {
		type: pomodoroSessionTypes.shortBreak,
		length: 5
	}, {
		type: pomodoroSessionTypes.session,
		length: 25
	}, {
		type: pomodoroSessionTypes.shortBreak,
		length: 5
	}, {
		type: pomodoroSessionTypes.session,
		length: 25
	}, {
		type: pomodoroSessionTypes.longBreak,
		length: 20
	}
]; // in mins

app.command('/tomato', async ({ command, ack, say }) => {
	await ack();

	if (command.text === 'start') {
		if (isActive) {
			await say('A session is already active, but you can stop it with `/tomato stop`');
			return;
		}

		isActive = true;
		sessionParticipants.push(command.user_id);

		// cycle through regular pomodoro cadence
		for (var index = 0; index < pomodoroCadence.length; index++) {
			if (pomodoroCadence[index].type === pomodoroSessionTypes.session) {
				if (sessionParticipants.length === 0) {
					await say('Oops, no participants. Ending this session, but you can start a new one with `/tomato start`');
					isActive = false;
					return;
				}

				let sessionNumber = index + 1;
				let length = pomodoroCadence[index].length;

				await say(`Session #${sessionNumber} starts in ${sessionBuffer} minutes, ${sessionParticipants.map(user => `<@${user}>`).join(', ')}. Post your goal in this thread :thread: *Note:* You can join anytime to be @'ed at the end of each session by using :woman-raising-hand: on any tomato message`);
				await timeout(sessionBuffer * 1000 * 60);

				await say(`Session #${sessionNumber} starts now and will last ${length} minutes. Heads down ${sessionParticipants.map(user => `<@${user}>`).join(', ')}`);
				await timeout(length * 1000 * 60);

				await say(`Session #${sessionNumber} is over, ${sessionParticipants.map(user => `<@${user}>`).join(', ')}! How'd you do on your goals? :thread:`);
				await timeout(10 * 1000) // ten seconds
			} else {
				await say(`Break time, ${sessionParticipants.map(user => `<@${user}>`).join(', ')}! See you back here in ${length} minutes`);
				await timeout(length * 1000 * 60);
			}

			isActive = false;
			await say('This pomodoro session is over, start a new one with `/tomato start`')
		}
	} else if (command.text === 'stop') {
		await say('Cancelling the active session. You can start a new one with `/tomato start`');
		sessionParticipants = [];
		isActive = false;
		clearActiveTimeout();
	} else if (command.text === 'help') {
		await say(`v${pjson.version}. I know the commands \`/tomato start\` and \`/tomato stop\` and will add or remove participants using ${enrollReactjis.map(emoji => `:${emoji}:`).join(', ')}`)
	} else {
		await say('I only know the `start` and `stop` command');
	}
});

// currently allows participants to enroll and leave whenever
app.event('reaction_added', ({ event }) => {
	if (isActive && enrollReactjis.includes(event.reaction)) {
		if (!sessionParticipants.includes(event.user)) {
			sessionParticipants.push(event.user)
		}
	}
});

app.event('reaction_removed', async ({ event }) => {
	if (isActive && enrollReactjis.includes(event.reaction)) {
		sessionParticipants = sessionParticipants.filter(person => person !== event.user)
	}
});

(async () => {
	const port = process.env.PORT || 3000;
	await app.start(port);
	console.log(`Running on port ${port}`);
})();