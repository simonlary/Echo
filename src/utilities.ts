import * as fs from "fs";
import { Message, Permissions, MessageEmbed } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";

const GodClasses = ["Assassin", "Hunter", "Mage", "Warrior", "Guardian"] as const;
type GodClass = typeof GodClasses[number];

const GodDamages = ["Physical", "Magical"] as const;
type GodDamage = typeof GodDamages[number];

const GodRanges = ["Ranged", "Melee"] as const;
type GodRange = typeof GodRanges[number];

// https://raw.githubusercontent.com/MajorVengeance/smite-random-god/master/gods.json
interface IGod {
	id: number,
	name: string,
	class: GodClass,
	damage: GodDamage,
	range: GodRange,
	pantheon: string
}

export class Utilities {

	private _bot: Bot;
	private readonly _gods: IGod[] = [];

	constructor(config: Config, bot: Bot) {
		this._bot = bot;

		if (fs.existsSync("gods.json") === true)
			this._gods = JSON.parse(fs.readFileSync("gods.json", "utf8"));

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


	private gods = (msg: Message, args: string[]) => {
		let godCount = 5;
		let godClass: GodClass | null = null;

		// Parameter reading
		for (const arg of args) {
			if (GodClasses.map(g => g.toLowerCase()).includes(arg)) {
				godClass = arg as GodClass;
			} else {
				const parsed = parseInt(arg);
				if (!isNaN(parsed)) {
					godCount = Math.max(1, parsed);
				}
			}
		}

		// Select gods
		const filtered = this._gods.filter(g => godClass === null || g.class.toLowerCase() === godClass);
		const randomized = filtered.sort(() => .5 - Math.random());
		const selected = randomized.slice(0, Math.min(godCount, randomized.length));

		// Create message
		const embed = new MessageEmbed()
			.setTitle("Smite Gods")
			.setColor(0xEDC10E)
			.setDescription(selected.map((god, index) => `${index + 1}. ${god.name}`).join("\n"));
		msg.channel.send(embed);
	}
}
