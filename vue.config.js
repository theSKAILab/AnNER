const webpack = require("webpack");

module.exports = {
  publicPath: "/AnNER/",
  // publicPath: process.env.NODE_ENV === "production" ? "/TeAM-NER/" : "/",

  pluginOptions: {
    quasar: {
      importStrategy: "kebab",
      rtlSupport: false,
    }
  },

  pwa: {
      name: "AnNER: Annotation and Named Entity Review Tool",
      themeColor: '#002a5c',
      msTileColor: '#002a5c',
      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
      }
  },

  configureWebpack: (config) => {
    return {
      plugins: [
        new webpack.DefinePlugin({
          APPLICATION_VERSION: JSON.stringify(
            require("./package.json").version
          ),
        }),
      ],
       devtool: 'source-map'
    };
  },

  transpileDependencies: ["quasar"],
};
