# Echo: A Discord Music Bot

## Dependencies
- NodeJS

## Configuration file
A configuration file named `bot.config` is required to setup the bot. You need to add:
- The bot token from discord
- The prefix of the commands to use
- A boolean specifying if the bot should delete the message calling the command
- The external audio commands you would like to use

```json
{
	"token": "YOUR-TOKEN-HERE",
	"prefix" : "YOUR-PREFIX-HERE",
	"deleteCallingMessages" : true,
	"audioCommandsFolder": "YOUR-CONTAINING-FOLDER-PATH"
}
```

## External audio commands
Echo allows you to play audio files directly from the server. To do so, you need to add the audio files in a folder and the path to this folder in your config file. Every file in this folder will be able to be played by typing the name of the file (without the extension) with the prefix as a command.

Example:
```json
{
	"audioCommandsFolder": "myFolderFullOfFunnySounds"
}
```
