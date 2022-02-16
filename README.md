# Echo: A Discord Audio Clip Bot

## Dependencies

- Node.js >=16.6.0

## Configuration file

A configuration file named `bot.config` is required to setup the bot. You need to add:

- The bot token from discord.
- The folder where the files used for the audio commands you would like to use are.
- The ids of the guilds where you want to use these commands.

```json
{
  "token": "YOUR-TOKEN-HERE",
  "commandsFolder": "YOUR-CONTAINING-FOLDER-PATH",
  "guilds": ["YOUR-GUILD-ID"]
}
```
