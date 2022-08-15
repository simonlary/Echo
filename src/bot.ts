import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
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
import { readdir } from "fs/promises";
import { parse, join } from "path";
import { Config } from "./config.js";
import { ClientWithSpeech, VoiceMessage, wrapClientWithSpeech } from "./speech.js";

interface AudioCommand {
  name: string;
  file: string;
}

interface ActiveGuild {
  voiceConnection: VoiceConnection;
  audioPlayer?: AudioPlayer;
  textChannel?: TextBasedChannel;
}

export class Bot {
  private static readonly SUPPORTED_EXTENSIONS = [".wav", ".mp3"];
  private static readonly SPEECH_RECOGNITION_GROUP = "SPEECH_RECOGNITION_GROUP";

  private readonly activeGuilds = new Map<string, ActiveGuild>();

  public static async create(config: Config) {
    console.log("Creating client...");
    const client = new Client({
      intents: ["Guilds", "GuildVoiceStates"],
    });

    console.log("Attaching speech listener...");
    const clientWithSpeech = wrapClientWithSpeech(client, { group: Bot.SPEECH_RECOGNITION_GROUP });

    console.log("Creating bot...");
    const bot = new Bot(config, clientWithSpeech);

    console.log("Logging in...");
    await clientWithSpeech.login(config.token);

    console.log("Registering all commands...");
    await bot.init();

    console.log("Bot started!");
    return bot;
  }

  private audioCommands: AudioCommand[] = [];

  private constructor(private readonly config: Config, private readonly client: ClientWithSpeech) {
    this.client.on("disconnect", () => {
      console.log("Disconnected");
    });
    this.client.on("interactionCreate", this.onInteractionCreate);
    this.client.on("speech", this.onSpeech);
  }

  private async init() {
    this.audioCommands = await this.getAllCommands(this.config.commandsFolder);

    if (!this.config.registerCommands) {
      console.log("Skipping registering commands!");
      return;
    }

    const baseAudioCommands = this.getBaseSlashCommands();
    const slashAudioCommands = this.audioCommands.map((c) => this.getSlashCommandForCommand(c));

    const applicationId = this.client.application?.id;
    if (applicationId == null) {
      throw new Error("Couldn't get the application id.");
    }

    const rest = new REST().setToken(this.config.token);

    const promises = this.config.guilds.map((guildId) =>
      rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
        body: [...baseAudioCommands, ...slashAudioCommands],
      })
    );
    await Promise.all(promises);
  }

  public shutdown() {
    console.log("Shutting down...");
    this.client.destroy();
  }

  private async getAllCommands(commandsFolder: string) {
    try {
      return (await readdir(commandsFolder))
        .map((f) => parse(f))
        .filter((f) => Bot.SUPPORTED_EXTENSIONS.includes(f.ext))
        .map((f) => ({ name: f.name, file: join(commandsFolder, f.base) }));
    } catch (e) {
      console.warn(`Commands folder could not be loaded : ${e}`);
      return [];
    }
  }

  private getSlashCommandForCommand(command: AudioCommand) {
    return new SlashCommandBuilder().setName(command.name).setDescription(`Play the "${command.name}" audio.`).toJSON();
  }

  private getBaseSlashCommands() {
    return [
      new SlashCommandBuilder()
        .setName("join")
        .setDescription("Make the bot join the voice channel and and start to listen for triggering keywords."),
      new SlashCommandBuilder().setName("leave").setDescription("Make the bot leave the voice channel."),
    ];
  }

  private onInteractionCreate = async (interaction: Interaction) => {
    if (!interaction.isCommand()) {
      console.warn(`Received an interaction that is not a command : ${interaction.type}`);
      return;
    }

    console.log(
      `User "${interaction.user.tag}" (${interaction.user.id}) executed command "${interaction.commandName}".`
    );

    try {
      if (interaction.commandName === "join") {
        this.executeJoin(interaction);
      } else if (interaction.commandName === "leave") {
        this.executeLeave(interaction);
      } else {
        const audioCommand = this.audioCommands.find((c) => c.name === interaction.commandName);
        if (audioCommand == null) {
          throw new Error(`Received an invalid command name to execute : ${interaction.commandName}`);
        }
        await this.executeAudioCommand(audioCommand, interaction);
      }
    } catch (e) {
      console.error(e);
      if (interaction.replied) {
        await interaction.followUp({ content: "Sorry, there was an error executing you command.", ephemeral: true });
      } else {
        await interaction.reply({ content: "Sorry, there was an error executing you command.", ephemeral: true });
      }
    }
  };

  private onSpeech = async (message: VoiceMessage) => {
    if (message.content == null) {
      return; // No text was recognized.
    }

    const words = message.content
      .replace(/['!"#$%&\\'()*+,\-./:;<=>?@[\\\]^_`{|}~']/g, " ")
      .split(" ")
      .map((w) => w.toLowerCase());
    const command = this.audioCommands.find((c) => words.includes(c.name.toLowerCase()));

    if (command == null) {
      return; // No audio command trigger word was said.
    }

    const activeGuild = this.activeGuilds.get(message.channel.guild.id);

    if (activeGuild == null) {
      console.error("activeGuild was null/undefined");
      return;
    }

    if (activeGuild.audioPlayer != null) {
      return; // Something is already playing. Just ignore the trigger word.
    }

    console.log(`Found audio command "${command.name}" in text : "${message.content}"`);
    await activeGuild.textChannel?.send(`${message.author} just said : *${command.name}*`);

    const audioResource = createAudioResource(command.file);
    const audioPlayer = createAudioPlayer();
    activeGuild.audioPlayer = audioPlayer;

    await entersState(activeGuild.voiceConnection, VoiceConnectionStatus.Ready, 5_000);

    activeGuild.voiceConnection.subscribe(audioPlayer);
    audioPlayer.play(audioResource);

    await entersState(audioPlayer, AudioPlayerStatus.Idle, 30_000);

    activeGuild.audioPlayer.stop();
    activeGuild.audioPlayer = undefined;
  };

  private executeJoin = async (interaction: CommandInteraction) => {
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

    const textChannel = member.voice.channel.isTextBased() ? member.voice.channel : interaction.channel ?? undefined;

    const voiceConnection = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId: interaction.guild.id,
      group: Bot.SPEECH_RECOGNITION_GROUP,
      selfDeaf: false,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    this.activeGuilds.set(interaction.guild.id, { voiceConnection, textChannel });

    await interaction.reply({ content: `Joined channel: ${member.voice.channel}`, ephemeral: true });
  };

  private executeLeave = async (interaction: CommandInteraction) => {
    if (interaction.guild == null) {
      await interaction.reply({ content: "You need to be in a server to use commands.", ephemeral: true });
      return;
    }

    const activeGuild = this.activeGuilds.get(interaction.guild.id);
    if (activeGuild == null) {
      await interaction.reply({ content: "I am not in any voice channel!", ephemeral: true });
      return;
    }

    activeGuild.audioPlayer?.stop();
    activeGuild.voiceConnection.destroy();
    this.activeGuilds.delete(interaction.guild.id);

    await interaction.reply({ content: "Left the channel!", ephemeral: true });
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
