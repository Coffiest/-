"use client";

import { useState, useEffect } from "react";
import {
  getTranscriptions,
  deleteTranscription,
  Transcription,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function TranscriptionHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTranscriptions(user.uid)
      .then(setItems)
      .catch(() => setError("履歴の読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("この記録を削除しますか？")) return;
    setDeleting(id);
    try {
      await deleteTranscription(user.uid, id);
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (item: Transcription) => {
    const blob = new Blob([item.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription_${item.createdAt.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) =>
    date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>保存した文字起こしはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = expanded.has(item.id);
        const preview = item.text.length > 80 ? item.text.slice(0, 80) + "..." : item.text;

        return (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
          >
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{formatDate(item.createdAt)}</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {isOpen ? item.text : preview}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.text.length > 80 && (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title={isOpen ? "折りたたむ" : "展開"}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(item)}
                  className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                  title="ダウンロード"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg transition"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
