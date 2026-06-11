import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LogicVoice",
    short_name: "LogicVoice",
    description: "音声をテキストに変換して保存",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#4f46e5",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
