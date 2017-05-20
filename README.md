# Discord Music Bot

## Dependencies
- NodeJS

## Configuration file
The configuration file is required to setup the bot. You need to add:
- The bot token from discord
- The invite link to add the bot to a discord server
	- https://discordapp.com/oauth2/authorize?client_id=INSERT_ID_HERE&scope=bot

Example:
```json
{
	"token": "YOUR-TOKEN-HERE",
	"audioCommands": [
		{
			"command": "YOUR-COMMAND-NAME",
			"folder": "YOUR-CONTAINING-FOLDER-PATH"
		}
	],
	"link": "YOUR-INVITE-LINK"
}
```

## Usage
    npm install
	npm start
