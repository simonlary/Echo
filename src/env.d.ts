declare namespace NodeJS {
  interface ProcessEnv {
    TOKEN: string | undefined;
    GUILDS: string | undefined;
    COMMANDS_FOLDER: string | undefined;
  }
}
