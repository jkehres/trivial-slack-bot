# trivial-slack-bot

A Slack bot for tracking answers to true/false trivia questions. Designed for use with a Fact or Crap desk calendar available from calendars.com. Built with serverless technologies from AWS: Lambda, API Gateway, and DynamoDB.

## Prerequistes

1. A Slack account with permission to install apps
1. An AWS account with permission to create resources
1. An AWS CLI profile setup with AWS account credentials
1. Node.js installed

## Deployment

1. Open a browser and navigate to https://api.slack.com/apps
1. Click "Create New App".
1. Enter the name "Trivial Bot"
1. Slect a Slack workspace
1. Click "Create App"
1. In left panel, select "Bot Users"
1. Click "Add a Bot User"
1. Enter "trivial" for "Display name" and "Default username"
1. Toggle on "Always Show My Bot as Online"
1. Click "Add Bot User"
1. In left panel, select "Install App"
1. Click "Install App to Workspace"
1. Review permissions and click "Allow"
1. Record value of "Bot User OAuth Access Token"
1. In left pannel, select "Basic Information"
1. Under "App Credentials" click "Show" for "Signing Secret" and record value
1. Open a shell and navigate to root of repo
1. Run the command: `npm install`
1. Run the command: `npm run sls -- deploy --token <token> --signing-secret <secret> --profile <profile> --region <region> --stage <stage>`
1. Open a browser and navigate to AWS console
1. Navgiate to API Gateway service
1. Select API Gateway instance for bot
1. In left panel, select "Stages" then bot's stage name
1. Record "Invoke URL"
1. Return to https://api.slack.com/apps and the newly created app
1. In left panel, select "Event Subscriptions"
1. Toggle on "Enable Events"
1. Enter "`<invoke-url>/event`" for "Request URL"
1. Expand "Subscribe to bot events"
1. Click "Add Bot User Event"
1. Select "app_mention" event
1. Click "Save Changes"
1. In left pannel, select "Slash Commands"
1. Click "Create New Command"
1. Enter "/trivial" for "Command"
1. Enter "`<invoke-url>/command`" for "Request URL"
1. Enter "Start or end a round of trivia" for "Short Description"
1. Enter "\[help\] or \[create\] or \[close\]" for "Usage Hint"
1. Click "Save"
1. In left panel, select "Interactive Components"
1. Toggle on "Interactivity"
1. Enter "`<invoke-url>/action`" for "Request URL"
1. Click "Save Changes"
1. Test the bot by mentioning `@trivial` in Slack

## Redployment

1. Open a shell and navigate to root of repo
1. Run the command: `npm run sls -- deploy --token <token> --signing-secret <secret> --profile <profile> --region <region> --stage <stage>`

## Undeployment

1. Open a shell and navigate to root of repo
1. Run the command: `npm run sls -- remove --token <token> --signing-secret <secret> --profile <profile> --region <region> --stage <stage>`
1. Open a broweser and nvaigate to https://api.slack.com/apps and the previously created app
1. In left pannel, select "Basic Information"
1. At the bottom, click "Delete App"
