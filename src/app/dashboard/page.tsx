export const dynamic = "force-dynamic";

import AudioRecorder from "@/components/AudioRecorder";
import FirebaseDebug from "@/components/FirebaseDebug";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <FirebaseDebug />
      <h2 className="text-xl font-bold text-gray-800">音声文字起こし</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <AudioRecorder />
      </div>
    </div>
  );
}
