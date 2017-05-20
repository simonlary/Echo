const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');

const bot = new Discord.Client();

let commands = {};
let customAudios = {};

const ReadFolder = function (folder) {
	console.log(folder);
	let elems = [];
	let files = fs.readdirSync(folder);
	files.forEach(function (file, index) {
		let filePath = path.join(folder, file);
		let stats = fs.statSync(filePath);
		if (!stats.isDirectory())
		{
			elems.push(filePath);
		}
	});
	return elems;
};

const HasPermission = function (user, guild, permission) {
	if (permission == undefined)
		return true;
	for (let role of guild.roles)
	{
		if (role[1].name == permission)
		{
			for (let member of role[1].members)
			{
				if (member[1].id === user.id)
					return true;
			}
			return false;
		}
	}
	return false;
};

const CheckMessageForCommand = function (message) {
	let args = message.content.split(' ');
	let cmd = args.shift();
	if (message.guild == undefined)
	{
		message.reply("You can't send commands by direct message. Use a channel on a server.");
		return;
	}
	if (commands[cmd] != undefined)
	{
		if (HasPermission(message.author, message.guild, commands[cmd].permission))
		{
			commands[cmd].process(bot, message, args, config);
		}
		else
		{
			message.reply("You don't have permission to use the '" + cmd + "' command. You need to have the '" + commands[cmd].permission + "' role.");
		}
	}
};

//////////////////
//  LOAD CONFIG //
//////////////////
if (fs.existsSync("bot.config") == false)
{
	console.error("No config found. Please create a 'bot.config' file.");
	process.exit();
}
let configFile = {};
try
{
	configFile = JSON.parse(fs.readFileSync('bot.config', 'utf8'));
} catch (e)
{
	console.error("Invalid configuration file : Your 'bot.config' file doesn't contain valid JSON.");
	process.exit();
}
// Check if necessary parameters are present
if (configFile.token == undefined)
{
	console.error("Missing bot token : You need a Discord bot token in your configuration file.");
	process.exit();
}
// Set default parameters if not present in config file
const config = {
	token: configFile.token,
	audioCommands: (Array.isArray(configFile.audioCommands)) ? configFile.audioCommands : [],
};

////////////////////
//  LOAD COMMANDS //
////////////////////
let src = require("./commands.js");
for (let cmd in src.commands)
{
	commands[cmd] = src.commands[cmd];
}
config.audioCommands.forEach(customCommand => {
	// Load audio files
	console.log(path.join(__dirname, customCommand.folder));
	customAudios[customCommand.command] = ReadFolder(path.join(__dirname, customCommand.folder));
	// Add the command
	commands[customCommand.command] = {
		usage: customCommand.command,
		description: "Play a random audio from the " + customCommand.command + " folder.",
		process: function (bot, message, params) {
			if (message.guild.voiceConnection == undefined)
			{
				commands["summon"].process(bot, message, params);
			}

			if (message.guild.voiceConnection != undefined)
			{
				console.log(customAudios[customCommand.command][Math.floor(Math.random() * customAudios[customCommand.command].length)]);
				message.guild.voiceConnection.playFile(customAudios[customCommand.command][Math.floor(Math.random() * customAudios[customCommand.command].length)]);
			}
		}
	}
});

///////////
//  MAIN //
///////////
bot.on('ready', () => {
	console.log('Ready!');
});

bot.on("message", (message) => CheckMessageForCommand(message));

bot.login(config.token);

//////////////
//   EXIT   //
//////////////
function exitHandler() {
	bot.destroy();
}
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);