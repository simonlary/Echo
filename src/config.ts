import "dotenv/config";
import { readdir } from "fs/promises";
import { parse, join } from "path";

export interface AudioCommand {
  name: string;
  file: string;
}

const SUPPORTED_AUDIO_COMMANDS_EXTENSIONS = [".wav", ".mp3"];

export class Config {
  public static async create() {
    const token = process.env.TOKEN;
    if (token == null) throw new Error("No token provided");

    const registerCommands = process.env.REGISTER_COMMANDS === "false" ? false : true;

    const guilds = process.env.GUILDS?.split(",") ?? [];

    const commandsFolder = process.env.COMMANDS_FOLDER ?? "audioCommands";
    const audioCommands = await Config.getAudioCommandsFromFolder(commandsFolder);

    return new Config(token, registerCommands, guilds, audioCommands);
  }

  private static async getAudioCommandsFromFolder(folder: string) {
    try {
      return (await readdir(folder))
        .map((f) => parse(f))
        .filter((f) => SUPPORTED_AUDIO_COMMANDS_EXTENSIONS.includes(f.ext))
        .map((f) => ({ name: f.name, file: join(folder, f.base) }));
    } catch (e) {
      console.warn(`Commands folder could not be loaded : ${e}`);
      return [];
    }
  }

  private constructor(
    private readonly _token: string,
    private readonly _registerCommands: boolean,
    private readonly _guilds: string[],
    private readonly _audioCommands: AudioCommand[]
  ) {}

  public get token(): string {
    return this._token;
  }

  public get registerCommands(): boolean {
    return this._registerCommands;
  }

  public get guilds(): string[] {
    return this._guilds;
  }

  public get audioCommands(): AudioCommand[] {
    return this._audioCommands;
  }
}
