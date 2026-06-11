export type SpeechCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechErrorCallback = (error: string) => void;

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private onResult: SpeechCallback;
  private onError: SpeechErrorCallback;
  private onEnd: () => void;
  private stopped = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

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

  private createRecognition(): SpeechRecognition {
    const SpeechRecognitionClass =
      window.webkitSpeechRecognition ?? window.SpeechRecognition;

    const r = new SpeechRecognitionClass();
    r.lang = "ja-JP";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        this.onResult(event.results[i][0].transcript, event.results[i].isFinal);
      }
    };

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      // no-speech / network は無音や一時的な切断なので自動復帰、エラー表示しない
      if (event.error === "no-speech" || event.error === "network") return;
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        this.stopped = true;
        const messages: Record<string, string> = {
          "not-allowed": "マイクへのアクセスが拒否されました。",
          "audio-capture": "マイクが見つかりません。",
        };
        this.onError(messages[event.error]);
      }
    };

    r.onend = () => {
      if (this.stopped) {
        this.onEnd();
        return;
      }
      // ユーザーが停止していなければ自動再起動
      this.restartTimer = setTimeout(() => {
        if (!this.stopped) this.restart();
      }, 200);
    };

    return r;
  }

  private restart(): void {
    this.recognition = this.createRecognition();
    try {
      this.recognition.start();
    } catch {
      // already started などは無視
    }
  }

  start(): void {
    if (!SpeechRecognizer.isSupported()) {
      this.onError("このブラウザは音声認識に対応していません。Chrome または Edge をご利用ください。");
      return;
    }
    this.stopped = false;
    this.restart();
  }

  stop(): void {
    this.stopped = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.recognition?.stop();
    this.recognition = null;
    this.onEnd();
  }
}
