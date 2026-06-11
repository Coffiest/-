import { version } from "../../package.json";

export default function Footer() {
  return (
    <footer className="mt-auto py-4 text-center">
      <p className="text-xs text-gray-300">
        LogicVoice v{version} &nbsp;·&nbsp; © {new Date().getFullYear()} なおゆき
      </p>
    </footer>
  );
}
