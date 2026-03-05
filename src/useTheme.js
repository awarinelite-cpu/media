// src/hooks/useTheme.js
// Dark / light mode — persisted to localStorage + syncs with system preference

import { useState, useEffect, createContext, useContext } from "react";

// ─── Context ───────────────────────────────────────────────────────────────
const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Provider — wrap your entire <App /> with this ─────────────────────────
// Usage in index.js:
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Check localStorage first
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    // 2. Fall back to OS preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    // Apply theme class to <html> element (used by Tailwind dark: classes)
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for OS theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function setSpecificTheme(t) {
    setTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setSpecificTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── TOGGLE BUTTON COMPONENT ───────────────────────────────────────────────
// Drop anywhere — sidebar, settings panel, navbar

export function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-full transition-all ${dark ? "text-amber-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
        title={`Switch to ${dark ? "light" : "dark"} mode`}
      >
        {dark ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 00-1.06-1.061L6.166 6.166z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    );
  }

  // Full toggle with animated pill
  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
        {dark ? "🌙 Dark" : "☀️ Light"}
      </span>
      <button
        onClick={toggleTheme}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${dark ? "bg-sky-500" : "bg-gray-300"}`}
        aria-label="Toggle theme"
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${dark ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

// ─── THEME SELECTOR — 3 options: Dark / Light / System ────────────────────
export function ThemeSelector() {
  const { theme, setSpecificTheme } = useTheme();

  const options = [
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "light", label: "Light", icon: "☀️" },
    { value: "system", label: "System", icon: "💻" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            if (opt.value === "system") {
              localStorage.removeItem("theme");
              const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
              setSpecificTheme(sys);
            } else {
              setSpecificTheme(opt.value);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
            theme === opt.value
              ? "bg-sky-500 text-white border-sky-500"
              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
          }`}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
