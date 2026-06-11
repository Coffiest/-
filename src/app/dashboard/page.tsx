"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { markUserAsPaid } from "@/lib/firestore";
import AudioRecorder from "@/components/AudioRecorder";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (sessionStorage.getItem("justPaid") === "1") {
      sessionStorage.removeItem("justPaid");
      setJustPaid(true);
      setTimeout(() => setJustPaid(false), 6000);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    router.replace("/dashboard");

    fetch(`/api/verify-payment?session_id=${sessionId}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (data.paid) {
          await markUserAsPaid(user.uid);
          sessionStorage.setItem("justPaid", "1");
          window.location.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [user, router]);

  return (
    <div>
      {justPaid && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
          ご購入ありがとうございます！無制限プランが有効になりました。
        </div>
      )}
      <h2 className="text-xl font-bold text-gray-800 mb-6">音声文字起こし</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <AudioRecorder />
      </div>
    </div>
  );
}
