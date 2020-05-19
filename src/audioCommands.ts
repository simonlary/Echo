import { Message } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { Bot } from "./bot";
import { Config } from "./config";

export class AudioCommands {

	private readonly SUPPORTED_EXTENSIONS = [".wav", ".mp3"];
	private blacklistedGuilds: string[] = [];

	constructor(config: Config, bot: Bot) {
		if (config.AUDIO_COMMANDS_FOLDER === "")
			return;

		const files = fs.readdirSync(config.AUDIO_COMMANDS_FOLDER);
		const validFiles = files.map(f => path.parse(f)).filter(f => this.SUPPORTED_EXTENSIONS.includes(f.ext));
		this.blacklistedGuilds = config.NO_AUDIO_COMMAND_GUILDS;

		if (validFiles.length === 0)
			return;

		bot.registerHelp("Custom audio commands available :", validFiles.map(x => x.name).join(", "));
		validFiles.forEach(f => bot.registerCommand(f.name, async (msg: Message, args: string[]) => this.ExecuteAudioCommand(msg, path.join(config.AUDIO_COMMANDS_FOLDER, f.base))));
	}

	private async ExecuteAudioCommand(msg: Message, file: string) {
		if (msg.guild != null && this.blacklistedGuilds.includes(msg.guild.id)) return;
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
			msg.guild!.voice!.connection!.play(file)
				.on("finish", () => {
					msg.guild!.me!.voice.channel!.leave();
				})
				.on("error", (error) => {
					console.error(`Error playing music : ${error}`);
				});
		} catch (error) {
			console.error(`Could not join voice channel : ${error}`);
			return msg.channel.send("I could not join the voice channel");
		}
	}
}
