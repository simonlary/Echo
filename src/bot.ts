import { Client, Message, Util } from "discord.js";
import { AudioCommands } from "./audioCommands";
import { Config } from "./config";
import { Music } from "./music";
import { Utilities } from "./utilities";

interface ICommand {
	action: (msg: Message, args: string[]) => void;
	help: string;
}

export class Bot {
	public client: Client;

	private readonly MAX_MESSAGE_LENGTH = 2000;

	private _config: Config;
	private _music: Music;
	private _audioCommands: AudioCommands;
	private _utilities: Utilities;
	private _commands: Map<string, ICommand> = new Map();

	constructor(config: Config) {
		this._config = config;
		this.client = new Client();
		this._music = new Music(config, this);
		this._audioCommands = new AudioCommands(config, this);
		this._utilities = new Utilities(config, this);

		this.registerCommand("help", this.help, "Show available commands");

		this.client.on("warn", console.warn);
		this.client.on("error", console.error);
		this.client.on("ready", () => { console.log("Ready!"); });
		this.client.on("disconnect", () => { console.log("Disconnected"); });
		this.client.on("reconnecting", () => { console.log("Reconnecting"); });
		this.client.on("message", this.onmessage);

		this.client.login(this._config.TOKEN);
	}

	public registerCommand(name: string, action: (msg: Message, args: string[]) => void, help: string) {
		this._commands.set(name, { action, help });
	}

	private onmessage = async (msg: Message) => {
		if (msg.author.bot) { return; }
		if (!msg.content.startsWith(this._config.PREFIX)) { return; }

		const args = msg.content.split(" ");
		const cmd = args.shift().slice(this._config.PREFIX.length);
		if (msg.guild === undefined) {
			return msg.reply("You can't send commands by direct message. Use a channel on a server.");
		}
		if (this._commands.get(cmd) !== undefined) {
			try {
				this._commands.get(cmd).action(msg, args);
			} catch (exception) {
				console.error(`Missing permission to executing command : '${msg.content}'`)
			}
			if (this._config.DELETE_CALLING_MESSAGES) { msg.delete(); }
		}
	}

	private help = (msg: Message, args: string[]) => {
		const output = ["```"];
		let i = 0;
		this._commands.forEach((command, name) => {
			const line = this._config.PREFIX + name + ":" + " ".repeat(20 - name.length) + command.help + "\n";
			if(output.length + line.length > this.MAX_MESSAGE_LENGTH) {
				output[i] += "```";
				i++;
				output[i] = "```";
			}
			output[i] += line;
		});
		output[i] += "```";
		msg.channel.send(output);
	}

}
