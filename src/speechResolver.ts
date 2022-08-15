import { Model } from "stt";

export class SpeechResolver {
  private model: Model;

  public constructor() {
    this.model = new Model("./model/model.tflite");
  }

  public resolveSpeech = async (audioBuffer: Buffer): Promise<string> => {
    console.log("resolveSpeech");
    return this.model.stt(audioBuffer);
  };
}
