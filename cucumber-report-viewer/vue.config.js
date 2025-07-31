// vue.config.js for GitHub Pages deployment with performance optimizations
const path = require('path');

module.exports = {
  publicPath: '/TestResultsPr1/',
  lintOnSave: false,
  devServer: {
    port: 8080,
    open: true,
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          vuetify: {
            test: /[\\/]node_modules[\\/]vuetify[\\/]/,
            name: 'vuetify',
            chunks: 'all',
          },
        },
      },
    },
  },
  chainWebpack: config => {
    // Enable gzip compression
    config.plugin('CompressionPlugin').use(require('compression-webpack-plugin'), [{
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }]);

    // Optimize images
    config.module
      .rule('images')
      .test(/\.(gif|png|jpe?g|svg)$/i)
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 85 },
        optipng: { enabled: false },
        pngquant: { quality: [0.65, 0.90], speed: 4 },
        gifsicle: { interlaced: false },
        webp: { quality: 85 }
      });

    // Tree shaking for Vuetify (only if plugin exists)
    if (config.plugins.has('VuetifyLoaderPlugin')) {
      config.plugin('VuetifyLoaderPlugin').tap(args => {
        args[0].theme = {
          themes: {
            light: {
              primary: '#3B82F6',
              secondary: '#64748B',
            },
            dark: {
              primary: '#60A5FA',
              secondary: '#94A3B8',
            }
          }
        };
        return args;
      });
    }
  },
  // PWA for caching
  pwa: {
    name: 'Cucumber Report Viewer',
    themeColor: '#3B82F6',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets',
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        }
      ]
    }
  }
};