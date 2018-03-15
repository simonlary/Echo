import { Guild, Message, TextChannel, Util, VoiceChannel, VoiceConnection } from "discord.js";
import * as https from "https";
import * as ytdl from "ytdl-core";
import { Bot } from "./bot";
import { Config } from "./config";

interface IQueueElement {
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	connection: VoiceConnection;
	songs: ISong[];
	volume: number;
	playing: boolean;
}

interface ISong {
	title: string;
	url: string;
}

export class Music {
	private _queue: Map<string, IQueueElement> = new Map();
	private _config: Config;

	constructor(config: Config, bot: Bot) {
		this._config = config;
		bot.registerCommand("play", this.play);
		bot.registerCommand("stop", this.stop);
		bot.registerCommand("skip", this.skip);
		bot.registerCommand("np", this.np);
		bot.registerCommand("queue", this.queue);
		bot.registerCommand("volume", this.volume);
		bot.registerCommand("pause", this.pause);
		bot.registerCommand("resume", this.resume);
	}

	private play = async (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) { return msg.channel.send("You need to be in a voice channel to play music!"); }
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has("CONNECT")) {
			return msg.channel.send("I cannot connect to your voice channel, make sure I have the proper permissions!.");
		}
		if (!permissions.has("SPEAK")) {
			return msg.channel.send("I cannot speak in this voice channel, make sure I have the proper permissions!.");
		}

		let url = args[0];
		if (args[0].match(/https:\/\/www.youtube.com\/watch\?v=/g) === null) {
			// Search YouTube
			const search = args.join(" ");
			url = await this.searchYouTube(search);
		}

		const songInfo = await ytdl.getInfo(url);
		const song: ISong = {
			title: Util.escapeMarkdown(songInfo.title),
			url: songInfo.video_url,
		};
		if (!serverQueue) {
			const queueConstruct: IQueueElement = {
				textChannel: msg.channel as TextChannel,
				voiceChannel: voiceChannel as VoiceChannel,
				connection: null,
				songs: [],
				volume: 0.5,
				playing: true,
			};
			this._queue.set(msg.guild.id, queueConstruct);

			queueConstruct.songs.push(song);

			let connection;
			try {
				connection = await voiceChannel.join();
				queueConstruct.connection = connection;
				this.playNextSong(msg.guild, queueConstruct.songs[0]);
			} catch (error) {
				console.error(`Could not join voice channel : ${error}`);
				this._queue.delete(msg.guild.id);
				return msg.channel.send("I could not join the voice channel");
			}
		} else {
			serverQueue.songs.push(song);
			msg.channel.send(`**${song.title}** has beeen added to the queue!`);
		}
	}
	private stop = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);

		if (!msg.member.voiceChannel) { return msg.channel.send("You're not in a voice channel!"); }
		if (!serverQueue) { return msg.channel.send("There is nothing playing that I could stop for you."); }

		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end();
	}
	private skip = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);

		if (!msg.member.voiceChannel) { return msg.channel.send("You're not in a voice channel!"); }
		if (!serverQueue) { return msg.channel.send("There is nothing playing that I could skip for you."); }
		serverQueue.connection.dispatcher.end();
	}
	private np = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);
		if (!serverQueue) { return msg.channel.send("There is nothing playing right now."); }
		msg.channel.send(`Now playing : **${serverQueue.songs[0].title}**`);
	}
	private queue = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);
		if (!serverQueue) { return msg.channel.send("There is nothing playing right now."); }
		let message = "__**Song queue:**__\n";
		message += serverQueue.songs.map((song) => {
			return `**-** ${song.title}`;
		}).join("\n");
		msg.channel.send(message);
	}
	private volume = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);

		if (!msg.member.voiceChannel) { return msg.channel.send("You're not in a voice channel!"); }
		if (!serverQueue) { return msg.channel.send("There is nothing playing right now."); }

		if (!args[0]) { return msg.channel.send(`The current volume is **${serverQueue.volume * 100}**`); }

		serverQueue.volume = Math.abs(Number.parseInt(args[0])) / 100;
		serverQueue.volume = (serverQueue.volume > 1) ? 1 : serverQueue.volume;
		serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume);
		msg.channel.send(`The new volume is **${serverQueue.volume * 100}**`);
	}
	private pause = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);
		if (!serverQueue || !serverQueue.playing) { return msg.channel.send("There is nothing playing right now."); }
		serverQueue.playing = false;
		serverQueue.connection.dispatcher.pause();
		msg.channel.send("Paused the music!");
	}
	private resume = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild.id);
		if (!serverQueue || serverQueue.playing) { return msg.channel.send("There is nothing paused right now."); }
		serverQueue.playing = true;
		serverQueue.connection.dispatcher.resume();
		msg.channel.send("Resumed the music!");
	}

	private playNextSong(guild: Guild, song: ISong) {
		const serverQueue = this._queue.get(guild.id);

		if (!song) {
			serverQueue.voiceChannel.leave();
			this._queue.delete(guild.id);
			return;
		}

		const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
			.on("end", () => {
				serverQueue.songs.shift();
				this.playNextSong(guild, serverQueue.songs[0]);
			})
			.on("error", (error) => {
				console.error(`Error playing music : ${error}`);
			});
		dispatcher.setVolumeLogarithmic(serverQueue.volume);

		serverQueue.textChannel.send(`Start playing : **${song.title}**`);
	}

	private searchYouTube(search: string): Promise<string> {
		return new Promise((resolve) => {
			search = encodeURIComponent(search);
			https.get(`https://www.youtube.com/results?search_query=${search}`, (response) => {
				response.setEncoding("utf8");
				let data = "";
				response.on("data", (chunk) => {
					data += chunk;
				}).on("end", () => {
					const position = data.indexOf("/watch?v=");
					const videoId = data.slice(position + 9, position + 20);
					resolve(`https://www.youtube.com/watch?v=${videoId}`);
				});
			});
		});
	}
}
