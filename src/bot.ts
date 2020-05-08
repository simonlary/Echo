import { Client, Message, Util, MessageEmbed } from "discord.js";
import { AudioCommands } from "./audioCommands";
import { Config } from "./config";
import { Music } from "./music";
import { Utilities } from "./utilities";

type Command = (msg: Message, args: string[]) => void;

export class Bot {
	public client: Client;

	private readonly MAX_MESSAGE_LENGTH = 2000;

	private _config: Config;
	private _music: Music;
	private _audioCommands: AudioCommands;
	private _utilities: Utilities;
	private _commands: Map<string, Command> = new Map();
	private _help : Map<string, string> = new Map();

	constructor(config: Config) {
		this._config = config;

		this.registerCommand("help", this.help, "Show available commands");

		this.client = new Client();
		this._music = new Music(config, this);
		this._utilities = new Utilities(config, this);
		this._audioCommands = new AudioCommands(config, this);

		this.client.on("warn", console.warn);
		this.client.on("error", console.error);
		this.client.on("ready", () => { console.log("Ready!"); });
		this.client.on("disconnect", () => { console.log("Disconnected"); });
		this.client.on("message", this.onmessage);

		this.client.login(this._config.TOKEN);
	}

	public registerCommand(name: string, command: Command, help?: string) {
		this._commands.set(name, command);

		if(help != null) {
			this._help.set(name, help);
		}
	}

	public registerHelp(name: string, help: string) {
		if (name != null && name != "" && help != null && help != "")
			this._help.set(name, help);
	}

	private onmessage = async (msg: Message) => {
		if (msg.author == null || msg.author.bot) { return; }
		if (!msg.content.startsWith(this._config.PREFIX)) { return; }

		const args = msg.content.split(" ");
		const cmd = args.shift()!.slice(this._config.PREFIX.length);
		if (msg.guild === undefined) {
			return msg.reply("You can't send commands by direct message. Use a channel on a server.");
		}
		if (this._commands.get(cmd) !== undefined) {
			// try {
				this._commands.get(cmd)!(msg, args);
			// } catch (exception) {
			// 	console.error(`Error executing command '${msg.content}' : ${exception.message}`)
			// }
			if (this._config.DELETE_CALLING_MESSAGES) { msg.delete(); }
		}
	}

	private help = (msg: Message, args: string[]) => {
		const embed = new MessageEmbed()
			.setTitle('HELP')
			.setColor(0xA10025);

		for (const [name, help] of this._help) {
			embed.addField(name, help);
		}

		msg.channel.send(embed);
	}

}
