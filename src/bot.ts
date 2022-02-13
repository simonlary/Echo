import { Client, CommandInteraction, Intents, Interaction } from "discord.js";
import { CommandName } from "./commands.js";
import { Config } from "./config.js";
import { Utilities } from "./utilities.js";

type ExecuteCommandCallback = (interaction: CommandInteraction) => Promise<void>;

export class Bot {

    private readonly commandCallbacks: Record<CommandName, ExecuteCommandCallback>;

    public static async create(config: Config) {
        console.log("Creating client...");
        const client = new Client({
            intents: [Intents.FLAGS.GUILDS]
        });

        console.log("Creating utilities...");
        const utilities = await Utilities.create(client);

        console.log("Creating bot...");
        const bot = new Bot(config, client, utilities);

        console.log("Logging in...");
        await client.login(config.token);

        return bot;
    }

    private constructor(
        private readonly config: Config,
        private readonly client: Client,
        private readonly utilities: Utilities
    ) {
        this.commandCallbacks = {
            link: this.utilities.link,
            moveto: this.utilities.moveto,
            gods: this.utilities.gods
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
        if (!interaction.isCommand()) {
            console.warn(`Received an interaction that is not a command : ${interaction.type}`);
            return;
        }

        if (!this.isValidCommandName(interaction.commandName)) {
            console.warn(`Received an invalid command name : ${interaction.commandName}`);
            return;
        }

        console.log(`User "${interaction.user.tag}" (${interaction.user.id}) executed command "${interaction.commandName}".`);

        try {
            await this.commandCallbacks[interaction.commandName](interaction);
        } catch (e) {
            console.error(e);
            if (!interaction.replied) {
                interaction.reply({ content: "Sorry, there was an error executing you command.", ephemeral: true });
            }
        }
    };

    private isValidCommandName(name: string): name is CommandName {
        return Object.keys(this.commandCallbacks).includes(name);
    }
}
