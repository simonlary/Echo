import * as fs from "fs";

interface IConfigFile {
	token: string;
	deleteCallingMessages: boolean;
	audioCommandsFolder: string;
	prefix: string;
	noAudioCommandGuilds: string
}

interface IAudioCommand {
	command: string;
	folder: string;
	help?: string;
}

export class Config {

	private _audioCommandsFolder: string;
	private _deleteCallingMessages: boolean;
	private _prefix: string;
	private _token: string;
	private _noAudioCommandGuilds: string[];

	constructor() {
		if (fs.existsSync("bot.config") === false) {
			throw new Error("No config found. Please create a 'bot.config' file.");
		}
		const configFile: IConfigFile = JSON.parse(fs.readFileSync("bot.config", "utf8"));

		this._audioCommandsFolder = configFile.audioCommandsFolder || "";
		this._deleteCallingMessages = configFile.deleteCallingMessages || false;
		this._prefix = configFile.prefix || "";
		this._token = configFile.token;
		this._noAudioCommandGuilds = (configFile.noAudioCommandGuilds != null) ? configFile.noAudioCommandGuilds.split(",") : [];
	}

	public get AUDIO_COMMANDS_FOLDER(): string {
		return this._audioCommandsFolder;
	}

	public get DELETE_CALLING_MESSAGES(): boolean {
		return this._deleteCallingMessages;
	}

	public get PREFIX(): string {
		return this._prefix;
	}

	public get TOKEN(): string {
		return this._token;
	}

	public get NO_AUDIO_COMMAND_GUILDS(): string[] {
		return this._noAudioCommandGuilds;
	}

}
