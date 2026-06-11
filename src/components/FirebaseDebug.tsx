"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function FirebaseDebug() {
  const { user } = useAuth();
  const [result, setResult] = useState("");
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    setResult("");

    const cfg = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    };

    let log = `📋 設定値確認:\n`;
    log += `  apiKey: ${cfg.apiKey ? cfg.apiKey.slice(0, 8) + "..." : "❌ 未設定"}\n`;
    log += `  projectId: ${cfg.projectId ?? "❌ 未設定"}\n`;
    log += `  authDomain: ${cfg.authDomain ?? "❌ 未設定"}\n`;
    log += `  user: ${user?.uid ?? "❌ 未ログイン"}\n\n`;

    setResult(log + "⏳ Firestore接続テスト中...");

    try {
      const ref = await Promise.race([
        addDoc(collection(db, "_debug"), {
          ts: serverTimestamp(),
          uid: user?.uid ?? "anon",
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT_10s")), 10000)
        ),
      ]);
      setResult(log + `✅ 接続成功！ doc id: ${(ref as { id: string }).id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult(log + `❌ エラー: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-yellow-800">🔧 Firebase 診断ツール（デバッグ用）</p>
      <button
        onClick={runTest}
        disabled={testing}
        className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        {testing ? "テスト中..." : "接続テストを実行"}
      </button>
      {result && (
        <pre className="text-xs bg-white border border-yellow-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-gray-800">
          {result}
        </pre>
      )}
    </div>
  );
}
