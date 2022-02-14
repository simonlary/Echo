import { AutocompleteInteraction, Client, CommandInteraction, Intents, Interaction } from "discord.js";
import { AudioCommands } from "./audioCommands.js";
import { CommandName } from "./commands.js";
import { Config } from "./config.js";
import { Utilities } from "./utilities.js";

type ExecuteCommandCallback = (interaction: CommandInteraction) => Promise<void>;
type AutocompleteCallback = (interaction: AutocompleteInteraction) => Promise<void>;

export class Bot {

    private readonly commandCallbacks: Record<CommandName, { execute: ExecuteCommandCallback, autocomplete?: AutocompleteCallback }>;

    public static async create(config: Config) {
        console.log("Creating client...");
        const client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]
        });

        console.log("Creating utilities...");
        const utilities = await Utilities.create(client);

        console.log("Creating custom audio commands...");
        const audioCommands = await AudioCommands.create(client, config);

        console.log("Creating bot...");
        const bot = new Bot(config, client, utilities, audioCommands);

        console.log("Logging in...");
        await client.login(config.token);

        return bot;
    }

    private constructor(
        private readonly config: Config,
        private readonly client: Client,
        private readonly utilities: Utilities,
        private readonly audioCommands: AudioCommands
    ) {
        this.commandCallbacks = {
            audio: {
                execute: this.audioCommands.audio,
                autocomplete: this.audioCommands.autocompleteAudio,
            },
            gods: {
                execute: this.utilities.gods,
            },
            link: {
                execute: this.utilities.link,
            },
            moveto: {
                execute: this.utilities.moveto,
            },
        };

        this.client.on("ready", () => console.log("Ready!"));
        this.client.on("disconnect", () => { console.log("Disconnected"); });
        this.client.on("interactionCreate", this.onInteractionCreate);
    }

    public shutdown() {
        console.log("Shutting down...");
        this.client.destroy();
    }

    private onInteractionCreate = async (interaction: Interaction) => {
        if (interaction.isCommand()) {
            this.executeCommand(interaction);
            return;
        }

        if (interaction.isAutocomplete()) {
            this.autocompleteCommand(interaction);
            return;
        }

        console.warn(`Received an interaction that is not a supported : ${interaction.type}`);
    };

    private executeCommand = async (interaction: CommandInteraction) => {
        if (!this.isValidCommandName(interaction.commandName)) {
            console.warn(`Received an invalid command name to execute : ${interaction.commandName}`);
            return;
        }

        console.log(`User "${interaction.user.tag}" (${interaction.user.id}) executed command "${interaction.commandName}".`);

        try {
            await this.commandCallbacks[interaction.commandName].execute(interaction);
        } catch (e) {
            console.error(e);
            if (!interaction.replied) {
                interaction.reply({ content: "Sorry, there was an error executing you command.", ephemeral: true });
            }
        }
    };

    private autocompleteCommand = async (interaction: AutocompleteInteraction) => {
        if (!this.isValidCommandName(interaction.commandName)) {
            console.warn(`Received an invalid command name to autocomplete : ${interaction.commandName}`);
            return;
        }

        const command = this.commandCallbacks[interaction.commandName];

        if (command.autocomplete == null) {
            console.warn(`Received an autocomplete request for command "${interaction.commandName}" which does not implement autocompletion.`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (e) {
            console.error(e);
        }
    };

    private isValidCommandName(name: string): name is CommandName {
        return Object.keys(this.commandCallbacks).includes(name);
    }
}
