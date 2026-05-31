/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed": "#ffdad7",
        "on-primary-container": "#00422b",
        "outline": "#6c7a71",
        "on-secondary": "#ffffff",
        "tertiary-fixed-dim": "#ffb3af",
        "surface-dim": "#d4dcd5",
        "surface-container-highest": "#dde4dd",
        "on-tertiary-fixed": "#410005",
        "category-meat": "#ef4444",
        "secondary-fixed-dim": "#bacac3",
        "surface-container": "#e8f0e9",
        "error": "#ba1a1a",
        "on-secondary-fixed-variant": "#3b4a44",
        "on-tertiary-container": "#711419",
        "surface-bright": "#f4fbf4",
        "primary": "#006c49",
        "surface-variant": "#dde4dd",
        "on-background": "#161d19",
        "surface": "#f4fbf4",
        "outline-variant": "#bbcabf",
        "category-produce": "#22c55e",
        "on-surface": "#161d19",
        "secondary": "#52625c",
        "category-dairy": "#3b82f6",
        "secondary-container": "#d3e3dc",
        "surface-container-low": "#eef6ee",
        "primary-container": "#10b981",
        "on-tertiary": "#ffffff",
        "background": "#f4fbf4",
        "on-primary-fixed-variant": "#005236",
        "error-container": "#ffdad6",
        "inverse-primary": "#4edea3",
        "primary-fixed": "#6ffbbe",
        "on-tertiary-fixed-variant": "#842225",
        "inverse-on-surface": "#ebf3eb",
        "secondary-fixed": "#d5e6df",
        "on-primary-fixed": "#002113",
        "on-secondary-container": "#566660",
        "primary-fixed-dim": "#4edea3",
        "on-surface-variant": "#3c4a42",
        "text-primary": "#1f2937",
        "on-error-container": "#93000a",
        "tertiary-container": "#fc7c78",
        "on-error": "#ffffff",
        "surface-tint": "#006c49",
        "inverse-surface": "#2b322d",
        "tertiary": "#a43a3a",
        "text-secondary": "#6b7280",
        "surface-container-high": "#e3eae3",
        "on-secondary-fixed": "#101e1a",
        "surface-container-lowest": "#ffffff",
        "on-primary": "#ffffff",
        "surface-bg": "#f9fafb",
        "border-subtle": "#e5e7eb"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      },
      spacing: {
        "stack-sm": "0.5rem",
        "margin-mobile": "1rem",
        "stack-md": "1rem",
        "stack-lg": "1.5rem",
        "gutter": "1rem"
      },
      fontFamily: {
        "body-lg": ["var(--font-sans)"],
        "headline-md": ["var(--font-sans)"],
        "headline-lg": ["var(--font-sans)"],
        "label-sm": ["var(--font-sans)"],
        "code-sm": ["var(--font-mono)"],
        "body-md": ["var(--font-sans)"]
      },
      fontSize: {
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "500"}],
        "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "headline-lg": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
        "code-sm": ["12px", {"lineHeight": "16px", "fontWeight": "400"}],
        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}]
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        marquee: 'marquee 15s linear infinite'
      }
    }
  },
  plugins: [],
}