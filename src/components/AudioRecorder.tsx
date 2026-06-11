"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SpeechRecognizer, SUPPORTED_LANGUAGES, LangCode } from "@/lib/speech";
import { saveTranscription } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function AudioRecorder() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [lang, setLang] = useState<LangCode>("ja-JP");
  const [showMicTip, setShowMicTip] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = useCallback(() => {
    setError("");
    setSavedMsg("");
    setElapsed(0);
    setShowMicTip(false);
    const recognizer = new SpeechRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          setFinalText((prev) => prev + transcript);
          setInterimText("");
        } else {
          setInterimText(transcript);
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
      },
      lang
    );
    recognizerRef.current = recognizer;
    recognizer.start();
    setIsRecording(true);
  }, [lang]);

  const stopRecording = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
  }, []);

  const handleSave = async () => {
    if (!user || !finalText.trim()) return;
    setSaving(true);
    try {
      await saveTranscription(user.uid, finalText.trim());
      setSavedMsg("保存しました！");
      setFinalText("");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-4">
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

      {/* 言語選択 + マイクヒント */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm text-gray-500 shrink-0">言語</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            disabled={isRecording}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowMicTip((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 transition"
          title="小さい音が認識されない場合"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          小さい音が聞こえない場合
        </button>
      </div>

      {showMicTip && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm space-y-1">
          <p className="font-medium">音声認識の精度を上げるには：</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>OSのマイク入力音量を上げる（システム設定 → サウンド → 入力）</li>
            <li>マイクに近づいて話す（15〜30cm が目安）</li>
            <li>外付けマイクや高感度マイクを使う</li>
            <li>静かな環境で録音する</li>
          </ul>
          <p className="text-xs text-blue-500 mt-1">※ Web Speech API の仕様上、アプリ側での音量閾値の調整はできません</p>
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          readOnly
          value={displayText}
          placeholder="録音ボタンを押して話しかけてください..."
          className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 text-sm resize-none focus:outline-none leading-relaxed"
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

      <p className="text-xs text-gray-400 text-right">{finalText.length} 文字</p>

      <div className="flex flex-wrap gap-3">
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
            録音停止
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={!finalText.trim() || saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          {saving ? "保存中..." : "保存"}
        </button>

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
