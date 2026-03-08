import { defineConfig } from 'vite';
import { resolve } from 'path';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    {
      name: 'rewrite-down-path',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/down/')) {
            req.url = req.url.replace('/down/', '/src/pages/');
          }
          next();
        });
      }
    },
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
      unicodeEscapeSequence: false,
      
      // Domain Lock
      domainLock: [
        "xn--8pv109c.top", // 脚本.top (Punycode)
        "www.xn--8pv109c.top",
        "localhost",       // For local development
        "127.0.0.1"        // For local development
      ]
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 0,
      filter: /\.(js|mjs|css|html)$/i,
      deleteOriginFile: false
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 0,
      filter: /\.(js|mjs|css|html)$/i,
      deleteOriginFile: false
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
      },
      plugins: [
        visualizer({
          filename: 'dist/bundle-report.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
          open: false
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
