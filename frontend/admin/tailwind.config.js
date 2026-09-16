/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm paper surfaces (replaces cold MD3 gray-green)
        'surface-dim': '#e7e0d4',
        'surface-bright': '#fffcf5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#faf6ec',
        'surface-container': '#f3ecdd',
        'surface-container-high': '#ede4d0',
        'surface-container-highest': '#e6dcc4',
        'on-surface': '#251d0f',
        'on-surface-variant': '#6b6152',
        'inverse-surface': '#3a3122',
        'inverse-on-surface': '#fdf6e8',
        outline: '#948a76',
        'outline-variant': '#dcd3bd',
        'surface-tint': '#c1502e',

        // Sunset terracotta — the new brand primary (no more green)
        primary: '#c1502e',
        'on-primary': '#ffffff',
        'primary-container': '#fce3d4',
        'on-primary-container': '#7a2913',
        'inverse-primary': '#f7b896',

        // Deep plum/berry — secondary accent
        secondary: '#7a2f52',
        'on-secondary': '#ffffff',
        'secondary-container': '#f6dfeb',
        'on-secondary-container': '#4a1830',

        // Muted gold — tertiary accent for variety/highlights
        tertiary: '#a9782f',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#f7ead0',
        'on-tertiary-container': '#5c4213',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#fbf6ea',
        'on-background': '#251d0f',
        'surface-variant': '#e6dcc4',

        'status-active': '#227a4c',
        'status-warning': '#c9701a',
        'status-error': '#c6362e',
        'status-locked': '#5c5648',
        'status-future': '#2467ad',

        'wallet-credit': '#227a4c',
        'wallet-debit': '#c6362e',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        jakarta: ['"Fraunces"', 'serif'],
        hanken: ['"Hanken Grotesk"', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.625rem',
        md: '0.875rem',
        lg: '1.25rem',
        xl: '1.75rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(37,29,15,0.04), 0 2px 8px rgba(37,29,15,0.06)',
        'card-hover': '0 2px 4px rgba(37,29,15,0.06), 0 8px 20px rgba(37,29,15,0.10)',
        popover: '0 8px 24px rgba(37,29,15,0.14), 0 2px 6px rgba(37,29,15,0.08)',
      },
    },
  },
  plugins: [],
}
