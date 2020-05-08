import { Guild, Message, TextChannel, Util } from "discord.js";
import * as https from "https";
import ytdl from "ytdl-core-discord";
import { Bot } from "./bot";
import { Config } from "./config";

interface IQueueElement {
	textChannel: TextChannel;
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
		bot.registerCommand("play", this.play, "Adds a video/song to the queue");
		bot.registerCommand("stop", this.stop, "Stops the music playback");
		bot.registerCommand("skip", this.skip, "Skip the currently playing song");
		bot.registerCommand("np", this.np, "Get the name of the currently playing song");
		bot.registerCommand("queue", this.queue, "Get a list of the currently queued songs");
		bot.registerCommand("volume", this.volume, "Set the volume between 1-100");
		bot.registerCommand("pause", this.pause, "Pause the music's playback");
		bot.registerCommand("resume", this.resume, "Resume the music's playback if it was paused");
	}

	private play = async (msg: Message, args: string[]) => {
		if (args.length === 0) { return msg.channel.send("You need to pass a song name or YouTube url to play!"); }
		const voiceChannel = msg.member!.voice.channel;
		if (!voiceChannel) { return msg.channel.send("You need to be in a voice channel to play music!"); }
		const permissions = voiceChannel.permissionsFor(msg.client.user!);
		if (permissions != null && !permissions.has("CONNECT")) {
			return msg.channel.send("I cannot connect to your voice channel, make sure I have the proper permissions!.");
		}
		if (permissions != null && !permissions.has("SPEAK")) {
			return msg.channel.send("I cannot speak in this voice channel, make sure I have the proper permissions!.");
		}

		let url = args[0];
		if (args[0].match(/https:\/\/www.youtube.com\/watch\?v=/g) !== null) {
			// Youtube url
			const song = await this.queueSong(url, msg);
			msg.channel.send(`**${song!.title}** has beeen added to the queue!`);
		} else if (args[0].match(/https:\/\/www.youtube.com\/playlist\?list=/g) !== null) {
			// YouTube playlist
			this.queuePlaylist(args[0], msg);
		} else {
			// YouTube search
			const search = args.join(" ");
			url = await this.searchYouTube(search);
			const song = await this.queueSong(url, msg);
			msg.channel.send(`**${song!.title}** has beeen added to the queue!`);
		}
	}

	private stop = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);

		if (!msg.member!.voice.channel) { return msg.channel.send("You're not in a voice channel!"); }
		if (!serverQueue) { return msg.channel.send("There is nothing playing that I could stop for you."); }

		serverQueue.songs = [];
		msg.guild!.me!.voice.connection!.dispatcher.end();
	}
	private skip = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);

		if (!msg.member!.voice.channel) { return msg.channel.send("You're not in a voice channel!"); }
		if (!serverQueue) { return msg.channel.send("There is nothing playing that I could skip for you."); }
		
		msg.guild!.me!.voice.connection!.dispatcher.end();
	}
	private np = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);
		if (!serverQueue) { return msg.channel.send("There is nothing playing right now."); }
		msg.channel.send(`Now playing : **${serverQueue.songs[0].title}**`);
	}
	private queue = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);
		if (!serverQueue) { return msg.channel.send("There is nothing playing right now."); }
		let message = "__**Song queue:**__\n";
		message += serverQueue.songs.map((song) => {
			return `**-** ${song.title}`;
		}).join("\n");
		msg.channel.send(message);
	}
	private volume = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);

		if (!msg.member!.voice.channel) { return msg.channel.send("You're not in a voice channel!"); }
		if (!serverQueue) { return msg.channel.send("There is nothing playing right now."); }

		if (!args[0]) { return msg.channel.send(`The current volume is **${serverQueue.volume * 100}**`); }

		serverQueue.volume = Math.abs(Number.parseInt(args[0], 10)) / 100;
		serverQueue.volume = (serverQueue.volume > 1) ? 1 : serverQueue.volume;
		msg.guild!.me!.voice.connection!.dispatcher.setVolumeLogarithmic(serverQueue.volume);
		msg.channel.send(`The new volume is **${serverQueue.volume * 100}**`);
	}
	private pause = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);
		if (!serverQueue || !serverQueue.playing) { return msg.channel.send("There is nothing playing right now."); }
		serverQueue.playing = false;
		msg.guild!.me!.voice.connection!.dispatcher.pause();
		msg.channel.send("Paused the music!");
	}
	private resume = (msg: Message, args: string[]) => {
		const serverQueue = this._queue.get(msg.guild!.id);
		if (!serverQueue || serverQueue.playing) { return msg.channel.send("There is nothing paused right now."); }
		serverQueue.playing = true;
		msg.guild!.me!.voice.connection!.dispatcher.resume();
		msg.channel.send("Resumed the music!");
	}

	private async playNextSong(guild: Guild, song: ISong) {
		const serverQueue = this._queue.get(guild.id)!;

		if (guild.me != null && guild.me.voice.channel != null && !song) {
			guild.me.voice.channel.leave();
			this._queue.delete(guild.id);
			return;
		}

		const dispatcher = guild.me!.voice.connection!.play(await ytdl(song.url), { type: "opus" })
			.on("finish", () => {
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

	private async queueSong(url: string, message: Message): Promise<ISong | undefined> {
		const serverQueue = this._queue.get(message.guild!.id);
		const songInfo = await ytdl.getInfo(url);
		const song: ISong = {
			title: Util.escapeMarkdown(songInfo.title),
			url: songInfo.video_url,
		};
		if (!serverQueue) {
			const queueConstruct: IQueueElement = {
				textChannel: message.channel as TextChannel,
				songs: [],
				volume: 0.5,
				playing: true,
			};
			this._queue.set(message.guild!.id, queueConstruct);

			queueConstruct.songs.push(song);

			try {
				await message.member!.voice.channel!.join();
				this.playNextSong(message.guild!, queueConstruct.songs[0]);
			} catch (error) {
				console.error(`Could not join voice channel : ${error}`);
				this._queue.delete(message.guild!.id);
				message.channel.send("I could not join the voice channel");
				return undefined;
			}
		} else {
			serverQueue.songs.push(song);
		}
		return song;
	}

	private queuePlaylist(url: string, message: Message) {
		https.get(url, (response) => {
			response.setEncoding("utf8");
			let data = "";
			response.on("data", (chunk) => {
				data += chunk;
			}).on("end", async () => {
				const regex = /spf-link \" dir=\"ltr\"/g;
				let match = regex.exec(data);

				const songs = [];
				while (match != null) {
					const s = await this.queueSong(`https://www.youtube.com${data.substr(match.index + 27, 20)}`, message);
					songs.push(s);
					match = regex.exec(data);
				}

				message.channel.send(`${songs.map((s) => s!.title).join("\n")}\n added to the queue.`);
			});
		});
	}
}
