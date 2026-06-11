"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePurchase = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? "No URL returned");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not configured")) {
        setError("決済機能はまだ設定されていません。管理者にお問い合わせください。");
      } else {
        setError("決済の開始に失敗しました。もう一度お試しください。");
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            無料保存を使い切りました
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            無制限プランをご購入いただくと、
            <br />
            何度でも保存できます。
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 text-center">
          <p className="text-4xl font-bold text-indigo-600 mb-1">¥500</p>
          <p className="text-sm text-gray-500">買い切り・無制限保存</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          {loading ? "処理中..." : "¥500 で購入する"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2 transition"
        >
          キャンセル
        </button>

        <p className="text-xs text-gray-300 text-center mt-4">
          Stripe による安全な決済
        </p>
      </div>
    </div>
  );
}
