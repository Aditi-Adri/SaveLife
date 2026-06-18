import { useState } from "react";
import "./ThemeToggle.css";

const KEY = "savelife_theme";

// Floating day/night toggle. The current theme lives on <html data-theme>,
// which is set before paint by the inline script in index.html.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark"
  );

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore storage errors */
    }
    setTheme(next);
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
      aria-label="Toggle day/night mode"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
