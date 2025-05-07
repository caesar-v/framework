import { defineConfig, presetUno, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Montserrat:400,700',
        heading: 'Poppins:600,700'
      }
    })
  ],
  theme: {
    colors: {
      // Classic Theme Colors
      primary: '#121e2c',
      secondary: '#1c2a3a',
      accent: '#ffcc00',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      border: '#2c3e50',
      'text-primary': '#ffffff',
      'text-secondary': '#a0b0c5',
    }
  },
  shortcuts: {
    'btn': 'bg-accent text-primary py-2 px-4 rounded font-bold hover:opacity-90 transition-all transform hover:translate-y-[-2px]',
    'btn-outline': 'bg-transparent border border-accent text-accent py-2 px-4 rounded hover:bg-accent/10 transition-colors',
    'quick-bet': 'flex-1 bg-primary text-text-primary border border-border py-1 px-2 rounded cursor-pointer hover:bg-secondary',
    'spin-btn': 'bg-accent text-primary border-none py-3 px-6 rounded text-lg font-bold cursor-pointer w-full hover:opacity-90 transition-all',
    'card': 'bg-secondary rounded-lg p-4 shadow-md',
    'container': 'max-w-6xl mx-auto px-4',
    'input': 'text-center py-2 px-4 bg-primary text-text-primary border border-border rounded'
  }
})