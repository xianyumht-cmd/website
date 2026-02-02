import { defineConfig } from 'vite';
import { resolve } from 'path';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  root: '.',
  base: './', // Relative paths for static deployment
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nav: resolve(__dirname, 'down/nav/index.html'),
        games: resolve(__dirname, 'down/games/index.html'),
        tdr: resolve(__dirname, 'down/tdr/index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        about: resolve(__dirname, 'about.html'),
        notFound: resolve(__dirname, '404.html')
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
          controlFlowFlattening: true,        // Enable control flow flattening
          controlFlowFlatteningThreshold: 1,  // Maximize the effect
          deadCodeInjection: true,            // Inject dead code
          deadCodeInjectionThreshold: 0.2,
          debugProtection: true,              // Enable anti-debugging
          debugProtectionInterval: 4000,      // Check every 4 seconds
          disableConsoleOutput: true,         // Disable console output
          identifierNamesGenerator: 'hexadecimal', // Use hex names for harder reading
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: true,                // Enable self-defending code
          stringArray: true,
          stringArrayEncoding: ['rc4'],       // Stronger string encryption
          stringArrayThreshold: 1,            // Encrypt all strings
          transformObjectKeys: true,
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
