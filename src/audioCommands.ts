import { AutocompleteInteraction, Client, CommandInteraction, MessageEmbed } from "discord.js";
import { readdir } from "fs/promises";
import { parse, join } from "path";
import { Config } from "./config.js";

interface Command {
    name: string;
    file: string;
}

export class AudioCommands {

    private static readonly SUPPORTED_EXTENSIONS = [".wav", ".mp3"];

    public static async create(client: Client, config: Config) {
        const commands = await this.getAllCommands(config.audioCommandsFolder);
        return new AudioCommands(commands);
    }

    private static async getAllCommands(audioCommandsFolder: string) {
        try {
            return (await readdir(audioCommandsFolder))
                .map(f => parse(f))
                .filter(f => AudioCommands.SUPPORTED_EXTENSIONS.includes(f.ext))
                .map(f => ({ name: f.name, file: join(audioCommandsFolder, f.base) }));
        } catch (e) {
            console.warn(`Custom audio commands folder could not be loaded : ${e}`);
            return [];
        }
    }

    private constructor(private readonly commands: Command[]) { }

    public audio = async (interaction: CommandInteraction) => {
        const commandOption = interaction.options.getString("command");
        if (commandOption == null) {
            const embed = new MessageEmbed()
                .setTitle("Custom Audio Commands")
                .setColor(0x0E9FED)
                .setDescription(this.commands.map(c => c.name).join(", "));
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const command = this.commands.find(c => c.name === commandOption);
        if (command == null) {
            await interaction.reply({ content: `The command "${commandOption}" doesn't exist.`, ephemeral: true });
            return;
        }

        // TODO
        await interaction.reply(`You tried to play the custom command "${command.name}" (${command.file})`);
    };

    public autocompleteAudio = async (interaction: AutocompleteInteraction) => {
        await interaction.respond(
            this.commands
                .filter(c => c.name.startsWith(interaction.options.getString("command") ?? ""))
                .slice(0, 25)
                .map(c => ({ name: c.name, value: c.name }))
        );
    };
}
