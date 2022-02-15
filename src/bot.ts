import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";
import { AutocompleteInteraction, Client, CommandInteraction, Intents, Interaction } from "discord.js";
import { readdir } from "fs/promises";
import { parse, join } from "path";
import { Config } from "./config.js";

interface Command {
    name: string;
    file: string;
}

export class Bot {

    private static readonly SUPPORTED_EXTENSIONS = [".wav", ".mp3"];

    public static async create(config: Config) {
        console.log("Creating client...");
        const client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]
        });

        console.log("Creating bot...");
        const bot = new Bot(config, client);

        console.log("Logging in...");
        await client.login(config.token);

        console.log("Loading all commands...");
        await bot.init();

        console.log("Commands loaded!");
        return bot;
    }

    private commands: Command[] = [];

    private constructor(
        private readonly config: Config,
        private readonly client: Client
    ) {
        this.client.on("ready", () => console.log("Ready!"));
        this.client.on("disconnect", () => { console.log("Disconnected"); });
        this.client.on("interactionCreate", this.onInteractionCreate);
    }

    private async init() {
        this.commands = await this.getAllCommands(this.config.commandsFolder);
        const slashCommands = this.commands.map(c => this.getSlashCommandForCommand(c));

        const applicationId = this.client.application?.id;
        if (applicationId == null) {
            throw new Error("Couldn't get the application id.");
        }

        const rest = new REST({ version: "9" }).setToken(this.config.token);

        const promises = this.config.guilds.map(guildId => rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: slashCommands }));
        await Promise.all(promises);
    }

    public shutdown() {
        console.log("Shutting down...");
        this.client.destroy();
    }

    private async getAllCommands(commandsFolder: string) {
        try {
            return (await readdir(commandsFolder))
                .map(f => parse(f))
                .filter(f => Bot.SUPPORTED_EXTENSIONS.includes(f.ext))
                .map(f => ({ name: f.name, file: join(commandsFolder, f.base) }));
        } catch (e) {
            console.warn(`Commands folder could not be loaded : ${e}`);
            return [];
        }
    }

    private getSlashCommandForCommand(command: Command) {
        return new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(`Play the "${command.name}" audio.`)
            .toJSON();
    }

    private onInteractionCreate = async (interaction: Interaction) => {
        if (!interaction.isCommand()) {
            console.warn(`Received an interaction that is not a command : ${interaction.type}`);
            return;
        }

        const command = this.commands.find(c => c.name === interaction.commandName);
        if (command == null) {
            console.warn(`Received an invalid command name to execute : ${interaction.commandName}`);
            return;
        }

        console.log(`User "${interaction.user.tag}" (${interaction.user.id}) executed command "${command.name}".`);

        interaction.reply({ content: "Not implemented.", ephemeral: true });
        // try {
        //     await this.commandCallbacks[interaction.commandName].execute(interaction);
        // } catch (e) {
        //     console.error(e);
        //     if (!interaction.replied) {
        //         interaction.reply({ content: "Sorry, there was an error executing you command.", ephemeral: true });
        //     }
        // }
    };
}
