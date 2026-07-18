import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    {
      name: 'rewrite-down-path',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/down/')) {
            req.url = req.url.replace('/down/', '/src/pages/');
          } else if (req.url.startsWith('/assets/')) {
            req.url = req.url.replace('/assets/', '/src/assets/');
          }
          next();
        });
      }
    }
  ],
  root: '.',
  base: './',
  assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2', '**/*.svg', '**/*.ico'],
  optimizeDeps: {
    include: ['axios'],
    entries: [
      'index.html',
      'src/pages/nav/index.html',
      'src/pages/games/index.html',
      'src/pages/tdr/index.html',
      'about.html',
      'privacy.html',
      '404.html'
    ]
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
    rollupOptions: {
      external: (id) => /^https?:\/\//.test(id),
      input: {
        main: resolve(__dirname, 'index.html'),
        nav: resolve(__dirname, 'src/pages/nav/index.html'),
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
      plugins: process.env.ANALYZE_BUNDLE === '1' ? [
        visualizer({
          filename: 'dist/bundle-report.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
          open: false
        })
      ] : []
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
