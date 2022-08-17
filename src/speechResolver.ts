import { createHash } from "crypto";
import { createWriteStream, existsSync } from "fs";
import { mkdir, readFile } from "fs/promises";
import fetch from "node-fetch";
import { dirname } from "path";
import { pipeline } from "stream/promises";
import { Model } from "stt";

const MODEL_PATH = "./model/model.tflite";
const MODEL_HASH = "jhQqNg4FDH0h2c/sfBQAFz/T+H8=";
const MODEL_URL = "https://coqui.gateway.scarf.sh/english/coqui/v1.0.0-huge-vocab/model.tflite";
const SCORER_PATH = "./model/huge-vocabulary.scorer";
const SCORER_HASH = "7sqv5n0QTT12VI6cVfdUlZSp7PA=";
const SCORER_URL = "https://coqui.gateway.scarf.sh/english/coqui/v1.0.0-huge-vocab/huge-vocabulary.scorer";

export class SpeechResolver {
  private model: Model;

  public static async create(hotWords: string[]): Promise<SpeechResolver> {
    await Promise.all([
      validateFileDownloaded(MODEL_PATH, MODEL_HASH, MODEL_URL),
      validateFileDownloaded(SCORER_PATH, SCORER_HASH, SCORER_URL),
    ]);
    return new SpeechResolver(hotWords);
  }

  private constructor(hotWords: string[]) {
    this.model = new Model(MODEL_PATH);
    this.model.enableExternalScorer(SCORER_PATH);
    for (const word of hotWords) {
      this.model.addHotWord(word, 3);
    }
  }

  public resolveSpeech = async (audioBuffer: Buffer): Promise<string> => {
    return this.model.stt(audioBuffer);
  };
}

async function validateFile(path: string, hash: string) {
  if (!existsSync(path)) {
    return false;
  }
  const file = await readFile(path);
  const calculatedHash = createHash("sha1").update(file).digest("base64");
  return calculatedHash === hash;
}

async function validateFileDownloaded(path: string, hash: string, url: string) {
  // Check if the file is already there and has the right hash.
  if (await validateFile(path, hash)) {
    return;
  }

  console.log(`Downloading "${url}"...`);

  // Create necessary folders if they don't exist.
  const folder = dirname(path);
  if (!existsSync(folder)) {
    mkdir(folder, { recursive: true });
  }

  // Download the file
  const response = await fetch(url);
  if (!response.ok || response.body == null)
    throw new Error(`There was an error while downloading ${url} : ${response.statusText}`);
  await pipeline(response.body, createWriteStream(path));

  console.log(`Finished downloading "${url}"!`);
}
