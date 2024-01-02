import { AudioCommand, Config } from "./config.js";
import {
    AudioPlayer,
    AudioPlayerStatus,
    VoiceConnection,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
} from "@discordjs/voice";
import {
    Client,
    CommandInteraction,
    Interaction,
    REST,
    Routes,
    SlashCommandBuilder,
    TextBasedChannel,
} from "discord.js";

interface ActiveGuild {
    voiceConnection: VoiceConnection;
    audioPlayer?: AudioPlayer;
    textChannel?: TextBasedChannel;
}

export class Bot {
    private readonly activeGuilds = new Map<string, ActiveGuild>();

    public static async create(config: Config) {
        console.log("Creating client...");
        const client = new Client({
            intents: ["Guilds", "GuildVoiceStates"],
        });

        console.log("Creating bot...");
        const bot = new Bot(config, client);

        console.log("Logging in...");
        await client.login(config.token);

        if (config.registerCommands) {
            console.log("Registering all commands...");
            await bot.registerCommands();
        }

        console.log("Bot started!");
        return bot;
    }

    private constructor(
        private readonly config: Config,
        private readonly client: Client,
    ) {
        this.client.on("disconnect", () => {
            console.log("Disconnected");
        });
        this.client.on("interactionCreate", this.onInteractionCreate);
    }

    private async registerCommands() {
        const slashAudioCommands = this.config.audioCommands.map((c) =>
            new SlashCommandBuilder().setName(c.name).setDescription(`Play the "${c.name}" audio.`).toJSON(),
        );

        const applicationId = this.client.application?.id;
        if (applicationId == null) {
            throw new Error("Couldn't get the application id.");
        }

        const rest = new REST().setToken(this.config.token);

        const promises = this.config.guilds.map((guildId) =>
            rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
                body: slashAudioCommands,
            }),
        );
        await Promise.all(promises);
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

        console.log(
            `User "${interaction.user.tag}" (${interaction.user.id}) executed command "${interaction.commandName}".`,
        );

        try {
            const audioCommand = this.config.audioCommands.find((c) => c.name === interaction.commandName);
            if (audioCommand == null) {
                throw new Error(`Received an invalid command name to execute : ${interaction.commandName}`);
            }
            await this.executeAudioCommand(audioCommand, interaction);
        } catch (e) {
            console.error(e);
            if (interaction.replied) {
                await interaction.followUp({
                    content: "Sorry, there was an error executing you command.",
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "Sorry, there was an error executing you command.",
                    ephemeral: true,
                });
            }
        }
    };

    private executeAudioCommand = async (command: AudioCommand, interaction: CommandInteraction) => {
        if (interaction.guild == null) {
            await interaction.reply({ content: "You need to be in a server to use commands.", ephemeral: true });
            return;
        }

        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (member == null) {
            console.error(`"member" is null for user "${interaction.user.tag} (${interaction.user.id})".`);
            await interaction.reply({ content: "Sorry, there was an error executing you command.", ephemeral: true });
            return;
        }

        if (member.voice.channel == null) {
            await interaction.reply({ content: "You are not currently in any voice channel!", ephemeral: true });
            return;
        }

        if (this.activeGuilds.has(interaction.guild.id)) {
            await interaction.reply({ content: "I am already in use!", ephemeral: true });
            return;
        }

        const voiceConnection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const audioResource = createAudioResource(command.file);
        const audioPlayer = createAudioPlayer();
        this.activeGuilds.set(interaction.guild.id, { voiceConnection, audioPlayer });

        await entersState(voiceConnection, VoiceConnectionStatus.Ready, 5_000);

        voiceConnection.subscribe(audioPlayer);
        audioPlayer.play(audioResource);

        await interaction.reply({ content: `Playing "${command.name}"...`, ephemeral: true });

        await entersState(audioPlayer, AudioPlayerStatus.Idle, 30_000);

        audioPlayer.stop();
        voiceConnection.destroy();

        this.activeGuilds.delete(interaction.guild.id);
    };
}
