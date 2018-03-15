import { Message } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";

export class Utilities {

	private _bot: Bot;

	constructor(config: Config, bot: Bot) {
		this._bot = bot;
		bot.registerCommand("link", this.link);
		bot.registerCommand("code", this.code);
		bot.registerCommand("help", this.help);
	}

	private link = async (msg: Message, args: string[]) => {
		const link = await this._bot.client.generateInvite();
		msg.channel.send(`You can invite me to your server by going to this link!\n <${link}>`);
	}

	private code(msg: Message, args: string[]) {
		let code = "```" + args[0] + "\n";
		args.splice(0, 1);
		code += args.join(" ") + "\n" + "```";

		msg.channel.send(code);
	}

	private help(msg: Message, args: string[]) {
		msg.channel.send("```code:            Format code\n"
			+ "help:            Show available commands\n"
			+ "link:            Get the link to add the bot to your server\n"
			+ "np:              Get the name of the currently playing song\n"
			+ "pause:           Pause the music's playback\n"
			+ "play:            Adds a video/song to the queue\n"
			+ "queue:           Get a list of the currently queued songs\n"
			+ "resume:          Resume the music's playback if it was paused\n"
			+ "skip:            Skip the currently playing song\n"
			+ "stop:            Stops the music playback\n"
			+ "volume:          Set the volume between 1-100```");
	}

}
