import { Bot } from "./bot";
import { Config } from "./config";

let config;
try {
	config = new Config();
} catch (error) {
	console.error(`Error while loading configuration file : "${error}"`);
	process.exit();
}

let bot;
try {
	if(config == null)
		throw new Error("No config was loaded.");
	bot = new Bot(config);
} catch (error) {
	console.error(`Error while initializing the bot : "${error}"`);
	process.exit();
}
