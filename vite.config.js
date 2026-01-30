import { defineConfig } from 'vite';
import { resolve } from 'path';
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

export default defineConfig({
  root: '.',
  base: './', // Relative paths for static deployment
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nav: resolve(__dirname, 'down/nav/index.html'),
        tdr: resolve(__dirname, 'down/tdr/index.html')
      },
      output: {
        // Manual chunking to ensure code splitting works as expected
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('shared/')) {
            return 'shared';
          }
        }
      },
      plugins: [
        javascriptObfuscator({
          compact: true,
          controlFlowFlattening: false, // Disabled for performance/simplicity
          deadCodeInjection: false,     // Disabled to reduce size
          debugProtection: false,       // Disabled per user request
          debugProtectionInterval: 0,
          disableConsoleOutput: true,   // Keep this to hide logs
          identifierNamesGenerator: 'mangled', // Shorten variable names (a, b, c)
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: false,         // Disabled per user request
          stringArray: true,
          stringArrayEncoding: ['none'], // Light encoding
          stringArrayThreshold: 0.75,
          transformObjectKeys: false,
          unicodeEscapeSequence: false
        })
      ]
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
