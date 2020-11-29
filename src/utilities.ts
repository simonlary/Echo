import { Message, Permissions, MessageEmbed } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";

export class Utilities {

	private _bot: Bot;

	constructor(config: Config, bot: Bot) {
		this._bot = bot;
		bot.registerCommand("link", this.link, "Get the link to add the bot to your server");
		bot.registerCommand("code", this.code, "Format code");
		bot.registerCommand("gods", this.gods, "Get a list of n random Smite gods.")
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
		const destination = msg.guild!.channels.cache.find((channel) => channel.type === "voice" && channel.name === args.join(" "));
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

	
	private gods(msg: Message, args: string[]) {
		const GOD_LIST = ["Achilles", "Amaterasu", "Ao Kuang", "Arachne", "Ares", "Artio", "Athena", "Awilix", "Bacchus", "Bakasura", "Bastet", "Bellona", "Cabrakan", "Camazotz", "Cerberus", "Chaac", "Cu Chulainn", "Da Ji", "Erlang Shen", "Fafnir", "Fenrir", "Freya", "Ganesha", "Geb", "Guan Yu", "Hercules", "Horus", "Hun Batz", "Kali", "Khepri", "King Arthur", "Kumbhakarna", "Kuzenbo", "Loki", "Mercury", "Mulan", "Ne Zha", "Nemesis", "Nike", "Odin", "Osiris", "Pele", "Ratatoskr", "Ravana", "Serqet", "Set", "Sobek", "Sun Wukong", "Susano", "Terra", "Thanatos", "Thor", "Tyr", "Vamana", "Xing Tian", "Ymir", "Agni", "Ah Muzen Cab", "Ah Puch", "Anhur", "Anubis", "Aphrodite", "Apollo", "Artemis", "Baba Yaga", "Baron Samedi", "Cernunnos", "Chang'e", "Chernobog", "Chiron", "Chronos", "Cupid", "Discordia", "Hachiman", "Hades", "He Bo", "Heimdallr", "Hel", "Hera", "Hou Yi", "Isis", "Izanami", "Janus", "Jing Wei", "Jormungandr", "Kukulkan", "Medusa", "Merlin", "Neith", "Nox", "Nu Wa", "Olorun", "Persephone", "Poseidon", "Ra", "Raijin", "Rama", "Scylla", "Skadi", "Sol", "Sylvanus", "The Morrigan", "Thoth", "Ullr", "Vulcan", "Xbalanque", "Yemoja", "Zeus", "Zhong Kui", "Tsukuyomi"];
		let godCount = 5;
		if (args.length > 0) {
			const parsed = parseInt(args[0]);
			if (!isNaN(parsed)) {
				godCount = Math.min(Math.max(parsed, 1), 10);
			}
		}

		msg.channel.send(GOD_LIST.sort(() => .5 - Math.random()).slice(0, godCount).join("\n"));
	}
}
