import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    UnoCSS({
      shortcuts: {
        'btn': 'bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600',
        'btn-outline': 'bg-transparent border border-gray-600 text-gray-300 py-2 px-4 rounded hover:bg-gray-700',
        'card': 'bg-gray-800 rounded-lg p-4',
        'container': 'max-w-6xl mx-auto px-4'
      },
      theme: {
        colors: {
          primary: '#0d1117',
          secondary: '#161b22',
          accent: '#58a6ff',
          success: '#2ea043',
          warning: '#d29922',
          error: '#f85149',
          border: '#30363d',
          'text-primary': '#e6edf3',
          'text-secondary': '#8b949e',
        }
      }
    }),
    svelte(),
  ],
})
