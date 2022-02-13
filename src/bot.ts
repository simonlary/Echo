import { Client, CommandInteraction, Intents, Interaction } from "discord.js";
import { CommandName } from "./commands.js";
import { Config } from "./config.js";
import { Utilities } from "./utilities.js";

type ExecuteCommandCallback = (interaction: CommandInteraction) => Promise<void>;

export class Bot {

    private readonly utilities;

    private readonly commandCallbacks: Record<CommandName, ExecuteCommandCallback>;

    public static async create(config: Config): Promise<Bot> {
        const client = new Client({
            intents: [Intents.FLAGS.GUILDS]
        });
        await client.login(config.token);
        return new Bot(config, client);
    }

    private constructor(private readonly config: Config, private readonly client: Client) {
        this.utilities = new Utilities(client);

        this.commandCallbacks = {
            link: this.utilities.link,
            moveto: this.utilities.moveto
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
