import { Client, CommandInteraction } from "discord.js";

export class Utilities {

    public constructor(private readonly client: Client) { }

    public async link(interaction: CommandInteraction) {
        const link = this.client.generateInvite({ scopes: ["applications.commands"] });
        await interaction.reply(`You can invite me to your server by going to this link!\n ${link}`);
    }

    public async moveto(interaction: CommandInteraction) {
        if (interaction.guild == null) {
            interaction.reply("You need to be in a server to use commands.");
            return;
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);
        const destination = interaction.options.getChannel("channel");
        if (member == null) {
            interaction.reply("???????????????");
            return;
        }
        if (member.voice.channel == null) {
            interaction.reply("???????????????");
            return;
        }
        if (destination?.type !== "GUILD_VOICE") {
            interaction.reply("???????????????");
            return;
        }

        const promises = [...member.voice.channel.members.values()].map(toMove => toMove.voice.setChannel(destination));
        await Promise.allSettled(promises);
        interaction.reply(`Moved everyone to the channel ${destination.name}`);

    }
}