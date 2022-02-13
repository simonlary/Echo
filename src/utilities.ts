import { Client, CommandInteraction, MessageEmbed } from "discord.js";
import { Gods } from "./gods.js";

export class Utilities {

    public static async create(client: Client) {
        const gods = await Gods.load();
        return new Utilities(client, gods);
    }

    private constructor(private readonly client: Client, private readonly allGods: Gods) { }

    public link = async (interaction: CommandInteraction) => {
        const link = this.client.generateInvite({ scopes: ["applications.commands"] });
        await interaction.reply(`You can invite me to your server by going to this link!\n ${link}`);
    };

    public moveto = async (interaction: CommandInteraction) => {
        if (interaction.guild == null) {
            interaction.reply("You need to be in a server to use commands.");
            return;
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);
        const destination = interaction.options.getChannel("channel");
        if (member == null) {
            console.error(`"member" is null for user "${interaction.user.tag} (${interaction.user.id})".`);
            interaction.reply("Sorry, there was an error moving your channel.");
            return;
        }
        if (member.voice.channel == null) {
            interaction.reply("You are not currently in any voice channel!");
            return;
        }
        if (destination?.type !== "GUILD_VOICE") {
            console.error(`Destination channel (${destination?.type}) is not a voice channel!`);
            interaction.reply("Sorry, there was an error moving your channel.");
            return;
        }

        const promises = [...member.voice.channel.members.values()].map(toMove => toMove.voice.setChannel(destination));
        await Promise.allSettled(promises);
        interaction.reply(`Moved everyone to the channel ${destination.name}`);
    };

    public gods = async (interaction: CommandInteraction) => {
        const options = {
            number: interaction.options.getInteger("number", true),
            class: interaction.options.getString("class"),
            damage: interaction.options.getString("damage"),
            range: interaction.options.getString("range"),
            pantheon: interaction.options.getString("pantheon"),
        };

        let filtered = this.allGods;
        if (options.class != null) {
            filtered = filtered.withClass(options.class);
        }
        if (options.damage != null) {
            filtered = filtered.withDamage(options.damage);
        }
        if (options.range != null) {
            filtered = filtered.withRange(options.range);
        }
        if (options.pantheon != null) {
            filtered = filtered.withPantheon(options.pantheon);
        }

        const result = filtered.getRandom(options.number);

        const embed = new MessageEmbed()
            .setTitle("Smite Gods")
            .setColor(0xEDC10E)
            .setDescription(result.map((god, index) => `${index + 1}. ${god}`).join("\n"));


        interaction.reply({ embeds: [embed] });
    };
}
