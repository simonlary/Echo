# Echo: A Discord Music Bot

## Dependencies
- NodeJS

## Configuration file
A configuration file named `bot.config` is required to setup the bot. You need to add:
- The bot token from discord
- A booleen specifying if the bot should delete the command message
- The external audio commands you would like to use

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

## External audio commands
Echo allows you to play audio files directly from the server. To do so, you need to add the audio files in a folder and the path to this folder in your config file. You also need to tell the bot the name of the custom command. Each time you call the command, the bot will play one of the file randomly.

Example:
```json
{
	"audioCommands": [
		{
			"command": "rock",
			"folder": "music/myAwesomeRockPlaylist"
		}
	]
}
```

## Usage
    npm install
	npm start
