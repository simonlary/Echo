import "dotenv/config";

export class Config {
  private readonly _token: string;
  private readonly _registerCommands: boolean;
  private readonly _guilds: string[];
  private readonly _commandsFolder: string;

  public constructor() {
    const token = process.env.TOKEN;
    if (token == null) throw new Error("No token provided");
    this._token = token;
    this._registerCommands = process.env.REGISTER_COMMANDS === "false" ? false : true;
    this._guilds = process.env.GUILDS?.split(",") ?? [];
    this._commandsFolder = process.env.COMMANDS_FOLDER ?? "audioCommands";
  }

  public get token(): string {
    return this._token;
  }

  public get registerCommands(): boolean {
    return this._registerCommands;
  }

  public get guilds(): string[] {
    return this._guilds;
  }

  public get commandsFolder(): string {
    return this._commandsFolder;
  }
}
