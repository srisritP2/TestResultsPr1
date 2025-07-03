// vue.config.js for GitHub Pages deployment
// Set publicPath to match the repository name for correct asset loading
module.exports = {
  publicPath: '/TestResultsPr1/'
};module.exports = {
  publicPath: '/TestResultsPr1/',
  lintOnSave: false,
  devServer: {
    port: 8080,
    open: true,
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src'),
      },
    },
  },
};