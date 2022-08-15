import {
  EndBehaviorType,
  entersState,
  getVoiceConnection,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Awaitable, Client, User, VoiceBasedChannel } from "discord.js";
import OpusScript from "opusscript";
import { resolveSpeech } from "./resolveSpeech.js";

// Based a lot on `discord-speech-recognition` : https://github.com/Rei-x/discord-speech-recognition

export interface VoiceMessage {
  audioBuffer: Buffer;
  author: User;
  channel: VoiceBasedChannel;
  client: Client;
  connection: VoiceConnection;
  content?: string;
  duration: number;
}

export type ClientWithSpeech = Client & {
  on(event: "speech", listener: (message: VoiceMessage) => Awaitable<void>): ClientWithSpeech;
};

const SAMPLING_RATE = 48_000;
const CHANNELS = 2;
const encoder = new OpusScript(SAMPLING_RATE, CHANNELS, OpusScript.Application.AUDIO);

export function wrapClientWithSpeech(client: Client, option: { group?: string } = {}): ClientWithSpeech {
  return client.on("voiceStateUpdate", async (_oldVoiceState, newVoiceState) => {
    const channel = newVoiceState.channel;
    if (channel == null) {
      return;
    }

    const connection = getVoiceConnection(channel.guild.id, option.group);

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

        const bufferData: Uint8Array[] = [];
        opusStream
          .on("data", (chunk) => {
            bufferData.push(encoder.decode(chunk));
          })
          .on("end", async () => {
            const stereoBuffer = Buffer.concat(bufferData);
            const monoBuffer = convertStereoToMono(stereoBuffer);

            const message: VoiceMessage = {
              author,
              audioBuffer: stereoBuffer,
              channel,
              client,
              connection,
              content: await resolveSpeech(monoBuffer),
              duration: monoBuffer.length / SAMPLING_RATE / CHANNELS,
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

function convertStereoToMono(input: Buffer): Buffer {
  const stereoData = new Int16Array(input);
  const monoData = new Int16Array(stereoData.length / 2);
  for (let i = 0, j = 0; i < stereoData.length; i += 4) {
    monoData[j] = stereoData[i];
    j += 1;
    monoData[j] = stereoData[i + 1];
    j += 1;
  }
  return Buffer.from(monoData);
}
