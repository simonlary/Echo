import {
  EndBehaviorType,
  entersState,
  getVoiceConnection,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Awaitable, Client, User, VoiceBasedChannel } from "discord.js";
import prism from "prism-media";
import { SpeechResolver } from "./speechResolver.js";

// Based a lot on `discord-speech-recognition` : https://github.com/Rei-x/discord-speech-recognition

export interface VoiceMessage {
  audioBuffer: Buffer;
  author: User;
  channel: VoiceBasedChannel;
  client: Client;
  connection: VoiceConnection;
  content?: string;
}

export type ClientWithSpeech = Client & {
  on(event: "speech", listener: (message: VoiceMessage) => Awaitable<void>): ClientWithSpeech;
};

export function wrapClientWithSpeech(client: Client, audioCommands: string[], group: string): ClientWithSpeech {
  const speechResolver = new SpeechResolver(audioCommands);

  return client.on("voiceStateUpdate", async (_oldVoiceState, newVoiceState) => {
    const channel = newVoiceState.channel;
    if (channel == null) {
      return;
    }

    const connection = getVoiceConnection(channel.guild.id, group);

    if (connection != null && !isSpeechHandlerAttachedToConnection(connection)) {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

      // `handleSpeechEventOnConnectionReceiver` needs to be a named function for the `isSpeechHandlerAttachedToConnection` "hack" to work
      connection.receiver.speaking.on("start", function handleSpeechEventOnConnectionReceiver(authorId) {
        const author = client.users.cache.get(authorId);
        if (author == null || author.bot) {
          return;
        }

        const opusStream = connection.receiver.subscribe(authorId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000,
          },
        });

        const buffers: Buffer[] = [];
        opusStream
          .pipe(new prism.opus.Decoder({ rate: 48_000, channels: 2, frameSize: 960 }))
          .pipe(
            new prism.FFmpeg({
              args: [
                "-analyzeduration",
                "0",
                "-loglevel",
                "0",
                "-f",
                "s16le",
                "-ar",
                "48000",
                "-ac",
                "2",
                "-i",
                "-",
                "-f",
                "s16le",
                "-ar",
                "16000",
                "-ac",
                "1",
              ],
            })
          )
          .on("data", (chunk) => {
            buffers.push(chunk);
          })
          .on("end", async () => {
            const resultBuffer = Buffer.concat(buffers);

            const message: VoiceMessage = {
              author,
              audioBuffer: resultBuffer,
              channel,
              client,
              connection,
              content: await speechResolver.resolveSpeech(resultBuffer),
            };
            client.emit("speech", message);
          });
      });
    }
  });
}

function isSpeechHandlerAttachedToConnection(connection: VoiceConnection): boolean {
  return connection.receiver.speaking
    .listeners("start")
    .some((f) => f.name === "handleSpeechEventOnConnectionReceiver");
}
