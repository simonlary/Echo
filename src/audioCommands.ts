import { Message } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { Bot } from "./bot";
import { Config } from "./config";

export class AudioCommands {
	private _audios: Map<string, string[]> = new Map();

	constructor(config: Config, bot: Bot) {
		config.AUDIO_COMMANDS.forEach((customCommand) => {
			// Load audio files
			this._audios.set(customCommand.command, this.ReadFolder(customCommand.folder));

			// Add the command
			bot.registerCommand(customCommand.command, async (msg: Message, args: string[]) => {
				const voiceChannel = msg.member!.voice.channel;
				if (!voiceChannel) { return msg.channel.send("You need to be in a voice channel to play audios!"); }
				const permissions = voiceChannel.permissionsFor(msg.client.user!);
				if (permissions != null && !permissions.has("CONNECT")) {
					return msg.channel.send("I cannot connect to your voice channel, make sure I have the proper permissions!.");
				}
				if (permissions != null && !permissions.has("SPEAK")) {
					return msg.channel.send("I cannot speak in this voice channel, make sure I have the proper permissions!.");
				}

				if (msg.guild != null && msg.guild.voice != null && msg.guild.voice.connection) {
					return msg.channel.send("I am already in use in a voice channel!");
				}

				try {
					await voiceChannel.join();
					const cmd = this._audios.get(customCommand.command)!;
					msg.guild!.voice!.connection!.play(cmd[Math.floor(Math.random() * cmd.length)])
						.on("end", () => {
							msg.guild!.me!.voice.channel!.leave();
						})
						.on("error", (error) => {
							console.error(`Error playing music : ${error}`);
						});
				} catch (error) {
					console.error(`Could not join voice channel : ${error}`);
					return msg.channel.send("I could not join the voice channel");
				}
			});
		});
		if(config.AUDIO_COMMANDS.length > 0)
			bot.registerHelp("Custom audio commands available :", config.AUDIO_COMMANDS.map(x => x.command).join(", "));
	}

	private ReadFolder(folder: string) {
		const elems: string[] = [];
		const files = fs.readdirSync(folder);
		files.forEach((file, index) => {
			const filePath = path.join(folder, file);
			const stats = fs.statSync(filePath);
			if (!stats.isDirectory()) {
				elems.push(filePath);
			}
		});
		return elems;
	}
}
