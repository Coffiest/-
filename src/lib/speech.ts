export type SpeechCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechErrorCallback = (error: string) => void;

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private onResult: SpeechCallback;
  private onError: SpeechErrorCallback;
  private onEnd: () => void;

  constructor(
    onResult: SpeechCallback,
    onError: SpeechErrorCallback,
    onEnd: () => void
  ) {
    this.onResult = onResult;
    this.onError = onError;
    this.onEnd = onEnd;
  }

  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }

  start(): void {
    if (!SpeechRecognizer.isSupported()) {
      this.onError("このブラウザは音声認識に対応していません。");
      return;
    }

    const SpeechRecognitionClass =
      window.webkitSpeechRecognition ?? window.SpeechRecognition;

    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = "ja-JP";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.onResult(result[0].transcript, result.isFinal);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messages: Record<string, string> = {
        "not-allowed": "マイクへのアクセスが拒否されました。",
        "no-speech": "音声が検出されませんでした。",
        "network": "ネットワークエラーが発生しました。",
        "audio-capture": "マイクが見つかりません。",
      };
      this.onError(messages[event.error] ?? `エラー: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.onEnd();
    };

    this.recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }
}
