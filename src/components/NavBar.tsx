"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="LogicVoice"
            width={24}
            height={24}
            className="rounded-md"
            style={{ mixBlendMode: "multiply" }}
          />
          <span className="text-base font-bold text-indigo-600">LogicVoice</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <span className="text-xs text-gray-400 hidden md:block truncate max-w-[140px]">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline text-sm">ログアウト</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
