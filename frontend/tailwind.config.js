/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          bg: "#080b11",
          card: "#0f1623",
          cardHover: "#152033",
          border: "#1e293b",
          borderBright: "#334155",
          accent: "#2563eb",
          accentHover: "#1d4ed8",
          critical: "#ef4444",
          high: "#f97316",
          warning: "#eab308",
          normal: "#10b981",
          muted: "#94a3b8"
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
