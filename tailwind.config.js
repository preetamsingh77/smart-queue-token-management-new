/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                'gov-navy': '#1e3a6e',
                'gov-navy-dark': '#0d2550',
                'gov-gold': '#c8a227',
                'gov-gold-light': '#dbb52e',
                'gov-slate-light': '#f8fafc',
            }
        },
    },
    plugins: [],
}
