import { Client, CommandInteraction, Intents, Interaction } from "discord.js";
import { Config } from "./config.js";
import { Utilities } from "./utilities.js";

export class Bot {

    private readonly utilities;

    private constructor(private readonly config: Config, private readonly client: Client) {
        this.utilities = new Utilities(client);

        this.client.on("ready", () => console.log("Ready!"));
        this.client.on("disconnect", () => { console.log("Disconnected"); });
        this.client.on("interactionCreate", this.onInteractionCreate);
    }

    public static async create(config: Config): Promise<Bot> {
        const client = new Client({
            intents: [Intents.FLAGS.GUILDS]
        });
        await client.login(config.token);
        return new Bot(config, client);
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

        try {
            await this.executeCommand(interaction);
        } catch (e) {
            console.error(e);
            interaction.reply({ content: "Sorry, there was an error executing you command.", ephemeral: true });
        }
    };

    private async executeCommand(interaction: CommandInteraction) {
        switch (interaction.commandName) {
            case "link":
                await this.utilities.link(interaction);
                break;
            case "moveto":
                await this.utilities.moveto(interaction);
                break;
            default:
                throw new Error(`Received an invalid command : ${interaction.commandName}`);
        }
    }
}