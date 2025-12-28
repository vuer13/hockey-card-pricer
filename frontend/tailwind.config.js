/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {},
        colors: {
            primary: "#1E40AF",
            secondary: "#F59E0B",
            accent: "#10B981",
            light: {
                100: "#F9FAFB",
                200: "#F3F4F6",
                300: "#E5E7EB",
            },
            dark: {
                100: "#1F2937",
                200: "#374151",
                300: "#4B5563",
            },
            background: "#F3F4F6",
            text: "#111827",
            border: "#E5E7EB",
        }
    },
    plugins: [],
}