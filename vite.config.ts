import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({ reactivityTransform: true })],
  publicDir: './example/public',
  // base: '/monaco-logger/',
  // build: {
  //   outDir: 'docs',
  //   assetsDir: 'monaco-logger',
  // },
  resolve: {
    alias: {
      '@src': '/src/'
    }
  }
})
