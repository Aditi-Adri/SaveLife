import { useState } from "react";
import "./ThemeToggle.css";

const KEY = "savelife_theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark"
  );

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch {}
    setTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle day/night mode"
    >
      <span className="tt-icon">{isDark ? "☀" : "🌙"}</span>
      <span className="tt-label">{isDark ? "Day" : "Night"}</span>
    </button>
  );
}
