"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Image src="/logo.png" alt="LogicVoice" width={52} height={52} className="rounded-xl" style={{ mixBlendMode: "multiply" }} />
          <h1 className="text-3xl font-bold text-indigo-600">LogicVoice</h1>
        </div>
        <p className="text-gray-500 text-sm">音声をテキストに変換して保存</p>
      </div>
      <AuthForm />
      <div className="absolute bottom-0 w-full">
        <Footer />
      </div>
    </main>
  );
}
