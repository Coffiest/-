"use client";

import { useState, useRef, useCallback, useEffect, startTransition } from "react";
import { SpeechRecognizer, SUPPORTED_LANGUAGES, LangCode } from "@/lib/speech";
import { translateToJa } from "@/lib/translate";
import { saveTranscription, getUserProfile, UserProfile, FREE_SAVES_LIMIT } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import PaymentModal from "@/components/PaymentModal";

export default function AudioRecorder() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [lang, setLang] = useState<LangCode>("ja-JP");
  const [translateOn, setTranslateOn] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showMicTip, setShowMicTip] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const translateOnRef = useRef(translateOn);
  const langRef = useRef(lang);
  const finalTextRef = useRef(finalText);
  const userRef = useRef(user);
  const shouldAutoSaveRef = useRef(false);

  useEffect(() => { translateOnRef.current = translateOn; }, [translateOn]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { finalTextRef.current = finalText; }, [finalText]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(setUserProfile).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [finalText, interimText]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // Auto-save when recording stops (user-initiated stop sets shouldAutoSaveRef)
  useEffect(() => {
    if (isRecording || !shouldAutoSaveRef.current) return;
    shouldAutoSaveRef.current = false;

    const text = finalTextRef.current;
    const currentUser = userRef.current;
    if (!text.trim() || !currentUser) return;

    (async () => {
      setSaving(true);
      setError("");
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        if (!profile.isPaid && profile.saveCount >= FREE_SAVES_LIMIT) {
          setShowPaymentModal(true);
          return;
        }
        await saveTranscription(currentUser.uid, text.trim());
        setUserProfile((prev) => prev ? { ...prev, saveCount: prev.saveCount + 1 } : prev);
        setSavedMsg("保存しました！");
        setFinalText("");
        setTimeout(() => setSavedMsg(""), 3000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("permission-denied") || msg.includes("PERMISSION_DENIED")) {
          setError("保存に失敗しました: Firestoreのルール設定を確認してください");
        } else if (msg.includes("not-found")) {
          setError("Firestoreデータベースが見つかりません");
        } else {
          setError(`保存に失敗しました: ${msg}`);
        }
      } finally {
        setSaving(false);
      }
    })();
  }, [isRecording]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleLangChange = useCallback((newLang: LangCode) => {
    setLang(newLang);
    if (recognizerRef.current) recognizerRef.current.switchLang(newLang);
  }, []);

  const startRecording = useCallback(() => {
    setError("");
    setSavedMsg("");
    setElapsed(0);
    setShowMicTip(false);

    const recognizer = new SpeechRecognizer(
      async (transcript, isFinal) => {
        if (!isFinal) {
          // Low-priority update — won't block button taps on mobile
          startTransition(() => setInterimText(transcript));
          return;
        }
        startTransition(() => setInterimText(""));
        if (translateOnRef.current && langRef.current !== "ja-JP") {
          setTranslating(true);
          const translated = await translateToJa(transcript, langRef.current);
          setTranslating(false);
          startTransition(() => setFinalText((prev) => prev + translated));
        } else {
          startTransition(() => setFinalText((prev) => prev + transcript));
        }
      },
      (err) => {
        setError(err);
        setIsRecording(false);
        setInterimText("");
      },
      () => {
        setIsRecording(false);
        setInterimText("");
        setTranslating(false);
      },
      lang
    );
    recognizerRef.current = recognizer;
    recognizer.start();
    setIsRecording(true);
  }, [lang]);

  const stopRecording = useCallback(() => {
    // Flag auto-save if there's text
    shouldAutoSaveRef.current = finalTextRef.current.trim().length > 0;
    recognizerRef.current?.stop();
    recognizerRef.current = null;
  }, []);

  const handleCopyAll = async () => {
    const text = finalText + (isRecording ? interimText : "");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("コピーしました！");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  };

  const handleDownload = () => {
    const text = finalText.trim();
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logicvoice_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFinalText("");
    setInterimText("");
    setError("");
    setSavedMsg("");
    setElapsed(0);
  };

  if (!SpeechRecognizer.isSupported()) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800">
        <p className="font-medium">このブラウザは音声認識に対応していません。</p>
        <p className="text-sm mt-1">Google Chrome または Microsoft Edge をご利用ください。</p>
      </div>
    );
  }

  const displayText = finalText + (isRecording ? interimText : "");
  const isJa = lang === "ja-JP";

  return (
    <div className="space-y-3">
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {savedMsg}
        </div>
      )}
      {saving && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600" />
          自動保存中...
        </div>
      )}
      {copyMsg && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-4 py-3 text-sm">
          {copyMsg}
        </div>
      )}

      {/* 言語・翻訳・ヒント */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-500 shrink-0">言語</label>
        <select
          value={lang}
          onChange={(e) => handleLangChange(e.target.value as LangCode)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        {!isJa && (
          <button
            onClick={() => setTranslateOn((v) => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition font-medium ${
              translateOn
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            日本語に翻訳
            {translating && <span className="ml-1 animate-spin">⏳</span>}
          </button>
        )}

        <button
          onClick={() => setShowMicTip((v) => !v)}
          className="ml-auto text-xs text-gray-400 hover:text-indigo-500 transition flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          音が聞こえない場合
        </button>
      </div>

      {showMicTip && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm space-y-1">
          <p className="font-medium">音声認識の精度を上げるには：</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>OSのマイク入力音量を上げる（システム設定 → サウンド → 入力）</li>
            <li>マイクに近づいて話す（15〜30cm 目安）</li>
            <li>外付けマイクや高感度マイクを使う</li>
            <li>静かな環境で録音する</li>
          </ul>
          <p className="text-xs text-blue-500 mt-1">※ Web Speech API の仕様上、アプリ側での音量閾値の調整はできません</p>
        </div>
      )}

      {/* テキストエリア */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          readOnly
          value={displayText}
          placeholder="録音ボタンを押して話しかけてください..."
          className="w-full h-56 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 text-sm resize-none focus:outline-none leading-relaxed"
        />

        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-sm border border-red-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-mono font-medium text-red-600">{formatTime(elapsed)}</span>
          </div>
        )}

        {isRecording && interimText && (
          <div className="absolute bottom-3 left-4 right-16 pointer-events-none">
            <span className="text-indigo-400 text-sm italic opacity-80">{interimText}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {userProfile && !userProfile.isPaid && (
            userProfile.saveCount === 0
              ? "無料保存：残り 1 回"
              : "無料保存：使用済み — ¥500 の買い切りプランで無制限保存"
          )}
        </span>
        <span className="text-xs text-gray-400">{finalText.length} 文字</span>
      </div>

      {/* ボタン群 */}
      <div className="flex flex-wrap gap-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 9a1 1 0 0 1 2 0 8 8 0 0 1-7 7.94V20h3a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2h3v-2.06A8 8 0 0 1 4 10a1 1 0 0 1 2 0 6 6 0 0 0 12 0z" />
            </svg>
            録音開始
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            {finalText.trim() ? "停止して保存" : "録音停止"}
          </button>
        )}

        {/* 全コピー */}
        <button
          onClick={handleCopyAll}
          disabled={!displayText}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          全コピー
        </button>

        {/* ダウンロード */}
        <button
          onClick={handleDownload}
          disabled={!finalText.trim()}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ダウンロード
        </button>

        {/* クリア */}
        <button
          onClick={handleClear}
          disabled={!displayText && elapsed === 0}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-600 font-medium px-5 py-2.5 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          クリア
        </button>
      </div>
    </div>
  );
}
