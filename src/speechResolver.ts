import { Model } from "stt";

export class SpeechResolver {
  private model: Model;

  public constructor(hotWords: string[]) {
    this.model = new Model("./model/model.tflite");
    this.model.enableExternalScorer("./model/huge-vocabulary.scorer");
    for (const word of hotWords) {
      this.model.addHotWord(word, 3);
    }
  }

  public resolveSpeech = async (audioBuffer: Buffer): Promise<string> => {
    const result = this.model.stt(audioBuffer);
    return result;
  };
}
