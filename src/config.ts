import * as fs from "fs";

interface IConfigFile {
	token: string;
	deleteCallingMessages: boolean;
	audioCommands: IAudioCommand[];
	prefix: string;
}

interface IAudioCommand {
	command: string;
	folder: string;
	help?: string;
}

export class Config {

	private _audioCommands: IAudioCommand[];
	private _deleteCallingMessages: boolean;
	private _prefix: string;
	private _token: string;

	constructor() {
		if (fs.existsSync("bot.config") === false) {
			throw new Error("No config found. Please create a 'bot.config' file.");
		}
		const configFile: IConfigFile = JSON.parse(fs.readFileSync("bot.config", "utf8"));

		this._audioCommands = (Array.isArray(configFile.audioCommands)) ? configFile.audioCommands : [];
		this._deleteCallingMessages = configFile.deleteCallingMessages || false;
		this._prefix = configFile.prefix || "";
		this._token = configFile.token;
	}

	public get AUDIO_COMMANDS(): IAudioCommand[] {
		return this._audioCommands;
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

}
