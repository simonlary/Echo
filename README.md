# Discord Music Bot

## Dependencies
- NodeJS

## Configuration file
The configuration file is required to setup the bot. You need to add:
- The bot token from discord
- A booleen specifying if the bot should delete the command message
- The external audio commands you would like to use

Example:
```json
{
	"token": "YOUR-TOKEN-HERE",
	"deleteCallingMessages" : true,
	"audioCommands": [
		{
			"command": "YOUR-COMMAND-NAME",
			"folder": "YOUR-CONTAINING-FOLDER-PATH"
		}
	]
}
```

## Usage
    npm install
	npm start
