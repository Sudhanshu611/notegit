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
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-card': 'var(--bg-card)',
        'bg-hover': 'var(--bg-hover)',
        'border-low': 'var(--border)', // align with spec `--border` mapped to Tailwind `border-low` or `border`
        'border-main': 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'primary': 'var(--accent-green)',
        'on-primary': '#0E0F11',
        'accent-green': 'var(--accent-green)',
        'accent-blue': 'var(--accent-blue)',
        'accent-amber': 'var(--accent-amber)',
        'accent-red': 'var(--accent-red)',
        'accent-purple': 'var(--accent-purple)',
        'vis-node': 'var(--vis-node)',
        'vis-edge': 'var(--vis-edge)',
        // fixed layout colors from mock html files
        'background': '#0E0F11',
        'surface': '#16181C',
        'primary-container': 'rgba(61, 220, 132, 0.1)',
        'on-primary-container': 'var(--accent-green)',
      },
      fontFamily: {
        'editor-body': ['var(--font-mono)', 'monospace'],
        'data-mono': ['var(--font-mono)', 'monospace'],
        'display-lg': ['var(--font-mono)', 'monospace'],
        'display-md': ['var(--font-mono)', 'monospace'],
        'ui-label': ['var(--font-ui)', 'sans-serif'],
        'caption-caps': ['var(--font-ui)', 'sans-serif'],
        'ai-prose': ['var(--font-ui)', 'sans-serif'],
      },
      fontSize: {
        'editor-body': ['14px', { lineHeight: '1.8', fontWeight: '400' }],
        'data-mono': ['11px', { lineHeight: '16px', fontWeight: '400' }],
        'display-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'ui-label': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '400' }],
        'caption-caps': ['11px', { lineHeight: '14px', letterSpacing: '0.1em', fontWeight: '600' }],
        'display-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'ai-prose': ['13px', { lineHeight: '20px', fontWeight: '400' }],
      },
      spacing: {
        'topbar-height': '44px',
        'sidebar-width': '240px',
        'visualizer-width': '320px',
        'editor-pad-x': '56px',
        'editor-pad-y': '48px',
        'gutter': '1rem',
      },
      borderRadius: {
        'DEFAULT': 'var(--radius-sm)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-md)',
        'xl': 'var(--radius-lg)',
        'modal': 'var(--radius-lg)',
      }
    },
  },
  plugins: [],
}
