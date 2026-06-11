export const dynamic = "force-dynamic";

import AudioRecorder from "@/components/AudioRecorder";

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">音声文字起こし</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <AudioRecorder />
      </div>
    </div>
  );
}
