import { Client, CommandInteraction } from "discord.js";

export class Utilities {

    public constructor(private readonly client: Client) { }

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
}
