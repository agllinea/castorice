/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Theme-aware colors using CSS variables
                'theme': {
                    primary: 'rgb(var(--theme-primary) / <alpha-value>)',
                    secondary: 'rgb(var(--theme-secondary) / <alpha-value>)',
                    accent: 'rgb(var(--theme-accent) / <alpha-value>)',
                    background: 'rgb(var(--theme-background) / <alpha-value>)',
                    surface: 'rgb(var(--theme-surface) / <alpha-value>)',
                    hover: 'rgb(var(--theme-hover) / <alpha-value>)',
                    active: 'rgb(var(--theme-active) / <alpha-value>)',
                    text: {
                        primary: 'rgb(var(--theme-text-primary) / <alpha-value>)',
                        secondary: 'rgb(var(--theme-text-secondary) / <alpha-value>)',
                    },
                    border: 'rgb(var(--theme-border) / <alpha-value>)',
                }
            },
            backgroundColor: {
                'theme-primary': 'rgb(var(--theme-primary))',
                'theme-secondary': 'rgb(var(--theme-secondary))',
                'theme-accent': 'rgb(var(--theme-accent))',
                'theme-background': 'rgb(var(--theme-background))',
                'theme-surface': 'rgb(var(--theme-surface))',
                'theme-hover': 'rgb(var(--theme-hover))',
                'theme-active': 'rgb(var(--theme-active))',
            },
            textColor: {
                'theme-primary': 'rgb(var(--theme-text-primary))',
                'theme-secondary': 'rgb(var(--theme-text-secondary))',
                'theme-accent': 'rgb(var(--theme-primary))',
            },
            borderColor: {
                'theme': 'rgb(var(--theme-border))',
                'theme-primary': 'rgb(var(--theme-primary))',
            },
            ringColor: {
                'theme-primary': 'rgb(var(--theme-primary) / 0.5)',
            }
        },
    },
    plugins: [],
}