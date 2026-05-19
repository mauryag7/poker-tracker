"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Bug 12 fix: start as null so server and client render the same (nothing)
  // until the effect runs and reads the real theme from localStorage/classList
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  // Render nothing on the server / before hydration to avoid mismatch
  if (theme === null) return null;

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label="Toggle Theme"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
