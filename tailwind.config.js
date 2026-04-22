/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "var(--color-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary": "var(--color-on-primary)",
        "surface": "var(--color-surface)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "outline-variant": "var(--color-outline-variant)",
        "tertiary": "var(--color-tertiary)",
        "success": "var(--color-success)",
        "warning": "var(--color-warning)",
        "error": "var(--color-error)",
        "error-container": "var(--color-error-container)",
        "on-error-container": "var(--color-on-error-container)"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px"
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
