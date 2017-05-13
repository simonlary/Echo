const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const https = require('https');

const ReadFolder = function (folder) {
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

const PlayNext = function (voiceConnection) {
	let guildId = voiceConnection.channel.guild.id;
	if (queues[guildId] == undefined || queues[guildId].queue.length == 0)
		return;
	current[guildId] = queues[guildId].queue.shift();
	queues[guildId].dispatcher = voiceConnection.playStream(ytdl.downloadFromInfo(current[guildId], { filter: "audioonly" }), { volume: queues[guildId].volume });
	queues[guildId].dispatcher.on("end", function (reason) {
		if (queues[guildId] != undefined)
			delete queues[guildId].dispatcher;
		PlayNext(voiceConnection);
	});
};

const AddToQueue = function (url, message) {
	ytdl.getInfo(url, function (err, info) {
		queues[message.guild.id].queue.push(info);
		if (queues[message.guild.id].queue.length == 1 && message.guild.voiceConnection.speaking == false) // Start playback if first song added
		{
			PlayNext(message.guild.voiceConnection);
		}
		message.reply("`" + info.title + "`" + " has been added to the queue.");
	});
};

let current = {};
let queues = {};

exports.commands = {
	/////////////
	//  MUSIC //
	/////////////
	"play": {
		usage: "play <url | name to search>",
		description: "Adds a video/song to the queue",
		process: function (bot, message, params) {
			if (params[0] == undefined)
			{
				exports.commands["help"].process(bot, message, "play");
				return;
			}
			if (message.guild.voiceConnection != undefined)
			{
				let url = params[0];
				if (url.match(/https:\/\/www.youtube.com\/watch\?v=/g) != null)
				{
					// YouTube video URL
					AddToQueue(params[0], message);
				}
				else if (url.match(/https:\/\/www.youtube.com\/playlist\?list=/g) != null)
				{
					https.get(url, function (response) {
						response.setEncoding('utf8');
						let data = "";
						response.on('data', function (chunk) {
							data += chunk;
						}).on('end', function () {
							// Find the video ID
							let position = data.indexOf("data-video-id=");
							while (position != -1)
							{
								let videoId = data.slice(position + 15, position + 26);
								AddToQueue("https://www.youtube.com/watch?v=" + videoId, message);
								position = data.indexOf("data-video-id=", position + 30);
							}
							message.reply("Adding playlist completed");
						})
					})
				}
				else // Search query
				{
					// Download the YouTube search page for that search term
					https.get('https://www.youtube.com/results?search_query=' + encodeURIComponent(params.join(" ")), function (response) {
						response.setEncoding('utf8');
						let data = "";
						response.on('data', function (chunk) {
							data += chunk;
						}).on('end', function () {
							// Find the video ID
							let position = data.indexOf("/watch?v=");
							let videoId = data.slice(position + 9, position + 20);
							AddToQueue("https://www.youtube.com/watch?v=" + videoId, message);
						})
					})
				}
			}
		}
	},
	"pause": {
		usage: "pause",
		description: "Pause the music's playback",
		process: function (bot, message, params) {
			if (queues[message.guild.id] == undefined)
			{
				message.reply("I'm not in a voice channel!");
				return;
			}
			if (queues[message.guild.id].dispatcher == undefined)
			{
				message.reply("Nothing to pause!");
				return;
			}
			if (queues[message.guild.id].dispatcher.paused)
			{
				message.reply("Already paused!");
				return;
			}
			queues[message.guild.id].dispatcher.pause();
		}
	},
	"resume": {
		usage: "resume",
		description: "Resume the music's playback if it was paused",
		process: function (bot, message, params) {
			if (queues[message.guild.id] == undefined)
			{
				message.reply("I'm not in a voice channel!");
				return;
			}
			if (queues[message.guild.id].dispatcher == undefined)
			{
				message.reply("Nothing to pause!");
				return;
			}
			if (queues[message.guild.id].dispatcher.paused == false)
			{
				message.reply("Already playing!");
				return;
			}
			queues[message.guild.id].dispatcher.resume();
		}
	},
	"skip": {
		usage: "skip",
		description: "Skip the currently playing song",
		process: function (bot, message, params) {
			if (queues[message.guild.id] == undefined)
			{
				message.reply("I'm not in a voice channel!");
				return;
			}
			if (queues[message.guild.id].dispatcher == undefined)
			{
				message.reply("Nothing to skip!");
				return;
			}
			queues[message.guild.id].dispatcher.end();
		}
	},
	"queue": {
		usage: "queue",
		description: "Get a list of the currently queued songs",
		process: function (bot, message, params) {
			if (message.guild.voiceConnection != undefined)
			{
				if (queues[message.guild.id].queue.length > 0)
				{
					let queue = "```\n";
					queue += "Now playing: " + current[message.guild.id].title + "\n\n";
					queues[message.guild.id].queue.forEach(function (info, index) {
						queue += ((index + 1) + ". " + info.title + "\n");
					});
					queue += "```";
					message.reply(queue);
				}
				else
				{
					message.reply("No queue!");
				}
			}
			else
			{
				message.reply("The bot is not in any room");
			}
		}
	},
	"volume": {
		usage: "volume <1-100>",
		description: "Set the volume between 0-100",
		process: function (bot, message, params) {
			if (params[0] == undefined)
			{
				exports.commands["help"].process(bot, message, "volume");
				return;
			}

			var volume = Math.abs(params[0]) / 100;
			volume = (volume > 1) ? 1 : volume;

			if (queues[message.guild.id] != undefined)
			{
				queues[message.guild.id].volume = volume;
				if (queues[message.guild.id].dispatcher != undefined)
				{
					queues[message.guild.id].dispatcher.setVolumeLogarithmic(volume);
				}
			}
		}
	},
	"clear": {
		usage: "clear",
		description: "Clear the queue",
		permission: "musiccontrol",
		process: function (bot, message, params) {
			message.reply("\n**Clearing queue**");
			queues[message.guild.id].queue = [];
		}
	},
	"np": {
		usage: "np",
		description: "Get the name of the song currently playing",
		process: function (bot, message, params) {
			if (current[message.guild.id] != undefined)
			{
				message.reply("\n**Now playing:** " + current[message.guild.id].title);
			}
		}
	},
	"summon": {
		usage: "summon",
		description: "Summon the bot to your current voice channel",
		process: function (bot, message, params) {
			for (let channel of message.guild.channels)
			{
				if (channel[1].type === "voice")
				{
					for (let member of channel[1].members)
					{
						if (member[1].id === message.author.id)
						{
							channel[1].join();
							queues[message.guild.id] = {
								dispatcher: undefined,
								queue: []
							};
							return;
						}
					}
				}
			}
			message.reply("You can't summon me if you're not in a voice channel!");
		}
	},
	"disconnect": {
		usage: "disconnect",
		description: "Disconnect the bot from his current voice channel",
		process: function (bot, message, params) {
			if (message.guild.voiceConnection != undefined)
			{
				message.guild.voiceConnection.disconnect();
				delete queues[message.guild.id];
				delete current[message.guild.id]
			}
		}
	},
	////////////////
	//  UTILITIES //
	////////////////
	"link": {
		usage: "link",
		description: "Get the link to add the bot to your server",
		process: function (bot, message, params, config) {
			message.reply(config.link);
		}
	},
	"code": {
		usage: "code",
		description: "Format code",
		process: function (bot, message, params) {
			let code = "```" + params[0] + "\n";
			params.splice(0, 1);
			code += params.join(' ') + "\n" + "```";

			message.reply(code, true);
			message.delete();
		}
	},
	"help": {
		usage: "help",
		description: "Show available commands",
		process: function (bot, message, params) {
			let commandsList = "```";
			let spacing = " ";
			Object.keys(exports.commands).forEach(function (element) {
				commandsList += element + ": ";
				commandsList += spacing.repeat(15 - element.length);
				commandsList += exports.commands[element].description + "\n";
			});
			commandsList += "```";
			message.reply(commandsList);
		}
	}
}