import "dotenv/config";

export class Config {
  private readonly _token: string;
  private readonly _witAiToken?: string;
  private readonly _guilds: string[];
  private readonly _commandsFolder: string;

  public constructor() {
    const token = process.env.TOKEN;
    if (token == null) throw new Error("No token provided");
    this._token = token;
    this._witAiToken = process.env.WIT_AI_TOKEN;
    this._guilds = process.env.GUILDS?.split(",") ?? [];
    this._commandsFolder = process.env.COMMANDS_FOLDER ?? "audioCommands";
  }

  public get token(): string {
    return this._token;
  }

  public get witAiToken(): string | undefined {
    return this._witAiToken;
  }

  public get guilds(): string[] {
    return this._guilds;
  }

  public get commandsFolder(): string {
    return this._commandsFolder;
  }
}
