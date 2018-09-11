import { Message } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";

export class Utilities {

	private _bot: Bot;

	constructor(config: Config, bot: Bot) {
		this._bot = bot;
		bot.registerCommand("link", this.link, "Get the link to add the bot to your server");
		bot.registerCommand("code", this.code, "Format code");
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

}
