import { Message } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";
import * as lorembarnak from "lorembarnak";

const NUMBER_OF_SWEARS = 10;

export class TTS {
	constructor(config: Config, bot: Bot) {
		bot.registerCommand("lorembarnak", this.lorembarnak, "Highlight the rich cultural landscape of Québécois swears by providing random chains of obscenities.");
		bot.registerCommand("lorembarnaktts", this.lorembarnaktts, "Highlight the rich cultural landscape of Québécois swears by providing random chains of obscenities told right in your ears.");
	}

	private lorembarnak = async (msg: Message) => {
		msg.channel.send(lorembarnak.getText(NUMBER_OF_SWEARS));
	};

	private lorembarnaktts = async (msg: Message) => {
		msg.channel.send(lorembarnak.getText(NUMBER_OF_SWEARS), { tts: true });
	};
}
