import { Message, Permissions, MessageEmbed } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";

export class Utilities {

	private _bot: Bot;

	constructor(config: Config, bot: Bot) {
		this._bot = bot;
		bot.registerCommand("link", this.link, "Get the link to add the bot to your server");
		bot.registerCommand("code", this.code, "Format code");
		bot.registerCommand("moveTo", this.moveTo, "Move all the people in your voice channel to another voice channel");
		bot.registerCommand("screenshare", this.screenshare, "Show the link to screenshare in your current voice channel");
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

	private moveTo(msg: Message, args: string[]) {
		if (msg.member != null && !msg.member.hasPermission("MOVE_MEMBERS")) {
			return msg.channel.send(`You do not have the *MOVE_MEMBERS* permission.`);
		}
		if (msg.guild != null && msg.guild.me != null && !msg.guild.me.hasPermission("MOVE_MEMBERS")) {
			return msg.channel.send(`Sorry, I do not have the *MOVE_MEMBERS* permission. :cry:`);
		}
		if (msg.member != null && msg.member.voice.channel == null) {
			return msg.channel.send(`You need to be in a voice channel to do that!`);
		}

		// Find destination voice channel
		const destination = msg.guild!.channels.find((channel) => channel.type === "voice" && channel.name === args.join(" "));
		if (destination == null) {
			return msg.channel.send(`The ${args.join(" ")} voice channel does not exist on this server.`);
		}

		// Move everyone
		msg.member!.voice.channel!.members.forEach((member) => {
			member.voice.setChannel(destination);
		});
	}

	private screenshare(msg: Message, args: string[]) {
		if (msg.guild == null || msg.member == null || msg.member.voice == null || msg.member.voice.channel == null) {
			return msg.channel.send(`Error creating the sharing link.`);
		}

		const embed = new MessageEmbed()
			.setDescription(`[**Screenshare URL** : ${msg.member.voice.channel.name}](https://discordapp.com/channels/${msg.guild.id}/${msg.member.voice.channel.id})`)
			.setColor(0x0CA8EE);

		msg.channel.send(embed);
	}
}
