// vue.config.js for GitHub Pages deployment
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
  },
};