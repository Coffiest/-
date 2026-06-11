import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "LogicVoice - 音声文字起こし",
  description: "Web Speech API を使ったリアルタイム音声文字起こしアプリ",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${noto.className} bg-gray-50 min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
