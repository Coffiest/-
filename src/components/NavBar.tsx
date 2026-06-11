"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { version } from "../../package.json";

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLink = (href: string, label: string, icon: React.ReactNode) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
          active ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* ロゴ + ブランド名 */}
          <Link href="/dashboard" className="flex items-center gap-2 mr-4">
            <Image
              src="/logo.png"
              alt="LogicVoice"
              width={28}
              height={28}
              className="rounded-md"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-indigo-600">LogicVoice</span>
              <span className="text-xs text-gray-400 font-mono">v{version}</span>
            </div>
          </Link>

          {navLink(
            "/dashboard",
            "録音",
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          {navLink(
            "/dashboard/history",
            "履歴",
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[160px]">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}
