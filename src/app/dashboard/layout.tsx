"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";

const tabs = [
  {
    href: "/dashboard",
    label: "録音",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/history",
    label: "履歴",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-32">
        {children}
      </main>

      {/* Apple UIKit glass bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-sm mx-auto">
          <nav className="bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-black/10 rounded-2xl p-1.5 flex gap-1">
            {tabs.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : "text-gray-500 active:scale-95 hover:text-gray-800"
                  }`}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
