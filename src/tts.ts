import { Message, MessageEmbed } from "discord.js";
import { Bot } from "./bot";
import { Config } from "./config";
import * as http from "http";
import * as lorembarnak from "lorembarnak";

const MAX_TTS_LENGTH = 100;
const TTS_LANG = "en";
const NUMBER_OF_SWEARS = 10;

export class TTS {
    constructor(config: Config, bot: Bot) {
        bot.registerCommand("tts", this.tts, "Text to speech, easy.");
        bot.registerCommand("lorembarnak", this.lorembarnak, "Tabarnak");
        bot.registerCommand("lorembarnaktts", this.lorembarnaktts, "Tabarnak osti");
    }

    private tts = async (msg: Message, args: string[]) => {
        // Voice channel checks
        const voiceChannel = msg.member!.voice.channel;
        if (!voiceChannel)
            return msg.channel.send("You need to be in a voice channel to play audios!");
        const permissions = voiceChannel.permissionsFor(msg.client.user!);
        if (permissions != null && !permissions.has("CONNECT"))
            return msg.channel.send("I cannot connect to your voice channel, make sure I have the proper permissions!.");
        if (permissions != null && !permissions.has("SPEAK"))
            return msg.channel.send("I cannot speak in this voice channel, make sure I have the proper permissions!.");
        if (msg.guild != null && msg.guild.voice != null && msg.guild.voice.connection)
            return msg.channel.send("I am already in use in a voice channel!");

        // Message length check
        const message = args.join(" ");
        if (message.length > MAX_TTS_LENGTH)
            return msg.channel.send("This message is too long for TTS.");

        try {
            await voiceChannel.join();
            const url = this.createUrl(message, TTS_LANG);
            http.get(url, res => {
                msg.guild!.voice!.connection!.play(res)
                    .on("finish", () => {
                        msg.guild!.me!.voice.channel!.leave();
                    })
                    .on("error", (error) => {
                        console.error(`Error playing tts : ${error}`);
                    });
            });
        } catch (error) {
            console.error(`Could not join voice channel : ${error}`);
            return msg.channel.send("I could not join the voice channel");
        }
    }

    private lorembarnak = async (msg: Message, args: string[]) => {
        msg.channel.send(lorembarnak.getText(NUMBER_OF_SWEARS));
    }

    private lorembarnaktts = async (msg: Message, args: string[]) => {
        // Voice channel checks
        const voiceChannel = msg.member!.voice.channel;
        if (!voiceChannel)
            return msg.channel.send("You need to be in a voice channel to play audios!");
        const permissions = voiceChannel.permissionsFor(msg.client.user!);
        if (permissions != null && !permissions.has("CONNECT"))
            return msg.channel.send("I cannot connect to your voice channel, make sure I have the proper permissions!.");
        if (permissions != null && !permissions.has("SPEAK"))
            return msg.channel.send("I cannot speak in this voice channel, make sure I have the proper permissions!.");
        if (msg.guild != null && msg.guild.voice != null && msg.guild.voice.connection)
            return msg.channel.send("I am already in use in a voice channel!");

        const message = lorembarnak.getText(NUMBER_OF_SWEARS);
        try {
            await voiceChannel.join();
            const url = this.createUrl(message, "fr-CA");
            http.get(url, res => {
                msg.guild!.voice!.connection!.play(res)
                    .on("finish", () => {
                        msg.guild!.me!.voice.channel!.leave();
                    })
                    .on("error", (error) => {
                        console.error(`Error playing tts : ${error}`);
                    });
            });
        } catch (error) {
            console.error(`Could not join voice channel : ${error}`);
            return msg.channel.send("I could not join the voice channel");
        }
    }

    private createUrl(message: string, lang: string): string {
        const encoded = encodeURIComponent(message);
        return `http://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&q=${encoded}&client=tw-ob&textlen=${message.length}`;
    }
}
