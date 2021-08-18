# group tomato slackbot

This is a slackbot that gets installed into a slack channel. You can start a Pomodoro session with `/tomato start` and it'll follow the 25, 5, 25, 5, 25, 20 minute cadence (configurable in code if you fork this). Anyone who wants to participate can respond to any tomato message with `:raising_hand:`, `:man-raising-hand:` or `:woman-raising-hand:` and they'll be @'ed on slack for each session start/end.

## configuration

1. `yarn install` to install dependencies
2. Rename `.env.sample` to `.env` and input your Slack credentials (see [this Slack guide](https://slack.dev/bolt-js/tutorial/getting-started) for more information about configuring your Slack app). Note, this Slack guide uses Socket mode, but the Tomato app does not.

### running locally

1. `yarn run start` will start the application
2. Use a tool like ngrok to expose your local server. Save the https url for a later step.
3. In Slack app settings (api.slack.com/apps), under Slash Commands, register a new command:
  - Command: `tomato`
  - Request URL: `https://<NGROK-URL>/slack/events`
  - Short description: `Group pomodoro app`
  - Usage hint: `[start, stop]`
4. In Slack app settings, under Event Subscriptions, enable events and use the following settings:
  - Request URL: `https://<NGROK-URL>/slack/events`
  - Subscribe to bot events: `reaction_added` and `reaction_removed`
5. In Slack app settings, under OAuth & Permissions, the following Scopes are required
  - `app_mentions:read`
  - `chat:write`
  - `commands`
