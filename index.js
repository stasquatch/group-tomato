const { App } = require('@slack/bolt');
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
				// use promises to make sure all steps finish before continuing
				let sessionNumber = index + 1;

				await say(`Session #${sessionNumber} starts in ${sessionBuffer} minutes, ${sessionParticipants.map(user => `<@${user}>`).join(', ')}. Post your goal in this thread :thread: *Note:* You can join anytime to be @'ed at the end of each session by using :woman-raising-hand: on any tomato message`);
				await timeout(sessionBuffer * 1000 * 60);

				await say(`Session #${sessionNumber} starting now. Heads down ${sessionParticipants.map(user => `<@${user}>`).join(', ')}`);
				await timeout(1 * 1000 * 60)

				await say(`Session #${sessionNumber} is over, ${sessionParticipants.map(user => `<@${user}>`).join(', ')}! How'd you do on your goals? :thread:`);
			} else {
				await say(`Break time, ${sessionParticipants.map(user => `<@${user}>`).join(', ')}! See you back here in ${pomodoroCadence[index].length} minutes`)
				await timeout(pomodoroCadence[index].length * 1000 * 60);
			}
		}
	} else if (command.text === 'stop') {
		await say('Cancelling the active session. You can start a new one with `/tomato start`');
		sessionParticipants = [];
		isActive = false;
		clearActiveTimeout();
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
	await app.start(process.env.PORT || 3000);
})();