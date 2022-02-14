import { readFile } from "fs/promises";

interface ConfigFile {
	token: string;
	audioCommandsFolder?: string;
	guildCommandsGuildIds?: string[];
}

export class Config {

	private static readonly DEFAULT_CONFIG = {
		audioCommandsFolder: "audioCommands",
		guildCommandsGuildIds: [],
	};

	private readonly config: Required<ConfigFile>;

	public static async load(): Promise<Config> {
		const rawContent = await readFile("bot.config", "utf8");
		const parsedContent = JSON.parse(rawContent);
		if (!this.isConfigFile(parsedContent)) {
			throw new Error("Invalid configuration file format.");
		}
		return new Config(parsedContent);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static isConfigFile(obj: any): obj is ConfigFile {
		return (
			obj != null &&
			typeof obj === "object" &&
			"token" in obj &&
			typeof obj.token === "string"
		);
	}

	constructor(configFile: ConfigFile) {
		this.config = {
			...Config.DEFAULT_CONFIG,
			...configFile
		};
	}

	public get audioCommandsFolder(): string {
		return this.config.audioCommandsFolder;
	}

	public get token(): string {
		return this.config.token;
	}

	public get guildCommandsGuildIds(): string[] {
		return this.config.guildCommandsGuildIds;
	}

}
