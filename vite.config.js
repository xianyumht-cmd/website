import { defineConfig } from 'vite';
import { resolve } from 'path';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    javascriptObfuscator({
      // Scope: Only obfuscate your own code, ignore libraries to prevent errors and slow performance
      include: ["src/**/*.js", "shared/**/*.js"],
      exclude: [/node_modules/, /\.min\.js$/, "static/**/*.js"],
      
      // High Obfuscation Settings
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.2,
      debugProtection: true,
      debugProtectionInterval: 4000,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      renameGlobals: false,
      rotateStringArray: true,
      selfDefending: true,
      stringArray: true,
      stringArrayEncoding: ['rc4'],
      stringArrayThreshold: 1,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    })
  ],
  root: '.',
  base: './', 
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nav: resolve(__dirname, 'src/pages/nav/index.html'),
        rent: resolve(__dirname, 'src/pages/rent/index.html'),
        shop: resolve(__dirname, 'src/pages/shop/index.html'),
        games: resolve(__dirname, 'src/pages/games/index.html'),
        tdr: resolve(__dirname, 'src/pages/tdr/index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        about: resolve(__dirname, 'about.html'),
        notFound: resolve(__dirname, '404.html')
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('shared/')) {
            return 'shared';
          }
        }
      }
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
