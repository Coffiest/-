export const dynamic = "force-dynamic";

import TranscriptionHistory from "@/components/TranscriptionHistory";

export default function HistoryPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">文字起こし履歴</h2>
      <TranscriptionHistory />
    </div>
  );
}
